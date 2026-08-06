import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ENDPOINT = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

/** Generate a presigned URL for direct browser → R2 uploads (PUT). */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/** Generate a presigned URL for private file downloads (GET). */
export async function getDownloadUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/** Delete a file from R2. */
export async function deleteFile(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Build the public URL for a file stored in R2.
 * Requires the R2 bucket to have public access enabled.
 */
export function getPublicUrl(key: string): string {
  const baseUrl = PUBLIC_URL.replace(/\/+$/, '');
  return `${baseUrl}/${key}`;
}

/**
 * Generate a storage key for user uploads.
 * Format: {userId}/{type}/{uuid}.{ext}
 */
export function buildStorageKey(
  userId: string,
  type: 'avatar' | 'logo' | 'cv',
  filename: string
): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'bin';
  const id = crypto.randomUUID();
  return `${userId}/${type}/${id}.${ext}`;
}
