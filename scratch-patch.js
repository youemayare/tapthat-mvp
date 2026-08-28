const fs = require('fs');
const file = 'src/app/n/[uid]/profile-view.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state hooks
content = content.replace(
  /const \[saved, setSaved\] = useState\(false\);/,
  "const [saved, setSaved] = useState(false);\n  const [showNoteModal, setShowNoteModal] = useState(false);\n  const [noteContent, setNoteContent] = useState('');\n  const [savingNote, setSavingNote] = useState(false);"
);

// Update handleToggleSave success block
const originalSuccessBlock = \if (res.ok) {
        setSaved(!saved);
        toast.success(saved ? 'Removed from your connections' : 'Saved to My Anoya! ??', {
          description: saved
            ? undefined
            : \\ is now in your My Connections list.\,
        });
      }\;

const newSuccessBlock = \if (res.ok) {
        if (saved) {
          setSaved(false);
          toast.success('Removed from your connections');
        } else {
          setSaved(true);
          toast.success('Saved to My Anoya! ??', {
            description: \\ is now in your My Connections list.\,
          });
          setShowNoteModal(true); // Open modal after saving
        }
      }\;

content = content.replace(
  /if \(res\.ok\) \{[\s\S]*?\}\s*\} else \{/,
  newSuccessBlock + " else {"
);

// Add handleSaveNote function
const saveNoteFn = \
  async function handleSaveNote() {
    setSavingNote(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, note: noteContent }),
      });
      if (res.ok) {
        toast.success('Private note saved.');
        setShowNoteModal(false);
      } else {
        toast.error('Failed to save note.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setSavingNote(false);
    }
  }
\;

content = content.replace(
  /function handleSaveContact\(\)/,
  saveNoteFn + "\n  function handleSaveContact()"
);

// Add modal JSX before closing main
const modalJsx = \
      {/* Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="sm:max-w-md bg-background border-border" style={{ borderRadius: '1.5rem' }}>
          <DialogHeader>
            <DialogTitle>Add a private note?</DialogTitle>
            <DialogDescription>
              Keep track of where you met or what you discussed. This is completely private and only visible to you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="e.g., Met at the AI summit, follow up next week about the new project..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[100px] resize-none rounded-xl"
            />
          </div>
          <DialogFooter className="sm:justify-between flex-row gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowNoteModal(false)} className="rounded-xl">
              Skip
            </Button>
            <Button type="button" onClick={handleSaveNote} disabled={savingNote || !noteContent.trim()} className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white">
              {savingNote ? 'Saving...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
\;

content = content.replace(/<\/main>/, modalJsx);

fs.writeFileSync(file, content);
