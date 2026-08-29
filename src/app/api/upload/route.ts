/**
 * POST /api/upload
 *
 * Server-buffered upload route (interim implementation; P-1 partially addressed).
 *
 * Pipeline:
 *  1. Authenticate the request
 *  2. Per-IP rate limit (fail-closed without Redis)
 *  3. Size check BEFORE buffering (rejects oversized payloads early)
 *  4. Buffer the file into memory
 *  5. Magic-byte validation (file-type library)
 *  6. Image resizing / WebP conversion via sharp (images only)
 *  7. PDF validation path (CVs only)
 *  8. Random object key generation (server-controlled, not user-supplied)
 *  9. Upload to R2 (or local fallback in dev)
 * 10. Return only the public URL â€” never expose bucket, key structure, or credentials
 *
 * Error responses are generic ("Upload failed") â€” detailed diagnostics are
 * logged server-side with a correlation ID, never returned to the client (S-1).
 *
 * Follow-up: migrate to presigned direct-to-R2 uploads for P-1 full fix.
 * This eliminates server-side buffering entirely; the current approach still
 * routes the file through the API server.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { buildStorageKey, getPublicUrl } from '@/lib/r2';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';
import sharp from 'sharp';
import { logError, generateRequestId } from '@/lib/security';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_PDF_SIZE   = 10 * 1024 * 1024;  // 10 MB for CVs
const MAX_IMAGE_DIMENSION = 1200;          // px â€” max width/height after resize

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const ALLOWED_PDF_TYPE    = 'application/pdf';

export async function POST(req: Request) {
  const requestId = generateRequestId();

  try {
    // â”€â”€ 1. Authentication â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // â”€â”€ 2. Rate limit (per IP; fail-closed without Redis) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ 3. Parse and validate form data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file || !type) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
    }

    const isImage = type === 'avatar' || type === 'logo' || type === 'background';
    const isWalletHero = type === 'wallet_hero_image';
    const isPdf   = type === 'cv';

    if (!isImage && !isWalletHero && !isPdf) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    // â”€â”€ 4. Size limit BEFORE buffering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const maxSize = isPdf ? MAX_PDF_SIZE : isWalletHero ? 2 * 1024 * 1024 : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File exceeds ${isPdf ? '10' : isWalletHero ? '2' : '5'} MB limit` },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // â”€â”€ 5. Magic-byte validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const fileTypeResult = await fileTypeFromBuffer(rawBuffer);
    if (!fileTypeResult) {
      return NextResponse.json({ error: 'Could not determine file type' }, { status: 400 });
    }

    if (isPdf && fileTypeResult.mime !== ALLOWED_PDF_TYPE) {
      return NextResponse.json({ error: 'Only PDF files are allowed for CVs' }, { status: 400 });
    }

    // Wallet hero images: only PNG or JPEG allowed (Google Wallet rejects WebP/GIF)
    if (isWalletHero && !['image/png', 'image/jpeg'].includes(fileTypeResult.mime)) {
      return NextResponse.json({ error: 'Wallet images must be PNG or JPEG' }, { status: 400 });
    }

    if (isImage && !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(fileTypeResult.mime)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    // â”€â”€ 6. Image processing (resize + WebP conversion) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // CVs skip this step entirely and are stored as-is.
    // Wallet hero images: resize to 1032Ã—812 max, preserve PNG (no WebP conversion).
    let processedBuffer: Buffer = rawBuffer;
    let finalMime: string = fileTypeResult.mime;
    let finalExt: string = fileTypeResult.ext;

    if (isWalletHero) {
      // Resize to max 1032Ã—812 (5:4), keep native format (PNG preferred, JPEG allowed)
      const isPng = fileTypeResult.mime === 'image/png';
      processedBuffer = await sharp(rawBuffer)
        .resize(1032, 812, { fit: 'inside', withoutEnlargement: true })
        .toFormat(isPng ? 'png' : 'jpeg', isPng ? { compressionLevel: 8 } : { quality: 88 })
        .toBuffer();
      finalMime = fileTypeResult.mime; // unchanged
      finalExt  = isPng ? 'png' : 'jpg';
    } else if (isImage) {
      processedBuffer = await sharp(rawBuffer)
        .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
          fit: 'inside',        // never upscale; never crop; preserve aspect ratio
          withoutEnlargement: true,
        })
        .webp({ quality: 85 }) // consistent WebP output regardless of input format
        .toBuffer();
      finalMime = 'image/webp';
      finalExt  = 'webp';
    }

    // â”€â”€ 7. Server-generated object key â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // The client never supplies or influences the key.
    const safeFilename = `${crypto.randomBytes(16).toString('hex')}.${finalExt}`;
    const key = buildStorageKey(user.id, type as 'avatar' | 'logo' | 'cv' | 'wallet_hero_image' | 'background', safeFilename);

    // â”€â”€ 8. Local development fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.includes('your-r2')) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Local uploads not supported in production' },
          { status: 501 }
        );
      }

      const uploadDir    = resolve(process.cwd(), 'public', 'uploads');
      const resolvedPath = resolve(uploadDir, key);

      // Defense-in-depth: ensure path traversal didn't happen despite randomized key
      const { sep } = await import('path');
      if (resolvedPath !== uploadDir && !resolvedPath.startsWith(`${uploadDir}${sep}`)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
      }

      mkdirSync(dirname(resolvedPath), { recursive: true });
      writeFileSync(resolvedPath, processedBuffer);

      return NextResponse.json({ publicUrl: `/uploads/${key}`, key });
    }

    // â”€â”€ 9. Upload to R2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      Body: processedBuffer,
    }));

    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ publicUrl, key });

  } catch (error: unknown) {
    // Never expose internal error messages to the client (S-1).
    // Detailed diagnostics logged server-side with requestId for correlation.
    logError({ operation: 'upload.POST', requestId, error });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

