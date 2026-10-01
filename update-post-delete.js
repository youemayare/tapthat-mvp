const fs = require('fs');
let content = fs.readFileSync('src/app/api/connections/route.ts', 'utf8');

if (!content.includes('import { deleteAudioFromStorage }')) {
  content = content.replace("import { and, eq } from 'drizzle-orm';", "import { and, eq } from 'drizzle-orm';\nimport { deleteAudioFromStorage } from '@/lib/audio-storage';");
}

const target = `    return await withRlsUser(user, async (tx) => {
      await tx
        .delete(connections)
        .where(and(eq(connections.viewerUserId, user.id), eq(connections.profileId, profileId)));
      return NextResponse.json({ success: true });
    });`;

const replacement = `    return await withRlsUser(user, async (tx) => {
      // Find the connection first to get the ID
      const connection = await tx.query.connections.findFirst({
        where: and(eq(connections.viewerUserId, user.id), eq(connections.profileId, profileId))
      });

      if (connection) {
        // Fetch the note before deletion to get the audio path
        const note = await tx.query.connectionNotes.findFirst({
          where: eq(connectionNotes.connectionId, connection.id)
        });

        await tx
          .delete(connections)
          .where(and(eq(connections.viewerUserId, user.id), eq(connections.profileId, profileId)));
          
        if (note?.audioStoragePath) {
          deleteAudioFromStorage(note.audioStoragePath);
        }
      }

      return NextResponse.json({ success: true });
    });`;

content = content.replace(target.replace(/\r/g, ''), replacement);

fs.writeFileSync('src/app/api/connections/route.ts', content);
console.log('done route fix');
