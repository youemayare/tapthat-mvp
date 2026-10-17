import { S3Client, DeleteObjectCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { unlink } from 'fs/promises';
import { resolve, sep } from 'path';
import crypto from 'crypto';

const ENCRYPTION_HEADER = Buffer.from('TAYZENC1', 'ascii'); // 8-byte magic header
const IV_LENGTH = 12; // 96-bit IV for AES-256-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit GCM auth tag

const USER_AUDIO_KEY_REGEX = /^private-audio\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([a-f0-9]{32}\.(?:webm|mp4|m4a|ogg|oga|mp3|wav|aac))$/i;

/**
 * Validates that an audio storage key is well-formed, free of traversal segments,
 * and strictly scoped to the given authenticated user's namespace.
 */
export function isValidUserAudioKey(key: unknown, userId: string): key is string {
  if (typeof key !== 'string') return false;
  const match = USER_AUDIO_KEY_REGEX.exec(key);
  if (!match) return false;
  return match[1].toLowerCase() === userId.toLowerCase();
}

/**
 * Returns true if R2 credentials are configured for cloud object storage.
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
    !process.env.R2_ACCESS_KEY_ID.includes('your-r2') &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_ACCOUNT_ID
  );
}

/**
 * Resolves the target R2 bucket for private voice notes.
 * Prefers a dedicated private bucket (`R2_PRIVATE_BUCKET_NAME`) and falls back to `R2_BUCKET_NAME`.
 */
export function getPrivateAudioBucket(): string {
  const bucket = process.env.R2_PRIVATE_BUCKET_NAME?.trim() || process.env.R2_BUCKET_NAME?.trim();
  if (!bucket) {
    throw new Error('FATAL: Neither R2_PRIVATE_BUCKET_NAME nor R2_BUCKET_NAME is configured.');
  }
  return bucket;
}

export function getPrivateR2Client(): S3Client {
  const endpoint = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function getAudioEncryptionKey(): Buffer {
  const secret =
    process.env.AUDIO_ENCRYPTION_SECRET?.trim() ||
    process.env.HMAC_SECRET_KEY?.trim() ||
    process.env.EXCHANGE_TOKEN_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.ADMIN_SECURITY_PIN?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: Server secret required for private audio encryption in production.'
      );
    }
    return crypto
      .createHmac('sha256', 'dev-only-audio-encryption-secret')
      .update('tayz-private-audio-aes-256-gcm-v1')
      .digest();
  }

  return crypto
    .createHmac('sha256', secret)
    .update('tayz-private-audio-aes-256-gcm-v1')
    .digest();
}

/**
 * Encrypts a raw audio buffer with AES-256-GCM before storing in R2.
 * Even if the underlying bucket has public read enabled, the stored object
 * is opaque ciphertext (`application/octet-stream`) and cannot be played directly.
 */
export function encryptAudioBuffer(plainBuffer: Buffer): Buffer {
  const key = getAudioEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([ENCRYPTION_HEADER, iv, authTag, encrypted]);
}

/**
 * Decrypts an AES-256-GCM encrypted audio buffer fetched from storage.
 * Backwards-compatible with legacy unencrypted audio objects that lack the `TAYZENC1` header.
 */
export function decryptAudioBuffer(storedBuffer: Buffer): Buffer {
  if (
    storedBuffer.length < ENCRYPTION_HEADER.length + IV_LENGTH + AUTH_TAG_LENGTH ||
    !storedBuffer.subarray(0, ENCRYPTION_HEADER.length).equals(ENCRYPTION_HEADER)
  ) {
    return storedBuffer;
  }

  const key = getAudioEncryptionKey();
  const ivStart = ENCRYPTION_HEADER.length;
  const tagStart = ivStart + IV_LENGTH;
  const dataStart = tagStart + AUTH_TAG_LENGTH;

  const iv = storedBuffer.subarray(ivStart, tagStart);
  const authTag = storedBuffer.subarray(tagStart, dataStart);
  const ciphertext = storedBuffer.subarray(dataStart);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export async function putPrivateAudioToR2(key: string, plainBuffer: Buffer): Promise<void> {
  const s3Client = getPrivateR2Client();
  const encryptedBody = encryptAudioBuffer(plainBuffer);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: getPrivateAudioBucket(),
      Key: key,
      // Store as opaque binary ciphertext so direct public bucket URLs cannot sniff or play audio
      ContentType: 'application/octet-stream',
      CacheControl: 'private, no-store',
      Body: encryptedBody,
    })
  );
}

export async function getPrivateAudioFromR2(key: string): Promise<Buffer | null> {
  const s3Client = getPrivateR2Client();
  const getObj = await s3Client.send(
    new GetObjectCommand({
      Bucket: getPrivateAudioBucket(),
      Key: key,
    })
  );

  if (!getObj.Body) {
    return null;
  }

  const byteArray = await getObj.Body.transformToByteArray();
  return decryptAudioBuffer(Buffer.from(byteArray));
}

export async function deleteAudioFromStorage(key: string) {
  if (!key || !USER_AUDIO_KEY_REGEX.test(key)) return;

  try {
    if (!isR2Configured()) {
      if (process.env.NODE_ENV !== 'production') {
        const uploadDir = resolve(process.cwd(), 'private-uploads');
        const resolvedPath = resolve(uploadDir, key);
        if (resolvedPath.startsWith(`${uploadDir}${sep}`)) {
          await unlink(resolvedPath).catch(() => {});
        }
      }
      return;
    }

    const s3Client = getPrivateR2Client();
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: getPrivateAudioBucket(),
        Key: key,
      })
    );
  } catch (error) {
    console.error(`Failed to delete audio from storage (${key}):`, error);
  }
}
