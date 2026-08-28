const fs = require('fs');
const file = 'src/components/profile/layouts/classic-profile-layout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('export function ProfileView', 'import { useProfileActions } from \'@/components/profile/use-profile-actions\';\n\nexport function ClassicProfileLayout');

// We need to replace everything from const [viewerState... down to the end of handleSaveContact() { ... }
// A robust way is to find the start and end indices.
const startStr = '  const [viewerState, setViewerState]';
const endStr = '  return (';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = \  const {
    viewerState,
    saved,
    saving,
    showNoteModal,
    setShowNoteModal,
    noteContent,
    setNoteContent,
    savingNote,
    handleSaveConnectionAndNote,
    handleToggleSave,
    handleSaveContact
  } = useProfileActions(profile, cardUid);

\;
    content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
}

fs.writeFileSync(file, content);
