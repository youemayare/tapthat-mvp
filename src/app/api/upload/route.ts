import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { buildStorageKey, getPublicUrl } from '@/lib/r2';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as 'avatar' | 'logo' | 'cv';

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
    }

    // 1. Rate Limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
    const { uploadRatelimit } = await import('@/lib/ratelimit');
    const { success: allowed } = await uploadRatelimit.limit(ip);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // 2. Size Limit (5MB) - Check size BEFORE reading into buffer
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. Magic Bytes Validation
    const fileTypeResult = await fileTypeFromBuffer(buffer);
    if (!fileTypeResult) {
      return NextResponse.json({ error: 'Could not determine file type' }, { status: 400 });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    // Only allow PDF if it's a CV
    if (type === 'cv') {
      allowedMimeTypes.push('application/pdf');
    }

    if (!allowedMimeTypes.includes(fileTypeResult.mime)) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
    }

    // We do NOT trust file.name. We use a randomly generated name and the validated extension.
    const safeFilename = `${crypto.randomBytes(16).toString('hex')}.${fileTypeResult.ext}`;
    const key = buildStorageKey(user.id, type, safeFilename);

    // Local fallback for development if R2 is not configured
    if (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.includes('your-r2')) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Local file uploads are not supported in production.' }, { status: 501 });
      }

      const uploadDir = resolve(process.cwd(), 'public', 'uploads');
      const resolvedPath = resolve(uploadDir, key);
      
      // Ensure path traversal did not happen despite our safe filename (defense-in-depth)
      const { sep } = await import('path');
      if (resolvedPath !== uploadDir && !resolvedPath.startsWith(`${uploadDir}${sep}`)) {
         return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
      }

      mkdirSync(dirname(resolvedPath), { recursive: true });
      writeFileSync(resolvedPath, buffer);
      
      const publicUrl = `/uploads/${key}`;
      return NextResponse.json({ publicUrl, key });
    }

    // Server-side direct upload to R2
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
      ContentType: fileTypeResult.mime,
      Body: buffer,
    }));
    
    // Generate the final public URL
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ publicUrl, key });
  } catch (error: any) {
    console.error('Direct upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload' }, { status: 500 });
  }
}
