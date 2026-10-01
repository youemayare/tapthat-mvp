const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/connection-card.tsx', 'utf8');

if (!content.includes('import { VoiceRecorder }')) {
  content = content.replace("import { Textarea } from '@/components/ui/textarea';", "import { Textarea } from '@/components/ui/textarea';\nimport { VoiceRecorder } from '@/components/profile/voice-recorder';");
}

const target = `<DialogHeader>
            <DialogTitle>Private Note for {fullName}</DialogTitle>
            <DialogDescription>
              This note is only visible to you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Where did you meet? What should you follow up on?"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[120px] resize-none rounded-xl"
            />
          </div>
          <DialogFooter className="sm:justify-between flex-row gap-2">`;

const replacement = `<DialogHeader>
            <DialogTitle>Private Note for {fullName}</DialogTitle>
            <DialogDescription>
              This note is only visible to you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 flex flex-col gap-3">
            <Textarea 
              placeholder="Where did you meet? What should you follow up on?"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[100px] resize-none rounded-xl"
            />
            <VoiceRecorder 
              onRecordingComplete={(blob, duration) => {
                setAudioBlob(blob);
                setAudioDuration(duration);
                setRemoveAudio(false);
              }}
              onClear={() => {
                setAudioBlob(null);
                setAudioDuration(0);
                setRemoveAudio(true);
              }}
              existingAudioUrl={!removeAudio && !audioBlob && note?.audioStoragePath ? \`/api/audio/\${note.audioStoragePath.split('/').slice(1).join('/')}\` : undefined}
            />
          </div>
          <DialogFooter className="sm:justify-between flex-row gap-2">`;

// Handle carriage returns
content = content.replace(target.replace(/\r/g, ''), replacement);
content = content.replace(target, replacement);

fs.writeFileSync('src/components/dashboard/connection-card.tsx', content);
console.log('done');
