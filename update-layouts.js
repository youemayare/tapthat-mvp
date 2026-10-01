const fs = require('fs');

const files = [
  'src/components/profile/layouts/canvas-profile-layout.tsx',
  'src/components/profile/layouts/classic-profile-layout.tsx',
  'src/components/profile/layouts/identity-profile-layout.tsx',
  'src/components/profile/layouts/professional-profile-layout.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  const regex = /<Dialog open={showNoteModal}[\s\S]*?<\/Dialog>/;
  const replacement = `<ConnectionNoteModal
        open={showNoteModal}
        onOpenChange={setShowNoteModal}
        profile={profile}
        noteContent={noteContent}
        setNoteContent={setNoteContent}
        setAudioBlob={actions.setAudioBlob}
        setAudioDuration={actions.setAudioDuration}
        savingNote={savingNote}
        onSave={handleSaveConnectionAndNote}
      />`;
      
  content = content.replace(regex, replacement);
  
  if (!content.includes('import { ConnectionNoteModal }')) {
    content = content.replace(
      "import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';",
      "import { ConnectionNoteModal } from '../connection-note-modal';"
    );
    // If it didn't replace because of exact formatting, just add it after the last import
    if (content.includes("import { Dialog")) {
      content = content.replace(/import \{ Dialog[^\}]+\} from '@\/components\/ui\/dialog';/, "import { ConnectionNoteModal } from '../connection-note-modal';");
    }
  }
  
  fs.writeFileSync(file, content);
  console.log('Updated', file);
});
