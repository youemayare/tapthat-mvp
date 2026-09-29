import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB limit for 30s audio

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
    const { uploadRatelimit } = await import('@/lib/ratelimit');
    const { success: allowed, reset } = await uploadRatelimit.limit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const durationStr = formData.get('duration') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: `File exceeds 5MB limit` }, { status: 400 });
    }

    const duration = durationStr ? parseInt(durationStr, 10) : 0;
    if (duration > 30) {
      return NextResponse.json({ error: `Audio exceeds 30 seconds limit` }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    const fileTypeResult = await fileTypeFromBuffer(rawBuffer);
    if (!fileTypeResult || !fileTypeResult.mime.startsWith('audio/')) {
      return NextResponse.json({ error: 'Only audio files are allowed' }, { status: 400 });
    }

    const finalMime = fileTypeResult.mime;
    const finalExt = fileTypeResult.ext;

    // Save in private-audio/user_id/random.ext
    const safeFilename = `${crypto.randomBytes(16).toString('hex')}.${finalExt}`;
    const key = `private-audio/${user.id}/${safeFilename}`;

    if (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.includes('your-r2')) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Local uploads not supported in prod' }, { status: 501 });
      }

      const uploadDir = resolve(process.cwd(), 'private-uploads');
      const resolvedPath = resolve(uploadDir, key);

      const { sep } = await import('path');
      if (resolvedPath !== uploadDir && !resolvedPath.startsWith(`${uploadDir}${sep}`)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
      }

      mkdirSync(dirname(resolvedPath), { recursive: true });
      writeFileSync(resolvedPath, rawBuffer);

      return NextResponse.json({ key, size: file.size, mime: finalMime, duration });
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

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: finalMime,
      Body: rawBuffer,
    }));

    // We do NOT return a public URL, just the key.
    return NextResponse.json({ key, size: file.size, mime: finalMime, duration });

  } catch (error: unknown) {
    console.error('Audio upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
