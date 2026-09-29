import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRlsUser } from '@/lib/db/auth-wrapper';
import { connectionNotes } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { deleteAudioFromStorage } from '@/lib/audio-storage';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return await withRlsUser(user, async (tx) => {
    const body = await req.json();
    const { note, audio } = body;
    const { id: connectionId } = await params;

    try {
      const hasNote = note !== undefined;
      const hasAudio = audio !== undefined;
      
      if (hasNote || hasAudio) {
        // Fetch existing note to check if we need to delete it
        const existingNote = await tx.query.connectionNotes.findFirst({
          where: and(eq(connectionNotes.connectionId, connectionId), eq(connectionNotes.ownerUserId, user.id))
        });

        const newNoteContent = hasNote ? (note === null ? '' : note) : (existingNote?.content || '');
        const newAudioPath = hasAudio ? (audio === null ? null : audio.audioStoragePath) : existingNote?.audioStoragePath;

        if (newNoteContent === '' && newAudioPath === null) {
          // Delete note entirely if both are empty
          await tx.delete(connectionNotes)
            .where(and(eq(connectionNotes.connectionId, connectionId), eq(connectionNotes.ownerUserId, user.id)));
          
          if (existingNote?.audioStoragePath) {
            deleteAudioFromStorage(existingNote.audioStoragePath);
          }
        } else {
          // Upsert note
          const insertData: any = {
            connectionId: connectionId,
            ownerUserId: user.id,
            content: newNoteContent,
          };
          const updateData: any = {
            content: newNoteContent,
            updatedAt: new Date()
          };

          if (hasAudio && audio !== null) {
            insertData.audioStoragePath = audio.audioStoragePath;
            insertData.audioMimeType = audio.audioMimeType;
            insertData.audioSize = audio.audioSize;
            insertData.audioDuration = audio.audioDuration;

            updateData.audioStoragePath = audio.audioStoragePath;
            updateData.audioMimeType = audio.audioMimeType;
            updateData.audioSize = audio.audioSize;
            updateData.audioDuration = audio.audioDuration;
          } else if (hasAudio && audio === null) {
            updateData.audioStoragePath = null;
            updateData.audioMimeType = null;
            updateData.audioSize = null;
            updateData.audioDuration = null;
            
            if (existingNote?.audioStoragePath) {
              deleteAudioFromStorage(existingNote.audioStoragePath);
            }
          }

          await tx.insert(connectionNotes)
            .values(insertData)
            .onConflictDoUpdate({
              target: [connectionNotes.connectionId, connectionNotes.ownerUserId],
              set: updateData
            });
        }
      }
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: unknown) {
      console.error('[connections PATCH]', err);
      return NextResponse.json({ error: 'Failed to update connection note' }, { status: 500 });
    }
  });
}
