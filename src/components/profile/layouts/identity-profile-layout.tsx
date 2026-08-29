'use client';

import Link from 'next/link';
import type { Profile } from '@/lib/db/schema';
import { buildWhatsAppUrl, getFontClass } from '@/lib/utils';
import {
  Phone, Mail, Globe, Download,
  MessageCircle, FileText,
  BookmarkPlus, BookmarkCheck, UserPlus, Home
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FaLinkedin, FaInstagram } from 'react-icons/fa';
import { useProfileActions } from '@/components/profile/use-profile-actions';
import { ThemeToggle } from '@/components/theme-toggle';

interface Props {
  profile: Partial<Profile> & { id: string; userId: string };
  cardUid: string;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const f = firstName ? firstName.charAt(0).toUpperCase() : '';
  const l = lastName ? lastName.charAt(0).toUpperCase() : '';
  if (!f && !l) return '?';
  return f + l;
}

export function IdentityProfileLayout({ profile, cardUid }: Props) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const initials = getInitials(profile.firstName, profile.lastName);

  const {
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
    handleSaveContact,
  } = useProfileActions(profile, cardUid);

  const { isOwner, resolved } = viewerState;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative w-full overflow-x-hidden">
      {/* Home link */}
      {viewerState.isLoggedIn && !viewerState.isOwner && (
        <div className="absolute top-4 left-4 z-50">
          <Link href="/dashboard" className="w-10 h-10 bg-background/40 backdrop-blur-md border border-border rounded-full flex items-center justify-center text-foreground hover:bg-background/60 transition-colors shadow-sm">
            <Home className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle className="rounded-full bg-background/40 backdrop-blur-md" />
      </div>

      {/* Hero Section */}
      <div 
        className="relative w-full shrink-0" 
        style={{ minHeight: '360px', height: 'clamp(420px, 58svh, 620px)' }}
      >
        {profile.profilePhotoUrl ? (
          <img 
            src={profile.profilePhotoUrl} 
            alt={fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center">
            <span className="text-8xl font-bold text-muted-foreground/20">{initials}</span>
          </div>
        )}

        {/* Gradient Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-background from-[2%] via-background/60 via-[25%] to-transparent to-[55%]" />

        {/* Identity Block (Bottom of Hero) */}
        <div className="absolute bottom-0 left-0 w-full p-6 pb-8 flex flex-col items-center text-center">
          <h1 className={`text-4xl font-extrabold tracking-tight text-foreground mb-1 drop-shadow-md ${getFontClass(profile.layoutFont)}`}>
            {fullName}
          </h1>
          {(profile.jobTitle || profile.companyName) && (
            <div className="flex flex-col items-center gap-1.5 mt-1 drop-shadow-md max-w-sm">
              {profile.jobTitle && (
                <span className={`text-lg text-muted-foreground font-medium ${getFontClass(profile.layoutFont)}`}>{profile.jobTitle}</span>
              )}
              {profile.companyName && (
                <div className="flex items-center justify-center gap-2">
                  {profile.companyLogoUrl && (
                    <img 
                      src={profile.companyLogoUrl} 
                      alt={profile.companyName || 'Company Logo'}
                      className="w-6 h-6 rounded-full object-contain bg-background p-0.5 border border-border shrink-0"
                    />
                  )}
                  <span className={`text-base text-muted-foreground font-medium ${getFontClass(profile.layoutFont)}`}>{profile.companyName}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 w-full max-w-md mx-auto px-6 py-4 flex flex-col gap-6 pb-24">
        {/* Bio */}
        {profile.bio && (
          <div className="text-center">
            <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Primary Action */}
        <div className="flex flex-col gap-3 mt-2">
          <Button 
            size="lg" 
            onClick={handleSaveContact} 
            className="w-full rounded-2xl h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Save Contact
          </Button>

          {resolved && !isOwner && (
            <button
              onClick={handleToggleSave}
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 h-14 rounded-2xl text-base font-semibold transition-all duration-200 active:scale-95 border ${
                saved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-card border-border text-foreground hover:border-brand-500/40 hover:bg-brand-500/5'
              }`}
            >
              {saving ? (
                'Updating...'
              ) : saved ? (
                <>
                  <BookmarkCheck className="w-5 h-5 mr-2" />
                  Saved to My Connections
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-5 h-5 mr-2" />
                  Save to My Connections
                </>
              )}
            </button>
          )}

          {resolved && !isOwner && !viewerState.isLoggedIn && !viewerState.alreadySaved && (
            <Link 
              href={`/signup?redirect=/p/${profile.slug || profile.id}`}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-card border border-border text-card-foreground font-medium hover:bg-accent transition-colors"
            >
              <UserPlus className="w-5 h-5 text-brand-400" />
              Create your own profile
            </Link>
          )}
        </div>

        {/* Links / Socials */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {profile.phone && (
            <a href={`tel:${profile.phone}`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-accent transition-colors group text-card-foreground">
              <Phone className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-xs font-medium">Call</span>
            </a>
          )}
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-accent transition-colors group text-card-foreground">
              <Mail className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-xs font-medium">Email</span>
            </a>
          )}
          {profile.whatsapp && (
            <a href={buildWhatsAppUrl(profile.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-accent transition-colors group text-card-foreground">
              <FaWhatsapp className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-xs font-medium">WhatsApp</span>
            </a>
          )}
          {profile.websiteUrl && (
            <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-accent transition-colors group text-card-foreground">
              <Globe className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-xs font-medium">Website</span>
            </a>
          )}
        </div>

        {/* Social Bar */}
        {(profile.linkedinUrl || profile.instagramUrl) && (
          <div className="flex justify-center gap-4 mt-2">
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <FaLinkedin className="w-5 h-5" />
              </a>
            )}
            {profile.instagramUrl && (
              <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <FaInstagram className="w-5 h-5" />
              </a>
            )}
          </div>
        )}

        {/* CV Link */}
        {profile.cvUrl && (
          <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-accent transition-colors text-card-foreground">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">View Resume / CV</span>
          </a>
        )}

        {/* Footer & CTA */}
        <div className="mt-8 flex flex-col items-center gap-4 relative z-10 w-full">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-card hover:bg-accent text-muted-foreground text-xs font-medium rounded-full transition-all duration-200 border border-border"
          >
            Want your own custom card? <span className="text-foreground ml-0.5">Get Anoya</span>
          </Link>
          <p className="text-xs text-muted-foreground/80 font-medium">
            Powered by <Link href="/" className="hover:text-foreground transition-colors">Anoya</Link>
          </p>
        </div>
      </div>

      {/* Connection Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="sm:max-w-md bg-background text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Save to My Connections</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add {profile.firstName || 'this person'} to your personal Anoya CRM. You can add a private note below (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="E.g., Met at the AI summit, talked about partnership..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="resize-none h-24 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowNoteModal(false)} className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent">
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSaveConnectionAndNote} 
              disabled={savingNote}
              className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white"
            >
              {savingNote ? 'Saving...' : 'Save Connection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

