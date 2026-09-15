import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Mail, Phone, Building2, Briefcase, Calendar, MessageSquarePlus, Edit3, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function AcceptedExchangeCard({ exchange }: { exchange: any }) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState(exchange.recipientNote || '');
  const [savingNote, setSavingNote] = useState(false);
  const [localNote, setLocalNote] = useState(exchange.recipientNote);

  const initials = exchange.name ? exchange.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '?';

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/exchange/${exchange.id}/note`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteContent }),
      });
      
      if (!res.ok) throw new Error('Failed to save note');
      
      setLocalNote(noteContent);
      setShowNoteModal(false);
      toast.success('Note saved');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <>
      <Card className="flex flex-col h-full bg-card hover:bg-muted/30 transition-colors duration-300 overflow-hidden group border-border">
      <div className="p-5 flex-grow">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-brand-500/10 text-brand-500 font-bold text-lg">
            {initials}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 font-semibold">
            <Calendar className="w-3 h-3" />
            {format(new Date(exchange.createdAt), 'MMM d, yyyy')}
          </div>
        </div>

        <h3 className="font-playfair text-xl font-medium text-foreground mb-1 line-clamp-1">
          {exchange.name}
        </h3>

        {exchange.jobTitle && exchange.company ? (
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mb-4">
            <Briefcase className="w-3.5 h-3.5" />
            {exchange.jobTitle} at {exchange.company}
          </p>
        ) : exchange.jobTitle ? (
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mb-4">
            <Briefcase className="w-3.5 h-3.5" />
            {exchange.jobTitle}
          </p>
        ) : exchange.company ? (
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mb-4">
            <Building2 className="w-3.5 h-3.5" />
            {exchange.company}
          </p>
        ) : null}

        <div className="space-y-2 mt-4">
          {exchange.email && (
            <a href={`mailto:${exchange.email}`} className="flex items-center gap-2 text-sm text-foreground hover:text-brand-500 transition-colors">
              <Mail className="w-4 h-4 text-muted-foreground" />
              {exchange.email}
            </a>
          )}
          {exchange.phone && (
            <a href={`tel:${exchange.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-brand-500 transition-colors">
              <Phone className="w-4 h-4 text-muted-foreground" />
              {exchange.phone}
            </a>
          )}
        </div>

        {exchange.message && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Message</p>
            <p className="text-sm text-foreground/80 italic">{exchange.message}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border group-hover:border-brand-500/20 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Private Note</p>
            {localNote && (
              <button 
                onClick={() => setShowNoteModal(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
          {localNote ? (
            <p className="text-sm text-foreground line-clamp-3">{localNote}</p>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs h-8 border-dashed border-2 hover:border-brand-500 hover:text-brand-500"
              onClick={() => setShowNoteModal(true)}
            >
              <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" />
              Add a private note
            </Button>
          )}
        </div>
      </div>
    </Card>

      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Private Note</DialogTitle>
            <DialogDescription>
              Add context on how you met or what you discussed. This is only visible to you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="e.g., Met at the real estate summit..."
              className="resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={savingNote}>
              {savingNote && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
