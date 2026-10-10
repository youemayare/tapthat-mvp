'use client';

import Link from 'next/link';
import type { Profile } from '@/lib/db/schema';
import { buildWhatsAppUrl, getFontClass } from '@/lib/utils';
import {
  Phone, Mail, Globe, Download,
  FileText,
  UserPlus, UserCheck, Home, Share, MessageCircle, BookmarkPlus
} from 'lucide-react';
import { ConnectionNoteModal } from '../connection-note-modal';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FaLinkedin, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { useProfileActions } from '@/components/profile/use-profile-actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { ExchangeDetailsDrawer } from '../exchange-details-drawer';
import { GuestConversionDrawer } from '../guest-conversion-drawer';

interface Props {
  profile: Partial<Profile> & { id: string; userId: string };
  cardUid: string;
}

export function CanvasProfileLayout({ profile, cardUid }: Props) {
  const {
    viewerState,
    saved,
    savingNote,
    guestFlow,
    showNoteModal,
    noteContent,
    setNoteContent,
    setShowNoteModal,
    handleSaveContact,
    handleToggleSave,
    handleSaveConnectionAndNote,
    setAudioBlob,
    setAudioDuration,
    sourceChannel,
  } = useProfileActions(profile, cardUid);

  const { isOwner, resolved } = viewerState;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

  const handleShare = async () => {
    const url = window.location.href;
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    if (navigator.share) {
      try {
        await navigator.share({
          title: fullName || 'Tayz Profile',
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
                <div className="absolute inset-0 rounded-full pointer-events-none p-[1.5px] samsung-canvas-silver-ring" style={silverBorderMask}>
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='25%25' stop-color='%23a0a0a0'/%3E%3Cstop offset='50%25' stop-color='%23d4d4d4'/%3E%3Cstop offset='75%25' stop-color='%23888888'/%3E%3Cstop offset='100%25' stop-color='%23c0c0c0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='48.5' fill='none' stroke='url(%23s)' stroke-width='3'/%3E%3C/svg%3E" 
                    alt="" 
                    className="hidden samsung-img-layer absolute inset-0 w-full h-full pointer-events-none z-20" 
                  />
                </div>
                <Phone className="w-5 h-5 text-white relative z-10" />
              </a>
            )}
            {profile.email && (
              <a
                href={'mailto:' + profile.email}
                className="relative w-13 h-13 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-colors"
                aria-label="Email"
              >
                <div className="absolute inset-0 rounded-full pointer-events-none p-[1.5px] samsung-canvas-silver-ring" style={silverBorderMask}>
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='25%25' stop-color='%23a0a0a0'/%3E%3Cstop offset='50%25' stop-color='%23d4d4d4'/%3E%3Cstop offset='75%25' stop-color='%23888888'/%3E%3Cstop offset='100%25' stop-color='%23c0c0c0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='48.5' fill='none' stroke='url(%23s)' stroke-width='3'/%3E%3C/svg%3E" 
                    alt="" 
                    className="hidden samsung-img-layer absolute inset-0 w-full h-full pointer-events-none z-20" 
                  />
                </div>
                <Mail className="w-5 h-5 text-white relative z-10" />
              </a>
            )}
          </div>
        )}

        {/* Profile Avatar */}
        <div className="relative w-[134px] h-[134px] rounded-full flex-shrink-0 shadow-2xl">
          <div className="absolute inset-0 rounded-full pointer-events-none p-[2px] z-20 samsung-canvas-silver-ring" style={silverBorderMask}>
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='25%25' stop-color='%23a0a0a0'/%3E%3Cstop offset='50%25' stop-color='%23d4d4d4'/%3E%3Cstop offset='75%25' stop-color='%23888888'/%3E%3Cstop offset='100%25' stop-color='%23c0c0c0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='48.5' fill='none' stroke='url(%23s)' stroke-width='3'/%3E%3C/svg%3E" 
                    alt="" 
                    className="hidden samsung-img-layer absolute inset-0 w-full h-full pointer-events-none z-20" 
                  />
                </div>
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
                <div className="absolute inset-0 rounded-full pointer-events-none p-[1.5px] samsung-canvas-silver-ring" style={silverBorderMask}>
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='25%25' stop-color='%23a0a0a0'/%3E%3Cstop offset='50%25' stop-color='%23d4d4d4'/%3E%3Cstop offset='75%25' stop-color='%23888888'/%3E%3Cstop offset='100%25' stop-color='%23c0c0c0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='48.5' fill='none' stroke='url(%23s)' stroke-width='3'/%3E%3C/svg%3E" 
                    alt="" 
                    className="hidden samsung-img-layer absolute inset-0 w-full h-full pointer-events-none z-20" 
                  />
                </div>
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
                    className="relative overflow-hidden group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-white text-xs font-bold samsung-canvas-btn"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      Save Contact
                    </span>
                  </button>
                  <button
                    onClick={saved ? undefined : handleToggleSave}
                    aria-label={saved ? 'Already connected' : 'Save to My Connections'}
                    disabled={saved}
                    className={`relative overflow-hidden group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold transition-colors ${
                      saved
                        ? 'bg-green-400/15 text-green-300 border-green-400/20 cursor-default'
                        : 'bg-black/20 border-white/10 hover:bg-white/10 text-white/90 backdrop-blur-sm'
                    }`}
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-current opacity-10 to-transparent animate-shimmer pointer-events-none" />
                    <span className="relative z-10 flex items-center gap-1.5">
                      {saved ? (
                        <><UserCheck className="w-3.5 h-3.5" />Connected</>
                      ) : (
                        <><UserPlus className="w-3.5 h-3.5" />Connect</>
                      )}
                    </span>
                  </button>
                </div>
                <button
                  onClick={() => guestFlow.handleManualExchangeClick()}
                  disabled={viewerState.exchangeStatus === 'pending' || viewerState.exchangeStatus === 'accepted'}
                  aria-label="Exchange Details"
                  className="relative overflow-hidden group flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors text-white text-xs font-semibold samsung-canvas-btn"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-current opacity-10 to-transparent animate-shimmer pointer-events-none" />
                  <span className="relative z-10 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-brand-300" />
                    {viewerState.exchangeStatus === 'accepted'
                      ? 'Details Shared ✓'
                      : viewerState.exchangeStatus === 'pending'
                      ? 'Exchange Pending'
                      : 'Exchange Details'}
                  </span>
                </button>
              </>
            ) : (
              <>
                <div className="flex w-full gap-2">
                  <button
                    onClick={handleSaveContact}
                    aria-label="Save Contact"
                    className="relative overflow-hidden group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-white/30 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors text-white text-xs font-bold samsung-canvas-btn"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      <Download className="w-3.5 h-3.5" />
                      Save Contact
                    </span>
                  </button>
                  <button
                    onClick={() => guestFlow.handleManualExchangeClick()}
                    disabled={viewerState.exchangeStatus === 'pending' || viewerState.exchangeStatus === 'accepted'}
                    aria-label="Exchange Details"
                    className="relative overflow-hidden group flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors text-white text-xs font-semibold samsung-canvas-btn"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-current opacity-10 to-transparent animate-shimmer pointer-events-none" />
                    <span className="relative z-10 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-brand-300" />
                      {viewerState.exchangeStatus === 'accepted'
                        ? 'Shared 👋'
                        : viewerState.exchangeStatus === 'pending'
                        ? 'Pending'
                        : 'Exchange'}
                    </span>
                  </button>
                </div>
                <Link
                  href={`/signup?redirect=/p/${profile.slug || profile.id}`}
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors text-white text-xs font-semibold samsung-canvas-btn"
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
              <div className="absolute inset-0 rounded-xl pointer-events-none p-[1.5px] z-20 samsung-canvas-silver-rect" style={silverBorderMask}>
                  <img 
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 48' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e8e8e8'/%3E%3Cstop offset='25%25' stop-color='%23a0a0a0'/%3E%3Cstop offset='50%25' stop-color='%23d4d4d4'/%3E%3Cstop offset='75%25' stop-color='%23888888'/%3E%3Cstop offset='100%25' stop-color='%23c0c0c0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='1' y='1' width='94' height='46' rx='11' fill='none' stroke='url(%23s)' stroke-width='2'/%3E%3C/svg%3E" 
                  alt="" 
                  className="hidden samsung-img-layer absolute inset-0 w-full h-full pointer-events-none z-20" 
                />
                </div>
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
          Want your own custom card? <span className="text-white ml-0.5 font-semibold">Get Tayz</span>
        </Link>

      </div>

      {/* Connection Note Modal */}
      <ConnectionNoteModal
        open={showNoteModal}
        onOpenChange={setShowNoteModal}
        profile={profile}
        noteContent={noteContent}
        setNoteContent={setNoteContent}
        setAudioBlob={setAudioBlob}
        setAudioDuration={setAudioDuration}
        savingNote={savingNote}
        onSave={handleSaveConnectionAndNote}
      />
      
      <ExchangeDetailsDrawer
        open={guestFlow.showExchange}
        onOpenChange={guestFlow.setShowExchange}
        targetProfileId={profile.id}
        targetProfileName={fullName}
        isLoggedIn={viewerState.isLoggedIn}
        onExchangeSuccess={() => {
          if (viewerState.isLoggedIn) {
            window.location.reload();
          }
        }}
        cardUid={cardUid}
        exchangeStatus={viewerState.exchangeStatus}
        sourceChannel={sourceChannel}
        onGuestFlowComplete={guestFlow.handleGuestFlowComplete}
      />

      <GuestConversionDrawer
        open={guestFlow.showConversion}
        onOpenChange={guestFlow.setShowConversion}
        targetProfileName={fullName}
        targetProfileHandle={profile.slug || profile.id}
        targetProfilePhotoUrl={profile.profilePhotoUrl}
        targetProfileInitials={initials}
        erasureToken={guestFlow.guestSuccessData?.erasureToken}
        exchangeId={guestFlow.guestSuccessData?.id}
      />
    </div>
  );
}


