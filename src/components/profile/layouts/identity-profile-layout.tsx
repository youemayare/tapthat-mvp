'use client';

import Link from 'next/link';
import type { Profile } from '@/lib/db/schema';
import { buildWhatsAppUrl } from '@/lib/utils';
import {
  Phone, Mail, Globe, Download,
  MessageCircle, Contact, FileText, ExternalLink,
  BookmarkPlus, BookmarkCheck, UserPlus, Home
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FaLinkedin, FaInstagram } from 'react-icons/fa';
import { useProfileActions } from '@/components/profile/use-profile-actions';

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
    <div className="min-h-[100dvh] bg-zinc-950 text-white flex flex-col relative w-full overflow-x-hidden">
      {/* Home link */}
      {viewerState.isLoggedIn && !viewerState.isOwner && (
        <div className="absolute top-4 left-4 z-50">
          <Link href="/dashboard" className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-sm">
            <Home className="w-5 h-5" />
          </Link>
        </div>
      )}

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
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
            <span className="text-8xl font-bold text-white/10">{initials}</span>
          </div>
        )}

        {/* Gradient Overlay for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

        {/* Identity Block (Bottom of Hero) */}
        <div className="absolute bottom-0 left-0 w-full p-6 pb-8 flex flex-col items-center text-center">
          {profile.companyLogoUrl && (
            <img 
              src={profile.companyLogoUrl} 
              alt={profile.companyName || 'Company Logo'}
              className="h-10 w-auto object-contain mb-4 rounded bg-white/10 p-1"
            />
          )}
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1 drop-shadow-md">
            {fullName}
          </h1>
          {(profile.jobTitle || profile.companyName) && (
            <p className="text-lg text-zinc-300 font-medium max-w-sm drop-shadow-md">
              {profile.jobTitle}
              {profile.jobTitle && profile.companyName && <span> @ </span>}
              {profile.companyName}
            </p>
          )}
          {profile.slug && (
            <p className="text-sm text-zinc-400 mt-2 font-medium">@{profile.slug}</p>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 w-full max-w-md mx-auto px-6 py-4 flex flex-col gap-6 pb-24">
        {/* Bio */}
        {profile.bio && (
          <div className="text-center">
            <p className="text-zinc-300 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Primary Action */}
        <div className="flex flex-col gap-3 mt-2">
          <Button 
            size="lg" 
            onClick={handleSaveContact} 
            className="w-full rounded-2xl h-14 text-base font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Save Contact
          </Button>

          {resolved && !isOwner && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleToggleSave}
              disabled={saving}
              className="w-full rounded-2xl h-14 text-base font-semibold border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white transition-colors"
            >
              {saving ? (
                'Updating...'
              ) : saved ? (
                <>
                  <BookmarkCheck className="w-5 h-5 mr-2 text-green-400" />
                  Saved to My Connections
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-5 h-5 mr-2 text-zinc-300" />
                  Save to My Connections
                </>
              )}
            </Button>
          )}

          {resolved && !isOwner && !viewerState.isLoggedIn && !viewerState.alreadySaved && (
            <Link 
              href={`/signup?redirect=/p/${profile.slug || profile.id}`}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-zinc-900 border border-white/10 text-white font-medium hover:bg-zinc-800 transition-colors"
            >
              <UserPlus className="w-5 h-5 text-brand-400" />
              Create your own profile
            </Link>
          )}
        </div>

        {/* Links / Socials */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {profile.phone && (
            <a href={`tel:${profile.phone}`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-colors group text-white">
              <Phone className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="text-xs font-medium">Call</span>
            </a>
          )}
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-colors group text-white">
              <Mail className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="text-xs font-medium">Email</span>
            </a>
          )}
          {profile.whatsapp && (
            <a href={buildWhatsAppUrl(profile.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-colors group text-white">
              <MessageCircle className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="text-xs font-medium">WhatsApp</span>
            </a>
          )}
          {profile.websiteUrl && (
            <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-colors group text-white">
              <Globe className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="text-xs font-medium">Website</span>
            </a>
          )}
        </div>

        {/* Social Bar */}
        {(profile.linkedinUrl || profile.instagramUrl) && (
          <div className="flex justify-center gap-4 mt-2">
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <FaLinkedin className="w-5 h-5" />
              </a>
            )}
            {profile.instagramUrl && (
              <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <FaInstagram className="w-5 h-5" />
              </a>
            )}
          </div>
        )}

        {/* CV Link */}
        {profile.cvUrl && (
          <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-colors text-white">
            <FileText className="w-5 h-5 text-zinc-400" />
            <span className="text-sm font-medium">View Resume / CV</span>
          </a>
        )}
      </div>

      {/* Connection Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="sm:max-w-md bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle>Save to My Connections</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Add {profile.firstName || 'this person'} to your personal Anoya CRM. You can add a private note below (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="E.g., Met at the AI summit, talked about partnership..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="resize-none h-24 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-700"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowNoteModal(false)} className="rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800">
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
