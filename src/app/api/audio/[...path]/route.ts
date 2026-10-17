import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { existsSync, readFileSync } from 'fs';
import { resolve, sep } from 'path';
import { connectionNotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withRlsUser } from '@/lib/db/auth-wrapper';
import {
  isValidUserAudioKey,
  isR2Configured,
  getPrivateAudioFromR2,
  decryptAudioBuffer,
} from '@/lib/audio-storage';
import { logError, generateRequestId } from '@/lib/security';

const EXT_TO_MIME: Record<string, string> = {
  webm: 'audio/webm',
  mp4: 'audio/mp4',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
};

function inferAudioMimeFromKey(key: string, fallbackMime?: string | null): string {
  if (fallbackMime && fallbackMime.startsWith('audio/')) {
    return fallbackMime;
  }
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_MIME[ext] ?? 'audio/webm';
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const requestId = generateRequestId();

  try {
    const resolvedParams = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Strict segment validation: must be ['private-audio', '<userId>', '<32hex>.<ext>']
    if (
      !Array.isArray(resolvedParams.path) ||
      resolvedParams.path.length !== 3 ||
      resolvedParams.path.some(
        (seg) =>
          !seg ||
          seg === '.' ||
          seg.includes('..') ||
          seg.includes('/') ||
          seg.includes('\\') ||
          seg.includes('\0') ||
          /%2e|%2f|%5c/i.test(seg)
      ) ||
      resolvedParams.path[0] !== 'private-audio' ||
      resolvedParams.path[1] !== user.id
    ) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const key = resolvedParams.path.join('/');

    // Enforce that the audio key strictly belongs to the authenticated user's namespace
    if (!isValidUserAudioKey(key, user.id)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Optional DB lookup under RLS to retrieve recorded MIME type metadata
    const note = await withRlsUser(user, (tx) =>
      tx.query.connectionNotes.findFirst({
        where: and(
          eq(connectionNotes.audioStoragePath, key),
          eq(connectionNotes.ownerUserId, user.id)
        ),
      })
    );

    const contentType = inferAudioMimeFromKey(key, note?.audioMimeType);

    if (!isR2Configured()) {
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Local uploads not supported in production', { status: 501 });
      }

      const uploadDir = resolve(process.cwd(), 'private-uploads');
      const resolvedPath = resolve(uploadDir, key);

      if (resolvedPath !== uploadDir && !resolvedPath.startsWith(`${uploadDir}${sep}`)) {
        return new NextResponse('Invalid path', { status: 400 });
      }

      if (!existsSync(resolvedPath)) {
        return new NextResponse('Not found', { status: 404 });
      }

      const decryptedBuffer = decryptAudioBuffer(readFileSync(resolvedPath));
      return new NextResponse(new Uint8Array(decryptedBuffer), {
        headers: {
          'Content-Type': contentType,
          'Content-Length': decryptedBuffer.length.toString(),
          'Cache-Control': 'private, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    const decryptedBuffer = await getPrivateAudioFromR2(key);

    if (!decryptedBuffer) {
      return new NextResponse('Not found', { status: 404 });
    }

    return new NextResponse(new Uint8Array(decryptedBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': decryptedBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchKey') {
      return new NextResponse('Not found', { status: 404 });
    }
    logError({ operation: 'audio.GET', requestId, error });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
