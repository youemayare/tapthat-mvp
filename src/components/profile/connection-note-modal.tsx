'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { VoiceRecorder } from './voice-recorder';
import type { Profile } from '@/lib/db/schema';

interface ConnectionNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Partial<Profile>;
  noteContent: string;
  setNoteContent: (content: string) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setAudioDuration: (duration: number) => void;
  savingNote: boolean;
  onSave: () => void;
}

export function ConnectionNoteModal({
  open,
  onOpenChange,
  profile,
  noteContent,
  setNoteContent,
  setAudioBlob,
  setAudioDuration,
  savingNote,
  onSave
}: ConnectionNoteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 text-white border-zinc-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Save to My Connections</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Add {profile.firstName || 'this person'} to your personal Tayz CRM. You can add a private note below (optional).
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-2">
          <Textarea
            placeholder="E.g., Met at the AI summit, talked about partnership..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="resize-none h-24 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-700"
          />
          
          <VoiceRecorder 
            onRecordingComplete={(blob, duration) => {
              setAudioBlob(blob);
              setAudioDuration(duration);
            }}
            onClear={() => {
              setAudioBlob(null);
              setAudioDuration(0);
            }}
          />
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={onSave} 
            disabled={savingNote}
            className="rounded-xl bg-brand-500 hover:bg-brand-600 text-white w-full sm:w-auto"
          >
            {savingNote ? 'Saving...' : 'Save Connection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
