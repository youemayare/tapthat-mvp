import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, existsSync } from 'fs';
import { resolve } from 'path';
import { connectionNotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // path array e.g. ['private-audio', 'user-id', 'uuid.webm']
    const key = resolvedParams.path.join('/');

    // Validate ownership via DB (the user must own a connection note with this audioStoragePath)
    // Defense-in-depth: If the path strictly contains the user's ID, that also works, but checking DB is best.
    const note = await db.query.connectionNotes.findFirst({
      where: and(
        eq(connectionNotes.audioStoragePath, key),
        eq(connectionNotes.ownerUserId, user.id)
      )
    });

    if (!note) {
      // It's possible the note isn't saved yet if they just recorded it. 
      // So allow access if the key starts with private-audio/their-user-id/
      if (!key.startsWith(`private-audio/${user.id}/`)) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    if (!process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID.includes('your-r2')) {
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Local uploads not supported in prod', { status: 501 });
      }

      const uploadDir = resolve(process.cwd(), 'private-uploads');
      const resolvedPath = resolve(uploadDir, key);

      const { sep } = await import('path');
      if (resolvedPath !== uploadDir && !resolvedPath.startsWith(`${uploadDir}${sep}`)) {
        return new NextResponse('Invalid path', { status: 400 });
      }

      if (!existsSync(resolvedPath)) {
        return new NextResponse('Not found', { status: 404 });
      }

      const stream = createReadStream(resolvedPath);
      // @ts-ignore - node stream to web stream
      return new NextResponse(stream, {
        headers: {
          'Content-Type': note?.audioMimeType || 'audio/webm',
          'Cache-Control': 'private, max-age=3600',
        }
      });
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

    const getObj = await s3Client.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }));

    if (!getObj.Body) {
      return new NextResponse('Not found', { status: 404 });
    }

    return new NextResponse(getObj.Body as any, {
      headers: {
        'Content-Type': getObj.ContentType || 'audio/webm',
        'Content-Length': getObj.ContentLength?.toString() || '',
        'Cache-Control': 'private, max-age=3600',
        'Accept-Ranges': 'bytes',
      }
    });

  } catch (error: any) {
    console.error('Audio fetch error:', error);
    if (error.name === 'NoSuchKey') {
      return new NextResponse('Not found', { status: 404 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
