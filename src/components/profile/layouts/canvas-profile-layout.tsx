'use client';

import Link from 'next/link';
import type { Profile } from '@/lib/db/schema';
import { buildWhatsAppUrl, getFontClass } from '@/lib/utils';
import {
  Phone, Mail, Globe, Download,
  FileText,
  UserPlus, UserCheck, Home, Share, MessageCircle, BookmarkPlus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FaLinkedin, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { useProfileActions } from '@/components/profile/use-profile-actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { ExchangeDetailsDrawer } from '../exchange-details-drawer';

interface Props {
  profile: Partial<Profile> & { id: string; userId: string };
  cardUid: string;
}

export function CanvasProfileLayout({ profile, cardUid }: Props) {
  const {
    viewerState,
    saved,
    savingNote,
    showExchangeDrawer,
    setShowExchangeDrawer,
    showNoteModal,
    noteContent,
    setNoteContent,
    setShowNoteModal,
    handleSaveContact,
    handleToggleSave,
    handleSaveConnectionAndNote,
  } = useProfileActions(profile, cardUid);

  const { isOwner, resolved } = viewerState;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

  const handleShare = async () => {
    const url = window.location.href;
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    if (navigator.share) {
      try {
        await navigator.share({
          title: fullName || 'Anoya Profile',
          url,
        });
      } catch (err) {
        // user cancelled or failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

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

      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <ThemeToggle className="bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 rounded-full" />
        <button 
          onClick={handleShare}
          aria-label="Share profile"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
        >
          <Share className="w-4 h-4" />
        </button>
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

      {/* Main content — fills the full dvh height and distributes evenly */}
      <div className="relative z-10 h-full flex flex-col items-center w-full max-w-md mx-auto px-6 pt-16 pb-5 justify-between">

        {/* Phone & Email */}
        {(profile.phone || profile.email) && (
          <div className="flex items-center gap-4">
            {profile.phone && (
              <a
                href={'tel:' + profile.phone}
                className="relative w-13 h-13 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
                aria-label="Call"
              >
                <div className="absolute inset-0 rounded-full pointer-events-none p-[1.5px]" style={silverBorderMask} />
                <Phone className="w-5 h-5 text-white relative z-10" />
              </a>
            )}
            {profile.email && (
              <a
                href={'mailto:' + profile.email}
                className="relative w-13 h-13 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
                aria-label="Email"
              >
                <div className="absolute inset-0 rounded-full pointer-events-none p-[1.5px]" style={silverBorderMask} />
                <Mail className="w-5 h-5 text-white relative z-10" />
              </a>
            )}
          </div>
        )}

        {/* Profile Avatar */}
        <div className="relative w-[134px] h-[134px] rounded-full flex-shrink-0 shadow-2xl">
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
                <span className="text-3xl font-bold text-white/20">{initials}</span>
              </div>
            )}
          </div>
        </div>

        {/* Name / Title / Company / Bio */}
        <div className="text-center w-full">
          <h1 className={`text-2xl font-bold tracking-tight text-white mb-1 drop-shadow-md ${getFontClass(profile.layoutFont)}`}>
            {fullName}
          </h1>
          {profile.jobTitle && (
            <p className={`text-base text-white/80 font-medium drop-shadow-md mb-0.5 ${getFontClass(profile.layoutFont)}`}>
              {profile.jobTitle}
            </p>
          )}
          {profile.companyName && (
            <p className={`text-sm text-white/60 drop-shadow-md max-w-xs mx-auto ${getFontClass(profile.layoutFont)}`}>
              {profile.companyName}
            </p>
          )}
          {profile.bio && (
            <p className="mt-2 text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Social Links Row */}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            {socialLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="relative w-11 h-11 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/40 transition-colors"
              >
                <div className="absolute inset-0 rounded-full pointer-events-none p-[1.5px]" style={silverBorderMask} />
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  {link.icon}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Action Buttons — hidden for owner */}
        {resolved && !isOwner && (
          <div className="flex flex-col items-center justify-center gap-2 w-full max-w-[280px]">
            {viewerState.isLoggedIn ? (
              <>
                <div className="flex w-full gap-2">
                  <button
                    onClick={handleSaveContact}
                    aria-label="Save Contact"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-white text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save Contact
                  </button>
                  <button
                    onClick={saved ? undefined : handleToggleSave}
                    aria-label={saved ? 'Already connected' : 'Save to My Connections'}
                    disabled={saved}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold transition-colors ${
                      saved
                        ? 'bg-green-400/15 text-green-300 border-green-400/20 cursor-default'
                        : 'bg-black/20 border-white/10 hover:bg-white/10 text-white/90 backdrop-blur-sm'
                    }`}
                  >
                    {saved ? (
                      <><UserCheck className="w-3.5 h-3.5" />Connected</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5" />Connect</>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setShowExchangeDrawer(true)}
                  disabled={viewerState.exchangeStatus === 'pending' || viewerState.exchangeStatus === 'accepted'}
                  aria-label="Exchange Details"
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors text-white text-xs font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-brand-300" />
                  {viewerState.exchangeStatus === 'accepted'
                    ? 'Details Shared ✓'
                    : viewerState.exchangeStatus === 'pending'
                    ? 'Exchange Pending'
                    : 'Exchange Details'}
                </button>
              </>
            ) : (
              <>
                <div className="flex w-full gap-2">
                  <button
                    onClick={handleSaveContact}
                    aria-label="Save Contact"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-white text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save Contact
                  </button>
                  <button
                    onClick={() => setShowExchangeDrawer(true)}
                    disabled={viewerState.exchangeStatus === 'pending' || viewerState.exchangeStatus === 'accepted'}
                    aria-label="Exchange Details"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors text-white text-xs font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-brand-300" />
                    {viewerState.exchangeStatus === 'accepted'
                      ? 'Shared ✓'
                      : viewerState.exchangeStatus === 'pending'
                      ? 'Pending'
                      : 'Exchange'}
                  </button>
                </div>
                <Link
                  href={`/signup?redirect=/p/${profile.slug || profile.id}`}
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors text-white text-xs font-semibold"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Sign In to Save Connection
                </Link>
              </>
            )}
          </div>
        )}

        {/* Company Logo */}
        {profile.companyLogoUrl && (
          <div className="flex justify-center">
            <div className="relative w-24 h-12 rounded-xl shadow-xl">
              <div className="absolute inset-0 rounded-xl pointer-events-none p-[1.5px] z-20" style={silverBorderMask} />
              <div className="w-full h-full rounded-xl overflow-hidden bg-black/20 backdrop-blur-md relative z-10">
                <img
                  src={profile.companyLogoUrl}
                  alt={profile.companyName || 'Company Logo'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA — in flow, always at the bottom */}
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
      
      <ExchangeDetailsDrawer
        open={showExchangeDrawer}
        onOpenChange={setShowExchangeDrawer}
        targetProfileId={profile.id}
        targetProfileName={fullName}
        isLoggedIn={viewerState.isLoggedIn}
        onExchangeSuccess={() => {
          window.location.reload();
        }}
        cardUid={cardUid}
        exchangeStatus={viewerState.exchangeStatus}
        sourceChannel={sourceChannel}
      />
    </div>
  );
}


