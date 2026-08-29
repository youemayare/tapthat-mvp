'use client';

import Link from 'next/link';
import type { Profile } from '@/lib/db/schema';
import { buildWhatsAppUrl } from '@/lib/utils';
import {
  Phone, Mail, Globe, Download,
  MessageCircle, FileText,
  UserPlus
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

export function CanvasProfileLayout({ profile, cardUid }: Props) {
  const {
    viewerState,
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
    profile.whatsapp && { icon: <MessageCircle className="w-5 h-5" />, href: buildWhatsAppUrl(profile.whatsapp), label: 'WhatsApp' },
    profile.websiteUrl && { icon: <Globe className="w-5 h-5" />, href: profile.websiteUrl, label: 'Website' },
    profile.cvUrl && { icon: <FileText className="w-5 h-5" />, href: profile.cvUrl, label: 'Resume' },
  ].flatMap(link => typeof link === 'object' && link !== null ? [link] : []);

  const bgColor = profile.layoutBackgroundColor || '#1a1a2e';
  const hasBackgroundImage = !!profile.layoutBackgroundImageUrl;

  return (
    <div 
      className="min-h-[100dvh] w-full flex flex-col relative text-white selection:bg-white/30"
      style={{ backgroundColor: bgColor }}
    >
      {/* Background Image */}
      {profile.layoutBackgroundImageUrl && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(' + profile.layoutBackgroundImageUrl + ')' }}
        />
      )}
      {/* Dark overlay only when there is a background image to ensure legibility */}
      {hasBackgroundImage && <div className="absolute inset-0 z-0 bg-black/40" />}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 pb-24 w-full max-w-md mx-auto min-h-[100dvh]">
        
        {/* Top Actions: Phone & Email */}
        <div className="flex items-center gap-4 mb-8">
          {profile.phone && (
            <a 
              href={'tel:' + profile.phone}
              className="w-14 h-14 rounded-full border border-white/30 bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
              aria-label="Call"
            >
              <Phone className="w-6 h-6 text-white" />
            </a>
          )}
          {profile.email && (
            <a 
              href={'mailto:' + profile.email}
              className="w-14 h-14 rounded-full border border-white/30 bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
              aria-label="Email"
            >
              <Mail className="w-6 h-6 text-white" />
            </a>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-white/20 overflow-hidden mb-6 bg-black/20 backdrop-blur-md shadow-2xl flex-shrink-0">
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

        {/* Identity Text */}
        <div className="text-center mb-10 w-full">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 drop-shadow-md">
            {fullName}
          </h1>
          {profile.jobTitle && (
            <p className="text-lg text-white/80 font-medium drop-shadow-md mb-1">
              {profile.jobTitle}
            </p>
          )}
          {profile.companyName && (
            <p className="text-base text-white/60 drop-shadow-md max-w-xs mx-auto">
              {profile.companyName}
            </p>
          )}
          {profile.bio && (
            <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-xs mx-auto">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Action Row (Socials + Primary Actions) */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full mb-12">
          {socialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href!}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="w-12 h-12 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/40 transition-colors"
            >
              {link.icon}
            </a>
          ))}
          {/* Download & Save actions — hidden for profile owner */}
          {resolved && !isOwner && (
            <>
              <button
                onClick={handleSaveContact}
                aria-label="Save Contact"
                className="w-12 h-12 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors text-white"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowNoteModal(true)}
                aria-label="Save to My Connections"
                className="w-12 h-12 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors text-white"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Company Logo in Circle */}
        {profile.companyLogoUrl && (
          <div className="mt-auto pt-8">
            <div className="w-14 h-14 rounded-full border border-white/20 bg-white p-1 flex items-center justify-center shadow-lg">
              <img 
                src={profile.companyLogoUrl} 
                alt={profile.companyName || 'Company Logo'}
                className="w-full h-full rounded-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer & CTA */}
      <div className="absolute bottom-6 left-0 w-full flex flex-col items-center gap-3 z-20">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-black/30 backdrop-blur-md hover:bg-black/50 text-white/60 hover:text-white text-xs font-medium rounded-full transition-all duration-200 border border-white/10"
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


