import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Profile } from '@/lib/db/schema';

export function useProfileActions(profile: Partial<Profile> & { id: string; userId: string }, cardUid: string) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

  const [viewerState, setViewerState] = useState<{
    isLoggedIn: boolean;
    isOwner: boolean;
    alreadySaved: boolean;
    resolved: boolean;
  }>({ isOwner: false, alreadySaved: false, isLoggedIn: false, resolved: false });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/viewer-state?profileId=${profile.id}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : { isOwner: false, alreadySaved: false, isLoggedIn: false }))
      .then((data: { isOwner: boolean; alreadySaved: boolean; isLoggedIn: boolean }) => {
        setViewerState({ ...data, resolved: true });
        setSaved(data.alreadySaved);
      })
      .catch(() => {
        setViewerState({ isOwner: false, alreadySaved: false, isLoggedIn: false, resolved: true });
      });

    return () => controller.abort();
  }, [profile.id]);

  useEffect(() => {
    if (!cardUid) return;
    fetch('/api/tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: cardUid, type: 'tap' }),
    }).catch(() => {});
  }, [cardUid]);

  async function handleSaveConnectionAndNote() {
    setSavingNote(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, note: noteContent.trim() || null }),
      });
      if (res.ok) {
        setSaved(true);
        toast.success('Saved to My Anoya! 🎉', {
          description: `${fullName} is now in your My Connections list.`,
        });
        setShowNoteModal(false);
      } else {
        toast.error('Failed to save connection.');
      }
    } catch (error) {
      toast.error('Network error.');
    } finally {
      setSavingNote(false);
    }
  }

  function handleToggleSave() {
    if (!viewerState.isLoggedIn) {
      window.location.href = `/login?redirect=/p/${profile.slug || profile.id}`;
      return;
    }
    
    if (!saved) {
      setShowNoteModal(true);
    } else {
      // Removing connection
      const doRemove = async () => {
        setSaving(true);
        try {
          const res = await fetch(`/api/connections?profileId=${profile.id}`, { method: 'DELETE' });
          if (res.ok) {
            setSaved(false);
            toast.success('Removed from My Connections.');
          } else {
            toast.error('Failed to remove connection.');
          }
        } catch {
          toast.error('Network error.');
        } finally {
          setSaving(false);
        }
      };
      doRemove();
    }
  }

  async function handleSaveContact() {
    try {
      const res = await fetch(`/api/vcard?profileId=${profile.id}`);
      if (!res.ok) throw new Error('Failed to generate vCard');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${fullName.replace(/\s+/g, '_')}.vcf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Contact downloaded!');
    } catch (error) {
      console.error('vCard error:', error);
      toast.error('Failed to download contact');
    }
  }

  return {
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
  };
}
