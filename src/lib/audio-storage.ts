import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { unlink } from 'fs/promises';
import { resolve } from 'path';

export async function deleteAudioFromStorage(key: string) {
  if (!key) return;
  
  try {
    if (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.includes('your-r2')) {
      if (process.env.NODE_ENV !== 'production') {
        const uploadDir = resolve(process.cwd(), 'private-uploads');
        const resolvedPath = resolve(uploadDir, key);
        await unlink(resolvedPath).catch(() => {}); // ignore errors
      }
      return;
    }

    const R2_ENDPOINT = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }));
  } catch (error) {
    console.error(`Failed to delete audio from storage (${key}):`, error);
  }
}
