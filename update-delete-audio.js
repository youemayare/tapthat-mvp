const fs = require('fs');
let content = fs.readFileSync('src/app/api/connections/[id]/route.ts', 'utf8');

if (!content.includes('import { deleteAudioFromStorage }')) {
  content = content.replace("import { and, eq } from 'drizzle-orm';", "import { and, eq } from 'drizzle-orm';\nimport { deleteAudioFromStorage } from '@/lib/audio-storage';");
}

const target = `        if (newNoteContent === '' && newAudioPath === null) {
          // Delete note entirely if both are empty
          await tx.delete(connectionNotes)
            .where(and(eq(connectionNotes.connectionId, connectionId), eq(connectionNotes.ownerUserId, user.id)));
        } else {`;
        
const replacement = `        if (newNoteContent === '' && newAudioPath === null) {
          // Delete note entirely if both are empty
          await tx.delete(connectionNotes)
            .where(and(eq(connectionNotes.connectionId, connectionId), eq(connectionNotes.ownerUserId, user.id)));
          
          if (existingNote?.audioStoragePath) {
            deleteAudioFromStorage(existingNote.audioStoragePath);
          }
        } else {`;
        
const target2 = `          } else if (hasAudio && audio === null) {
            updateData.audioStoragePath = null;
            updateData.audioMimeType = null;
            updateData.audioSize = null;
            updateData.audioDuration = null;
          }

          await tx.insert(connectionNotes)`;
          
const replacement2 = `          } else if (hasAudio && audio === null) {
            updateData.audioStoragePath = null;
            updateData.audioMimeType = null;
            updateData.audioSize = null;
            updateData.audioDuration = null;
            
            if (existingNote?.audioStoragePath) {
              deleteAudioFromStorage(existingNote.audioStoragePath);
            }
          }

          await tx.insert(connectionNotes)`;

content = content.replace(target.replace(/\r/g, ''), replacement);
content = content.replace(target2.replace(/\r/g, ''), replacement2);

fs.writeFileSync('src/app/api/connections/[id]/route.ts', content);
console.log('done route edit');
