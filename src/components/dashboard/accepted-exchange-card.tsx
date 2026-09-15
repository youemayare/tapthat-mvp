'use client';

import { useState } from 'react';
import { Mail, Phone, Building2, Briefcase, StickyNote, UserMinus } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function AcceptedExchangeCard({ exchange }: { exchange: any }) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [noteContent, setNoteContent] = useState(exchange.recipientNote || '');
  const [savingNote, setSavingNote] = useState(false);
  const [localNote, setLocalNote] = useState(exchange.recipientNote);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const initials = exchange.name 
    ? exchange.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
    : '?';

  const handleRemoveExchange = async () => {
    setIsRemoving(true);
    try {
      const res = await fetch(`/api/exchange/${exchange.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setIsDeleted(true);
        toast.success('Connection removed.');
        setShowConfirmModal(false);
      } else {
        toast.error('Failed to remove connection.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/exchange/${exchange.id}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteContent.trim() || null }),
      });
      
      if (!res.ok) throw new Error('Failed to save note');
      
      setLocalNote(noteContent.trim() || null);
      setShowNoteModal(false);
      toast.success(noteContent.trim() ? 'Note saved.' : 'Note removed.');
    } catch (err: any) {
      toast.error(err.message || 'Network error.');
    } finally {
      setSavingNote(false);
    }
  };

  if (isDeleted) return null;

  return (
    <>
      <div className={`relative group bg-card border border-border rounded-2xl p-5 hover:border-brand-500/30 hover:bg-accent/30 transition-all flex flex-col gap-3 ${isRemoving ? 'opacity-50 pointer-events-none' : ''}`}>
        <button onClick={() => setShowDetailsModal(true)} className="absolute inset-0 z-0 rounded-2xl cursor-pointer" aria-label="View details"></button>
        
        {/* Avatar + name row */}
        <div className="flex items-center gap-3 relative z-10 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-brand-300">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0 pointer-events-auto">
            <button onClick={() => setShowDetailsModal(true)} className="font-semibold text-foreground truncate hover:underline block pr-2 text-left">
              {exchange.name}
            </button>
            {(exchange.jobTitle || exchange.company) && (
              <p className="text-sm text-brand-300 truncate">
                {[exchange.jobTitle, exchange.company].filter(Boolean).join(' at ')}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto shrink-0">
            <button 
              onClick={(e) => { e.preventDefault(); setShowNoteModal(true); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${localNote ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'}`}
              title={localNote ? 'Edit private note' : 'Add private note'}
            >
              <StickyNote className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); setShowConfirmModal(true); }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              title="Remove connection"
            >
              <UserMinus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Exchange tag */}
        <div className="relative z-10 pointer-events-none -mt-1 mb-1">
          <Badge variant="outline" className="bg-brand-500/10 text-brand-500 border-brand-500/20 text-[10px] px-2 py-0">
            Contact Exchange
          </Badge>
        </div>

        {/* Note Preview */}
        {localNote && (
          <div className="relative z-10 mt-1 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl pointer-events-none">
             <p className="text-xs text-amber-400 font-medium mb-1">Private Note</p>
             <p className="text-sm text-foreground line-clamp-2">{localNote}</p>
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-muted-foreground/60 mt-auto pt-2 border-t border-border/50 relative z-10 pointer-events-none">
          Connected {formatDistanceToNow(new Date(exchange.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-md bg-background border-border" style={{ borderRadius: '1.5rem' }}>
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-500 font-bold text-xl flex items-center justify-center">
                {initials}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground leading-tight">{exchange.name}</h3>
                {(exchange.jobTitle || exchange.company) && (
                  <p className="text-sm text-muted-foreground">
                    {[exchange.jobTitle, exchange.company].filter(Boolean).join(' at ')}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {exchange.email && (
                <a href={`mailto:${exchange.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors border border-border">
                  <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-brand-500" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Email</p>
                    <p className="text-sm text-foreground truncate">{exchange.email}</p>
                  </div>
                </a>
              )}

              {exchange.phone && (
                <a href={`tel:${exchange.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors border border-border">
                  <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-brand-500" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Phone</p>
                    <p className="text-sm text-foreground truncate">{exchange.phone}</p>
                  </div>
                </a>
              )}
            </div>

            {exchange.message && (
              <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border">
                <p className="text-xs text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Message</p>
                <p className="text-sm text-foreground/90 italic">"{exchange.message}"</p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground text-center mt-6">
              Exchanged on {format(new Date(exchange.createdAt), 'MMMM d, yyyy')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setShowDetailsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="sm:max-w-md bg-background border-border" style={{ borderRadius: '1.5rem' }}>
          <DialogHeader>
            <DialogTitle>Private Note for {exchange.name}</DialogTitle>
            <DialogDescription>
              This note is only visible to you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="e.g., Met at the real estate summit..."
              className="resize-none border-border"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={savingNote}>
              {savingNote ? 'Saving...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-background border-border" style={{ borderRadius: '1.5rem' }}>
          <DialogHeader>
            <DialogTitle>Remove Connection?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {exchange.name} from your connections? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveExchange} disabled={isRemoving}>
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
