'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, StickyNote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ConnectionCardProps {
  connection: any;
  profile: any;
  note: any;
}

export function ConnectionCard({ connection, profile, note }: ConnectionCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [noteContent, setNoteContent] = useState(note?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [currentNote, setCurrentNote] = useState(note?.content || null);

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Unknown';
  const href = `/p/${profile.slug || profile.id}`;

  async function handleSaveNote() {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/connections/${connection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteContent.trim() || null }),
      });
      if (res.ok) {
        setCurrentNote(noteContent.trim() || null);
        toast.success(noteContent.trim() ? 'Note saved.' : 'Note removed.');
        setShowModal(false);
      } else {
        toast.error('Failed to save note.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="relative group bg-card border border-border rounded-2xl p-5 hover:border-brand-500/30 hover:bg-accent/30 transition-all flex flex-col gap-3">
        <Link href={href} className="absolute inset-0 z-0 rounded-2xl"></Link>
        
        {/* Avatar + name row */}
        <div className="flex items-center gap-4 relative z-10 pointer-events-none">
          {profile.profilePhotoUrl ? (
            <img
              src={profile.profilePhotoUrl}
              alt={fullName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/20 flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-brand-300">
                {profile.firstName?.[0] ?? '?'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0 pointer-events-auto">
            <Link href={href} className="font-semibold text-foreground truncate hover:underline block">
              {fullName}
            </Link>
            {profile.jobTitle && (
              <p className="text-sm text-brand-300 truncate">{profile.jobTitle}</p>
            )}
          </div>
          
          <button 
            onClick={(e) => { e.preventDefault(); setShowModal(true); }}
            className={`pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center transition-colors ${currentNote ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'}`}
            title={currentNote ? 'Edit private note' : 'Add private note'}
          >
            <StickyNote className="w-4 h-4" />
          </button>
        </div>

        {/* Company */}
        {profile.companyName && (
          <p className="text-sm text-muted-foreground truncate relative z-10 pointer-events-none">{profile.companyName}</p>
        )}

        {/* Note Preview */}
        {currentNote && (
          <div className="relative z-10 mt-1 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl pointer-events-none">
             <p className="text-xs text-amber-400 font-medium mb-1">Private Note</p>
             <p className="text-sm text-foreground line-clamp-2">{currentNote}</p>
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-muted-foreground/60 mt-auto pt-2 border-t border-border/50 relative z-10 pointer-events-none">
          Connected {formatDistanceToNow(new Date(connection.createdAt), { addSuffix: true })}
        </p>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-background border-border" style={{ borderRadius: '1.5rem' }}>
          <DialogHeader>
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
          <DialogFooter className="sm:justify-between flex-row gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveNote} disabled={isSaving} className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white">
              {isSaving ? 'Saving...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
