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
import { FaLinkedin, FaInstagram } from 'react-icons/fa';
import { ThemeToggle } from '@/components/theme-toggle';

interface Props {
  profile: Profile;
  cardUid: string;
  viewerUserId: string | null;
  isOwner: boolean;
  alreadySaved: boolean;
}

export function ProfileView({ profile, cardUid, viewerUserId, isOwner, alreadySaved }: Props) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const [saved, setSaved] = useState(alreadySaved);
  const [saving, setSaving] = useState(false);

  // Log tap event (fire-and-forget, non-blocking)
  useEffect(() => {
    fetch('/api/tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: cardUid, type: 'tap' }),
    }).catch(() => {});
  }, [cardUid]);

  function handleSaveContact() {
    window.location.href = `/api/vcard/${profile.id}`;
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
      if (res.ok) setSaved(!saved);
    } catch {
      // Silently fail — non-critical
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-10 pb-24 relative">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-6">

        {/* ── Profile Card ── */}
        <div className="bg-card text-card-foreground border border-border rounded-3xl p-6 backdrop-blur-sm text-center shadow-xl">
          {/* Avatar */}
          {profile.profilePhotoUrl ? (
            <div className="relative w-24 h-24 rounded-full mx-auto mb-4 ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-background overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.profilePhotoUrl}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-background">
              <span className="text-3xl font-bold text-indigo-300">
                {profile.firstName?.[0] ?? '?'}
              </span>
            </div>
          )}

          {/* Name & title */}
          <h1 className="text-2xl font-bold text-foreground mb-1">{fullName}</h1>
          {profile.jobTitle && (
            <p className="text-indigo-300 font-medium text-sm mb-1">{profile.jobTitle}</p>
          )}

          {/* Company */}
          {profile.companyName && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {profile.companyLogoUrl && (
                <div className="relative w-5 h-5 rounded overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.companyLogoUrl} alt={profile.companyName || 'Company Logo'} className="w-full h-full object-contain" />
                </div>
              )}
              <p className="text-muted-foreground text-sm">{profile.companyName}</p>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-muted-foreground text-sm mt-4 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* ── Save to TapThat (for logged-in non-owners) ── */}
        {viewerUserId && !isOwner && (
          <button
            onClick={handleToggleSave}
            disabled={saving}
            id="save-connection-btn"
            className={`w-full flex items-center justify-center gap-3 py-3.5 px-6 font-semibold text-sm rounded-2xl transition-all duration-200 active:scale-95 border ${
              saved
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-card border-border text-foreground hover:border-indigo-500/40 hover:bg-indigo-500/5'
            }`}
          >
            {saved ? (
              <><BookmarkCheck className="w-4 h-4" /> Saved to My TapThat</>
            ) : (
              <><BookmarkPlus className="w-4 h-4" /> Save to My TapThat</>
            )}
          </button>
        )}

        {/* ── Not logged in — subtle CTA to sign up ── */}
        {!viewerUserId && (
          <Link
            href={`/signup?save=${cardUid}`}
            id="signup-save-cta"
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-card border border-border text-muted-foreground hover:border-indigo-500/40 hover:text-foreground text-sm font-medium rounded-2xl transition-all duration-200"
          >
            <UserPlus className="w-4 h-4" />
            Save this contact to your TapThat
          </Link>
        )}

        {/* ── Save Contact CTA ── */}
        <button
          onClick={handleSaveContact}
          id="save-contact-btn"
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-500/25"
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
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-400" />
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
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-purple-400" />
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
                <FaLinkedin className="w-4 h-4 text-blue-400" />
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
          Want your own custom card? <span className="text-foreground ml-0.5">Get TapThat</span>
        </Link>

        <p className="text-xs text-muted-foreground/60 font-medium mt-2">
          Powered by <Link href="/" className="hover:text-indigo-400 transition-colors">TapThat</Link>
        </p>
      </div>
    </main>
  );
}
