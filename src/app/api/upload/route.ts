import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { buildStorageKey, getPublicUrl } from '@/lib/r2';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

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

    const key = buildStorageKey(user.id, type, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    // Local fallback for development if R2 is not configured
    if (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.includes('your-r2')) {
      const filePath = join(process.cwd(), 'public', 'uploads', key);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, buffer);
      
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
      ContentType: file.type,
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
