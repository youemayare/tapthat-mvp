'use client';

import Link from 'next/link';
import type { Profile } from '@/lib/db/schema';
import { buildWhatsAppUrl, getFontClass } from '@/lib/utils';
import {
  Phone, Mail, Globe, Download,
  FileText,
  UserPlus, UserCheck, Home
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FaLinkedin, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { useProfileActions } from '@/components/profile/use-profile-actions';
import { ThemeToggle } from '@/components/theme-toggle';

interface Props {
  profile: Partial<Profile> & { id: string; userId: string };
  cardUid: string;
}

export function CanvasProfileLayout({ profile, cardUid }: Props) {
  const {
    viewerState,
    saved,
    savingNote,
    showNoteModal,
    noteContent,
    setNoteContent,
    setShowNoteModal,
    handleSaveContact,
    handleSaveConnectionAndNote,
  } = useProfileActions(profile, cardUid);

  const { isOwner, resolved } = viewerState;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const initials = fullName
    ? (profile.firstName?.[0] || '') + (profile.lastName?.[0] || '')
    : '?';

  // Social Links mapping
  const socialLinks = [
    profile.linkedinUrl && { icon: <FaLinkedin className="w-5 h-5" />, href: profile.linkedinUrl, label: 'LinkedIn' },
    profile.instagramUrl && { icon: <FaInstagram className="w-5 h-5" />, href: profile.instagramUrl, label: 'Instagram' },
    profile.whatsapp && { icon: <FaWhatsapp className="w-5 h-5" />, href: buildWhatsAppUrl(profile.whatsapp), label: 'WhatsApp' },
    profile.websiteUrl && { icon: <Globe className="w-5 h-5" />, href: profile.websiteUrl, label: 'Website' },
    profile.cvUrl && { icon: <FileText className="w-5 h-5" />, href: profile.cvUrl, label: 'Resume' },
  ].flatMap(link => typeof link === 'object' && link !== null ? [link] : []);

  const bgColor = profile.layoutBackgroundColor || '#1a1a2e';
  const hasBackgroundImage = !!profile.layoutBackgroundImageUrl;

  const silverBorderMask: React.CSSProperties = {
    background: 'linear-gradient(145deg, #e8e8e8, #a0a0a0, #d4d4d4, #888888, #c0c0c0)',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
  };

  return (
    <div 
      className="h-[100dvh] w-full flex flex-col relative text-white selection:bg-white/30 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Home link */}
      {viewerState.isLoggedIn && !viewerState.isOwner && (
        <div className="absolute top-4 left-4 z-50">
          <Link href="/dashboard" className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors shadow-sm">
            <Home className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle className="bg-black/40 backdrop-blur-md border-white/10 text-white hover:bg-black/60 rounded-full" />
      </div>
      {/* Background Image */}
      {profile.layoutBackgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(' + profile.layoutBackgroundImageUrl + ')' }}
        />
      )}
      {/* Dark overlay only when there is a background image to ensure legibility */}
      {hasBackgroundImage && <div className="absolute inset-0 z-0 bg-black/40" />}

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center w-full max-w-md mx-auto px-6 overflow-hidden">
        
        {/* Top spacer */}
        <div className="flex-[0.6] shrink-0 min-h-0" />

        {/* Phone & Email */}
        {(profile.phone || profile.email) && (
          <div className="flex items-center gap-4 mb-8">
            {profile.phone && (
              <a 
                href={'tel:' + profile.phone}
                className="relative w-14 h-14 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
                aria-label="Call"
              >
                <div className="absolute inset-0 rounded-full pointer-events-none p-[1.5px]" style={silverBorderMask} />
                <Phone className="w-6 h-6 text-white relative z-10" />
              </a>
            )}
            {profile.email && (
              <a 
                href={'mailto:' + profile.email}
                className="relative w-14 h-14 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
                aria-label="Email"
              >
                <div className="absolute inset-0 rounded-full pointer-events-none p-[1.5px]" style={silverBorderMask} />
                <Mail className="w-6 h-6 text-white relative z-10" />
              </a>
            )}
          </div>
        )}

        {/* Profile Avatar */}
        <div className="relative w-32 h-32 rounded-full mb-6 flex-shrink-0 shadow-2xl">
          <div className="absolute inset-0 rounded-full pointer-events-none p-[2px] z-20" style={silverBorderMask} />
          <div className="w-full h-full rounded-full overflow-hidden bg-black/20 backdrop-blur-md relative z-10">
            {profile.profilePhotoUrl ? (
              <img 
                src={profile.profilePhotoUrl} 
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                <span className="text-4xl font-bold text-white/20">{initials}</span>
              </div>
            )}
          </div>
        </div>

        {/* Name / Title / Company / Bio */}
        <div className="text-center mb-10 w-full">
          <h1 className={`text-3xl font-bold tracking-tight text-white mb-2 drop-shadow-md ${getFontClass(profile.layoutFont)}`}>
            {fullName}
          </h1>
          {profile.jobTitle && (
            <p className={`text-lg text-white/80 font-medium drop-shadow-md mb-1 ${getFontClass(profile.layoutFont)}`}>
              {profile.jobTitle}
            </p>
          )}
          {profile.companyName && (
            <p className={`text-base text-white/60 drop-shadow-md max-w-xs mx-auto ${getFontClass(profile.layoutFont)}`}>
              {profile.companyName}
            </p>
          )}
          {profile.bio && (
            <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-xs mx-auto">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Social Links Row */}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 w-full mb-4">
            {socialLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="relative w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/40 transition-colors"
              >
                <div className="absolute inset-0 rounded-full pointer-events-none p-[1.5px]" style={silverBorderMask} />
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  {link.icon}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Download & Save — hidden for owner */}
        {resolved && !isOwner && (
          <div className="flex items-center justify-center gap-3 w-full mb-3">
            <button
              onClick={handleSaveContact}
              aria-label="Save Contact"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-white text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Save Contact
            </button>
            <button
              onClick={saved ? undefined : () => setShowNoteModal(true)}
              aria-label={saved ? 'Already connected' : 'Save to My Connections'}
              disabled={saved}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                saved
                  ? 'border-green-400/40 bg-green-400/15 text-green-300 cursor-default'
                  : 'border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white'
              }`}
            >
              {saved ? (
                <><UserCheck className="w-4 h-4" />Connected</>
              ) : (
                <><UserPlus className="w-4 h-4" />Connect</>
              )}
            </button>
          </div>
        )}

        {/* Company Logo — sits below social/action links */}
        {profile.companyLogoUrl && (
          <div className="mt-6 flex justify-center">
            <div className="relative w-24 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg p-1">
              <div className="absolute inset-0 rounded-xl pointer-events-none p-[1.5px] z-20" style={silverBorderMask} />
              <img 
                src={profile.companyLogoUrl} 
                alt={profile.companyName || 'Company Logo'}
                className="w-full h-full rounded-lg object-contain relative z-10"
              />
            </div>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="flex-1 shrink-0 min-h-0" />
      </div>

      {/* Footer CTA */}
      <div className="absolute bottom-5 left-0 w-full flex justify-center z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-black/30 backdrop-blur-md hover:bg-black/50 text-white/60 hover:text-white text-xs font-medium rounded-full transition-all duration-200 border border-white/10"
        >
          Want your own custom card? <span className="text-white ml-0.5 font-semibold">Get Anoya</span>
        </Link>
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


