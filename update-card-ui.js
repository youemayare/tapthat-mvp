const fs = require('fs');

let cardContent = fs.readFileSync('src/components/dashboard/connection-card.tsx', 'utf8');

if (!cardContent.includes('import { AudioPlayer }')) {
  cardContent = cardContent.replace(
    "import { VoiceRecorder } from '@/components/profile/voice-recorder';",
    "import { VoiceRecorder } from '@/components/profile/voice-recorder';\nimport { AudioPlayer } from '@/components/ui/audio-player';"
  );
}

const targetPreview = `<audio controls src={\`/api/audio/\${note.audioStoragePath}\`} className="h-8 w-full" preload="metadata" />`;
const replacementPreview = `<AudioPlayer src={\`/api/audio/\${note.audioStoragePath}\`} duration={note?.audioDuration || 0} />`;

cardContent = cardContent.replace(targetPreview, replacementPreview);

fs.writeFileSync('src/components/dashboard/connection-card.tsx', cardContent);
console.log('done updating connection card');
