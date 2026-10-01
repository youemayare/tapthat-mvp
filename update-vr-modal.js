const fs = require('fs');

let vrContent = fs.readFileSync('src/components/profile/voice-recorder.tsx', 'utf8');

// 1. Add Dialog imports
if (!vrContent.includes('import { Dialog')) {
  vrContent = vrContent.replace(
    "import { Button } from '@/components/ui/button';",
    "import { Button } from '@/components/ui/button';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';"
  );
}

// 2. Add showConfirmModal state
if (!vrContent.includes('const [showConfirmModal, setShowConfirmModal] = useState(false);')) {
  vrContent = vrContent.replace(
    'const [error, setError] = useState<string | null>(null);',
    'const [error, setError] = useState<string | null>(null);\n  const [showConfirmModal, setShowConfirmModal] = useState(false);'
  );
}

// 3. Update handleClear to open modal
const oldHandleClear = `  const handleClear = () => {
    if (existingAudioUrl) {
      if (!window.confirm("Are you sure you want to delete this voice note?")) {
        return;
      }
    }
    if (audioBlobUrl && !existingAudioUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setRecordingTime(0);
    onClear();
  };`;

const newHandleClear = `  const handleClear = () => {
    if (existingAudioUrl) {
      setShowConfirmModal(true);
    } else {
      confirmClear();
    }
  };

  const confirmClear = () => {
    if (audioBlobUrl && !existingAudioUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setRecordingTime(0);
    onClear();
    setShowConfirmModal(false);
  };`;

if (vrContent.includes(oldHandleClear)) {
  vrContent = vrContent.replace(oldHandleClear, newHandleClear);
} else {
  console.log("Could not find handleClear to replace");
}

// 4. Add Dialog JSX at the end before final `</div>`
const dialogJSX = `
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-background border-border" style={{ borderRadius: '1.5rem' }}>
          <DialogHeader>
            <DialogTitle>Delete Voice Note?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this voice note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between flex-row gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setShowConfirmModal(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmClear} className="rounded-xl">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
`;

if (!vrContent.includes('<Dialog open={showConfirmModal}')) {
  vrContent = vrContent.replace(
    '      )}\n    </div>\n  );\n}',
    `      )}\n${dialogJSX}    </div>\n  );\n}`
  );
}

fs.writeFileSync('src/components/profile/voice-recorder.tsx', vrContent);
console.log('done updating VoiceRecorder confirm modal');
