'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Profile } from '@/lib/db/schema';
import { buildWhatsAppUrl } from '@/lib/utils';
import {
  Phone, Mail, Globe, Download,
  MessageCircle, Contact, FileText, ExternalLink,
  BookmarkPlus, BookmarkCheck, UserPlus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FaLinkedin, FaInstagram } from 'react-icons/fa';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

interface Props {
  profile: Partial<Profile> & { id: string; userId: string };
  cardUid: string;
}

/**
 * ProfileView — public-facing profile card.
 *
 * Security properties:
 *  - Receives only public profile data (no viewer session state in props).
 *  - Viewer state (isOwner, alreadySaved) is fetched client-side via
 *    /api/viewer-state after hydration, so it is NEVER included in the
 *    server-rendered / ISR-cached HTML.
 *  - Anonymous visitors see the public profile with only the sign-in CTA.
 *  - Owner controls are only shown after the viewer-state API call resolves.
 *  - The viewer-state endpoint is always Cache-Control: no-store.
 */
export function ProfileView({ profile, cardUid }: Props) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

  // Viewer state — not present in server HTML (no cache contamination)
  const [viewerState, setViewerState] = useState<{
    isOwner: boolean;
    alreadySaved: boolean;
    resolved: boolean;
  }>({ isOwner: false, alreadySaved: false, resolved: false });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Fetch viewer-specific state after mount — this call is never cached publicly
  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/viewer-state?profileId=${profile.id}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : { isOwner: false, alreadySaved: false }))
      .then((data: { isOwner: boolean; alreadySaved: boolean }) => {
        setViewerState({ ...data, resolved: true });
        setSaved(data.alreadySaved);
      })
      .catch(() => {
        // Network error or abort — treat as anonymous visitor
        setViewerState({ isOwner: false, alreadySaved: false, resolved: true });
      });

    return () => controller.abort();
  }, [profile.id]);

  // Log tap event (fire-and-forget, non-blocking)
  useEffect(() => {
    if (!cardUid) return;
    fetch('/api/tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: cardUid, type: 'tap' }),
    }).catch(() => {});
  }, [cardUid]);

  
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

  function handleSaveContact() {
    const identifier = profile.slug || profile.id;
    if (!identifier) return;
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/api/vcard/${identifier}`);
  }

  async function handleToggleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const method = saved ? 'DELETE' : 'POST';
      const res = await fetch('/api/connections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id }),
      });
      if (res.ok) {
        setSaved(!saved);
        toast.success(saved ? 'Removed from your connections' : 'Saved to My Anoya! 🎉', {
          description: saved
            ? undefined
            : `${fullName} is now in your My Connections list.`,
        });
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Could not save connection. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  const { isOwner, resolved } = viewerState;

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-10 pb-24 relative">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-brand-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-6">

        {/* ── Profile Card ── */}
        <div className="bg-card text-card-foreground border border-border rounded-3xl backdrop-blur-sm text-center shadow-xl overflow-hidden relative">
          
          {/* Cover Photo / Background Rectangle */}
          {profile.companyLogoUrl ? (
            <div 
              className="w-full h-32 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${profile.companyLogoUrl})` }}
            />
          ) : (
            <div className="w-full h-32 bg-background" />
          )}

          <div className="px-6 pb-6 pt-0">
            {/* Avatar (Overlapping cover photo) */}
            <div className="relative -mt-12 mb-4 mx-auto w-24 h-24 rounded-full ring-4 ring-card bg-card overflow-hidden">
              {profile.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profilePhotoUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-brand-500/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-brand-300">
                    {profile.firstName?.[0] ?? '?'}
                  </span>
                </div>
              )}
            </div>

            {/* Name & title */}
            <h1 className="text-2xl font-bold text-foreground mb-1">{fullName}</h1>
            {profile.jobTitle && (
              <p className="text-brand-400 font-medium text-sm mb-1">{profile.jobTitle}</p>
            )}

            {/* Company */}
            {profile.companyName && (
              <div className="flex items-center justify-center mt-1">
                <p className="text-muted-foreground text-sm font-medium">{profile.companyName}</p>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-muted-foreground text-sm mt-4 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/*
          ── Viewer-specific controls ──
          Only rendered after the /api/viewer-state call resolves.
          This ensures owner controls are NEVER present in cached HTML.
          Anonymous visitors (resolved && !viewerState.isOwner && !viewerState.alreadySaved)
          see only the sign-in CTA below.
        */}
        {resolved && !isOwner && (
          <>
            {/* Save to Anoya (for logged-in non-owners who have a session) */}
            {viewerState.alreadySaved !== undefined && viewerState.isOwner === false && (
              <button
                onClick={handleToggleSave}
                disabled={saving}
                id="save-connection-btn"
                className={`w-full flex items-center justify-center gap-3 py-3.5 px-6 font-semibold text-sm rounded-2xl transition-all duration-200 active:scale-95 border ${
                  saved
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-card border-border text-foreground hover:border-brand-500/40 hover:bg-brand-500/5'
                }`}
              >
                {saved ? (
                  <><BookmarkCheck className="w-4 h-4" /> Saved to My Connections</>
                ) : (
                  <><BookmarkPlus className="w-4 h-4" /> Save to My Connections</>
                )}
              </button>
            )}
          </>
        )}

        {/* ── Not logged in — subtle CTA to sign up ── */}
        {/* Only shown AFTER viewer-state resolves AND only for truly anonymous visitors.
            Never flashes for owners. Hidden during the loading period. */}
        {resolved && !isOwner && !viewerState.alreadySaved && (
          <Link
            href={`/signup?save=${cardUid}`}
            id="signup-save-cta"
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-card border border-border text-muted-foreground hover:border-brand-500/40 hover:text-foreground text-sm font-medium rounded-2xl transition-all duration-200"
          >
            <UserPlus className="w-4 h-4" />
            Sign in to Anoya to save as a Connection
          </Link>
        )}

        {/* ── Save Contact CTA (always visible) ── */}
        <button
          onClick={handleSaveContact}
          id="save-contact-btn"
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-lg shadow-brand-500/25"
        >
          <Contact className="w-5 h-5" />
          Save Contact
        </button>

        {/* ── Contact Actions ── */}
        <div className="space-y-3">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              id="phone-link"
              className="flex items-center gap-4 p-4 bg-card text-card-foreground border border-border rounded-2xl hover:bg-accent transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                <p className="text-foreground font-medium text-sm truncate">{profile.phone}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
            </a>
          )}

          {profile.whatsapp && (
            <a
              href={buildWhatsAppUrl(profile.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              id="whatsapp-link"
              className="flex items-center gap-4 p-4 bg-card text-card-foreground border border-border rounded-2xl hover:bg-accent transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">WhatsApp</p>
                <p className="text-foreground font-medium text-sm truncate">{profile.whatsapp}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
            </a>
          )}

          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              id="email-link"
              className="flex items-center gap-4 p-4 bg-card text-card-foreground border border-border rounded-2xl hover:bg-accent transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="text-foreground font-medium text-sm truncate">{profile.email}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
            </a>
          )}

          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="website-link"
              className="flex items-center gap-4 p-4 bg-card text-card-foreground border border-border rounded-2xl hover:bg-accent transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Website</p>
                <p className="text-foreground font-medium text-sm truncate">{profile.websiteUrl}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
            </a>
          )}
        </div>

        {/* ── Social Links ── */}
        {(profile.linkedinUrl || profile.instagramUrl) && (
          <div className="flex gap-3">
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="linkedin-link"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-card text-card-foreground border border-border rounded-2xl hover:bg-accent transition-all"
              >
                <FaLinkedin className="w-4 h-4 text-brand-400" />
                <span className="text-foreground text-sm font-medium">LinkedIn</span>
              </a>
            )}
            {profile.instagramUrl && (
              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="instagram-link"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-card text-card-foreground border border-border rounded-2xl hover:bg-accent transition-all"
              >
                <FaInstagram className="w-4 h-4 text-pink-400" />
                <span className="text-foreground text-sm font-medium">Instagram</span>
              </a>
            )}
          </div>
        )}

        {/* ── CV Download ── */}
        {profile.cvUrl && (
          <a
            href={profile.cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="cv-download-link"
            className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-card text-card-foreground border border-border rounded-2xl hover:bg-accent transition-all"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground font-medium text-sm">Download CV</span>
            <Download className="w-4 h-4 text-muted-foreground" />
          </a>
        )}
      </div>

      {/* ── Footer & CTA ── */}
      <div className="mt-12 flex flex-col items-center gap-4 relative z-10 w-full max-w-sm">
        {/* Subtle Marketing CTA */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-muted/50 hover:bg-muted text-muted-foreground text-xs font-medium rounded-full transition-all duration-200"
        >
          Want your own custom card? <span className="text-foreground ml-0.5">Get Anoya</span>
        </Link>

        <p className="text-xs text-muted-foreground/60 font-medium mt-2">
          Powered by <Link href="/" className="hover:text-brand-400 transition-colors">Anoya</Link>
        </p>
      </div>
    
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

  );
}
