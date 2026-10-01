const fs = require('fs');

// 1. Update VoiceRecorder Props and Confirm
let vrContent = fs.readFileSync('src/components/profile/voice-recorder.tsx', 'utf8');

// Add existingAudioDuration to interface
vrContent = vrContent.replace(
  'existingAudioUrl?: string;',
  'existingAudioUrl?: string;\n  existingAudioDuration?: number;'
);
vrContent = vrContent.replace(
  'existingAudioUrl }: VoiceRecorderProps',
  'existingAudioUrl, existingAudioDuration }: VoiceRecorderProps'
);

// Initialize recordingTime with existingAudioDuration
vrContent = vrContent.replace(
  'const [recordingTime, setRecordingTime] = useState(0);',
  'const [recordingTime, setRecordingTime] = useState(existingAudioDuration || 0);'
);

// Add confirmation to handleClear
vrContent = vrContent.replace(
  'const handleClear = () => {',
  `const handleClear = () => {
    if (existingAudioUrl) {
      if (!window.confirm("Are you sure you want to delete this voice note?")) {
        return;
      }
    }`
);

fs.writeFileSync('src/components/profile/voice-recorder.tsx', vrContent);


// 2. Update Connection Note Modal to pass down the duration
let modalContent = fs.readFileSync('src/components/profile/connection-note-modal.tsx', 'utf8');
modalContent = modalContent.replace(
  'existingAudioUrl?: string;',
  'existingAudioUrl?: string;\n  existingAudioDuration?: number;'
);
modalContent = modalContent.replace(
  'existingAudioUrl\n}: ConnectionNoteModalProps',
  'existingAudioUrl,\n  existingAudioDuration\n}: ConnectionNoteModalProps'
);
modalContent = modalContent.replace(
  'existingAudioUrl={existingAudioUrl}',
  'existingAudioUrl={existingAudioUrl}\n            existingAudioDuration={existingAudioDuration}'
);
fs.writeFileSync('src/components/profile/connection-note-modal.tsx', modalContent);


// 3. Update ConnectionCard to fix URL, pass duration, and render playable audio in preview
let cardContent = fs.readFileSync('src/components/dashboard/connection-card.tsx', 'utf8');

// Fix the URL inside the modal VoiceRecorder usage
cardContent = cardContent.replace(
  'existingAudioUrl={!removeAudio && !audioBlob && note?.audioStoragePath ? `/api/audio/${note.audioStoragePath.split(\'/\').slice(1).join(\'/\')}` : undefined}',
  'existingAudioUrl={!removeAudio && !audioBlob && note?.audioStoragePath ? `/api/audio/${note.audioStoragePath}` : undefined}\n                existingAudioDuration={note?.audioDuration || 0}'
);

// Add the playable audio below the text note preview
const targetPreview = `{note?.audioStoragePath && (
               <div className="flex items-center gap-1.5 text-xs text-amber-500/80 mt-1 font-medium">
                 <Mic className="w-3 h-3" /> Voice Note {note.audioDuration ? \`(\${Math.floor(note.audioDuration/60)}:\${(note.audioDuration%60).toString().padStart(2, '0')})\` : ''}
               </div>
             )}`;

const replacementPreview = `{note?.audioStoragePath && (
               <div className="flex flex-col gap-2 mt-2 border-t border-amber-500/20 pt-2 pointer-events-auto">
                 <div className="flex items-center gap-1.5 text-xs text-amber-500/80 font-medium">
                   <Mic className="w-3 h-3" /> Voice Note
                 </div>
                 <audio controls src={\`/api/audio/\${note.audioStoragePath}\`} className="h-8 w-full" preload="metadata" />
               </div>
             )}`;

cardContent = cardContent.replace(targetPreview, replacementPreview);

fs.writeFileSync('src/components/dashboard/connection-card.tsx', cardContent);

console.log('done updating components');
