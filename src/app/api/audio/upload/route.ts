import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, sep } from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import {
  isR2Configured,
  putPrivateAudioToR2,
  encryptAudioBuffer,
} from '@/lib/audio-storage';
import { logError, generateRequestId } from '@/lib/security';

const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB limit for 30s audio

const ALLOWED_AUDIO_MIMES = new Set([
  'audio/webm',
  'video/webm',
  'audio/mp4',
  'video/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/ogg',
  'application/ogg',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
]);

const ALLOWED_AUDIO_EXTS = new Set([
  'webm',
  'mp4',
  'm4a',
  'ogg',
  'oga',
  'mp3',
  'wav',
  'aac',
]);

export async function POST(req: Request) {
  const requestId = generateRequestId();

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

    if (!file || file.size <= 0) {
      return NextResponse.json({ error: 'Missing or empty file' }, { status: 400 });
    }

    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
    }

    const duration = durationStr ? parseInt(durationStr, 10) : 0;
    if (Number.isNaN(duration) || duration < 0 || duration > 30) {
      return NextResponse.json({ error: 'Audio duration must be between 0 and 30 seconds' }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Strict magic-byte signature inspection (never trust client Content-Type header)
    const fileTypeResult = await fileTypeFromBuffer(rawBuffer);
    const detectedMime = fileTypeResult?.mime ?? '';
    const detectedExt = fileTypeResult?.ext?.toLowerCase() ?? '';

    if (
      !fileTypeResult ||
      !ALLOWED_AUDIO_MIMES.has(detectedMime) ||
      !ALLOWED_AUDIO_EXTS.has(detectedExt)
    ) {
      return NextResponse.json({ error: 'Invalid or unsupported audio file format' }, { status: 400 });
    }

    // Normalize MediaRecorder container MIME types (video/webm -> audio/webm, video/mp4 -> audio/mp4)
    const finalMime = detectedMime === 'application/ogg'
      ? 'audio/ogg'
      : detectedMime.replace(/^video\//, 'audio/');
    const finalExt = detectedExt;

    // Save in private-audio/{user_id}/{32-hex-chars}.{ext}
    const safeFilename = `${crypto.randomBytes(16).toString('hex')}.${finalExt}`;
    const key = `private-audio/${user.id}/${safeFilename}`;

    if (!isR2Configured()) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Local uploads not supported in production' }, { status: 501 });
      }

      const uploadDir = resolve(process.cwd(), 'private-uploads');
      const resolvedPath = resolve(uploadDir, key);

      if (resolvedPath !== uploadDir && !resolvedPath.startsWith(`${uploadDir}${sep}`)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
      }

      mkdirSync(dirname(resolvedPath), { recursive: true });
      writeFileSync(resolvedPath, encryptAudioBuffer(rawBuffer));

      return NextResponse.json({ key, size: file.size, mime: finalMime, duration });
    }

    // Store in isolated private R2 bucket (or fallback bucket) encrypted at rest with AES-256-GCM
    await putPrivateAudioToR2(key, rawBuffer);

    // Return only the opaque key — never a public URL
    return NextResponse.json({ key, size: file.size, mime: finalMime, duration });

  } catch (error: unknown) {
    logError({ operation: 'audio.upload.POST', requestId, error });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
