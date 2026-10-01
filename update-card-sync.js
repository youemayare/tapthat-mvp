const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/connection-card.tsx', 'utf8');

const regex = /if \(audioMetadata !== undefined\) \{\s*note\.audioStoragePath = audioMetadata \? audioMetadata\.audioStoragePath : null;\s*\}/;

const replacement = `if (audioMetadata !== undefined) {
          if (note) {
            note.audioStoragePath = audioMetadata ? audioMetadata.audioStoragePath : null;
            note.audioDuration = audioMetadata ? audioMetadata.audioDuration : null;
          }
        }`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/components/dashboard/connection-card.tsx', content);
  console.log('Fixed audioDuration in ConnectionCard');
} else {
  console.log('Target string not found');
}
