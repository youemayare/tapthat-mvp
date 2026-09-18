'use client';

import Link from 'next/link';
import type { Profile } from '@/lib/db/schema';
import { buildWhatsAppUrl } from '@/lib/utils';
import { Share, Home, BookmarkPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useProfileActions } from '@/components/profile/use-profile-actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { ExchangeDetailsDrawer } from '../exchange-details-drawer';
import { GuestConversionDrawer } from '../guest-conversion-drawer';

interface Props {
  profile: Partial<Profile> & { id: string; userId: string };
  cardUid: string;
}

export function ProfessionalProfileLayout({ profile, cardUid }: Props) {
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
    handleSaveConnectionAndNote,
    handleToggleSave,
    sourceChannel
  } = useProfileActions(profile, cardUid);

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const initials = fullName
    ? (profile.firstName?.[0] || '') + (profile.lastName?.[0] || '')
    : '?';

  const contactRows = [
    profile.phone && { label: 'MOBILE', value: profile.phone, href: `tel:${profile.phone}` },
    profile.whatsapp && { label: 'WHATSAPP', value: 'Chat on WhatsApp', href: buildWhatsAppUrl(profile.whatsapp) },
    profile.email && { label: 'EMAIL', value: profile.email, href: `mailto:${profile.email}` },
    profile.websiteUrl && { 
      label: 'WEB', 
      value: new URL(profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`).hostname.replace('www.', ''), 
      href: profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}` 
    },
    profile.linkedinUrl && { label: 'LINKEDIN', value: 'View profile', href: profile.linkedinUrl },
    profile.instagramUrl && { label: 'INSTAGRAM', value: 'View profile', href: profile.instagramUrl },
  ].filter(Boolean) as { label: string; value: string; href: string }[];

  const handleShare = async () => {
    const url = window.location.href;
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
      toast.success('Link copied to clipboard!');
    }
  };

  const hasBackground = !!profile.layoutBackgroundImageUrl;

  return (
    <div className="min-h-[100dvh] w-full relative bg-gradient-to-b from-[#F7F7F5] to-[#E8EAEB] dark:from-[#1A1814] dark:to-[#050403] text-[#1A1A1A] dark:text-[#F6F1E6] font-sans transition-colors duration-300 overflow-x-hidden selection:bg-[#C9A45D]/20 pb-16">
      
      {/* Background Layer - Hidden in Light Mode */}
      {hasBackground && (
        <>
          <div 
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat hidden dark:block opacity-30 mix-blend-overlay"
            style={{ backgroundImage: `url(${profile.layoutBackgroundImageUrl})` }}
          />
          <div className="fixed inset-0 z-0 hidden dark:block bg-gradient-to-b from-transparent via-[#050403]/90 to-[#050403]" />
        </>
      )}

      <div className="relative z-10 max-w-lg mx-auto w-full px-6 pt-6 flex flex-col min-h-[100dvh]">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {viewerState.isLoggedIn && !viewerState.isOwner ? (
              <Link 
                href="/dashboard" 
                className="w-10 h-10 rounded-full flex items-center justify-center border border-[#C9A45D]/30 dark:border-[#C9A45D]/20 bg-[#F7F7F5]/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#C9A45D] transition-colors hover:bg-[#F7F7F5] dark:hover:bg-[#15130F]"
              >
                <Home className="w-4 h-4" />
              </Link>
            ) : viewerState.isOwner ? (
              <Link 
                href="/dashboard" 
                className="w-10 h-10 rounded-full flex items-center justify-center border border-[#C9A45D]/30 dark:border-[#C9A45D]/20 bg-[#F7F7F5]/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#C9A45D] transition-colors hover:bg-[#F7F7F5] dark:hover:bg-[#15130F]"
              >
                <Home className="w-4 h-4" />
              </Link>
            ) : (
              <div className="w-10 h-10" />
            )}
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            <ThemeToggle className="rounded-full border border-[#C9A45D]/30 dark:border-[#C9A45D]/20 bg-[#F7F7F5]/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#C9A45D]" />
            <button 
              onClick={handleShare}
              aria-label="Share profile"
              className="w-10 h-10 rounded-full flex items-center justify-center border border-[#C9A45D]/30 dark:border-[#C9A45D]/20 bg-[#F7F7F5]/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#C9A45D] transition-colors hover:bg-[#F7F7F5] dark:hover:bg-[#15130F]"
            >
              <Share className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Identity Block */}
        <div className="flex flex-col items-center text-center">
          {profile.companyName && (
            <div className="mb-10 flex items-center justify-center w-full max-w-[280px] opacity-80">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#C9A45D]/50" />
              <h2 className="px-4 text-[11px] uppercase tracking-[0.25em] font-semibold text-[#B98A3D] dark:text-[#C9A45D]">
                {profile.companyName}
              </h2>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#C9A45D]/50" />
            </div>
          )}

          <div className="w-32 h-32 mb-6 rounded-full p-[1.5px] bg-gradient-to-tr from-[#B98A3D] via-[#E4C98F] to-[#B98A3D] shadow-md">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#F7F7F5] dark:bg-[#15130F] flex items-center justify-center">
              {profile.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-playfair text-[#C9A45D]">{initials}</span>
              )}
            </div>
          </div>

          <h1 className="text-4xl font-playfair font-medium mb-3 tracking-tight">
            {fullName}
          </h1>
          
          {profile.jobTitle && (
            <p className="text-[13px] uppercase tracking-[0.15em] font-medium text-[#62666B] dark:text-[#B8B0A2]">
              {profile.jobTitle}
            </p>
          )}

          {profile.companyLogoUrl && (
            <div className="mt-6 flex flex-col items-center">
              <div className="w-24 h-12 rounded-lg overflow-hidden shadow-sm border border-[#C9A45D]/20 bg-[#F7F7F5] dark:bg-[#15130F]">
                <img src={profile.companyLogoUrl} alt={profile.companyName || 'Company Logo'} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {profile.bio && (
            <p className="mt-8 text-[15px] leading-relaxed max-w-sm mx-auto text-[#4A4D52] dark:text-[#D4D0C5] font-light">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col gap-3 w-full max-w-sm mx-auto">
          {(!viewerState.resolved || viewerState.isOwner) && (
            <button 
              onClick={handleSaveContact}
              className="relative overflow-hidden group w-full h-12 rounded-full flex items-center justify-center font-medium text-[15px] tracking-wide transition-all
                bg-gradient-to-b from-[#C9A45D] to-[#B98A3D] border border-[#B98A3D] text-white dark:text-[#0B0A08] shadow-md
                hover:opacity-90 active:scale-[0.98]"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
              <span className="relative z-10 flex items-center justify-center">
                Save Contact
              </span>
            </button>
          )}

          {viewerState.resolved && !viewerState.isOwner && (
            <>
              <button 
                onClick={handleSaveContact}
                className="relative overflow-hidden group w-full h-12 rounded-full flex items-center justify-center font-medium text-[15px] tracking-wide transition-all
                  bg-gradient-to-b from-[#C9A45D] to-[#B98A3D] border border-[#B98A3D] text-white dark:text-[#0B0A08] shadow-md
                  hover:opacity-90 active:scale-[0.98]"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
                <span className="relative z-10 flex items-center justify-center">
                  Save Contact
                </span>
              </button>
              
              {viewerState.isLoggedIn && (
                <button 
                  onClick={saved ? undefined : handleToggleSave}
                  disabled={saved}
                  className={`relative overflow-hidden group w-full h-12 rounded-full flex items-center justify-center font-medium text-[15px] tracking-wide transition-all ${
                    saved 
                      ? 'bg-[#C9A45D]/10 border border-[#C9A45D]/30 text-[#B98A3D] dark:text-[#C9A45D] cursor-default opacity-80'
                      : 'bg-transparent border border-[#C9A45D]/40 text-[#1A1A1A] dark:border-[#C9A45D]/40 dark:text-[#F6F1E6] hover:bg-[#C9A45D]/5 active:scale-[0.98]'
                  }`}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-current opacity-10 to-transparent animate-shimmer pointer-events-none" />
                  <span className="relative z-10 flex items-center justify-center">
                    {saved ? 'Saved to Connections' : 'Save to Connections'}
                  </span>
                </button>
              )}

              <button
                onClick={() => guestFlow.handleManualExchangeClick()}
                disabled={viewerState.exchangeStatus === 'pending' || viewerState.exchangeStatus === 'accepted'}
                className="relative overflow-hidden group w-full h-12 rounded-full flex items-center justify-center font-medium text-[15px] tracking-wide transition-all bg-transparent border-2 border-[#C9A45D]/40 text-[#1A1A1A] dark:text-[#F6F1E6] hover:bg-[#C9A45D]/5 active:scale-[0.98]"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-current opacity-10 to-transparent animate-shimmer pointer-events-none" />
                <span className="relative z-10 flex items-center justify-center">
                  {viewerState.exchangeStatus === 'accepted' 
                    ? 'Details Shared ✓' 
                    : viewerState.exchangeStatus === 'pending'
                    ? 'Exchange Pending'
                    : 'Exchange Details'}
                </span>
              </button>

              {!viewerState.isLoggedIn && (
                <Link
                  href={`/signup?save=${cardUid}`}
                  className="relative overflow-hidden group w-full h-12 rounded-full flex items-center justify-center font-medium text-[15px] tracking-wide transition-all bg-transparent border border-[#C9A45D]/20 text-[#1A1A1A]/80 dark:text-[#F6F1E6]/80 hover:bg-[#C9A45D]/5 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-current opacity-10 to-transparent animate-shimmer pointer-events-none" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <BookmarkPlus className="w-4 h-4" />
                    Sign In to Save Connection
                  </span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Decorative Divider */}
        {contactRows.length > 0 && (
          <div className="w-full flex justify-center items-center gap-3 my-12 opacity-70">
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#C9A45D]" />
            <div className="w-1.5 h-1.5 rotate-45 border border-[#C9A45D]" />
            <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#C9A45D]" />
          </div>
        )}

        {/* Contact Rows */}
        {contactRows.length > 0 && (
          <div className="space-y-0 border-t border-[#C9A45D]/20">
            {contactRows.map((row, idx) => (
              <a 
                key={idx}
                href={row.href}
                target={row.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="flex items-center justify-between py-4 border-b border-[#C9A45D]/20 hover:bg-[#C9A45D]/5 transition-colors group"
              >
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[#B98A3D] dark:text-[#C9A45D]/80 group-hover:text-[#C9A45D] transition-colors">
                  {row.label}
                </span>
                <span className="text-[15px] font-medium text-[#1A1A1A] dark:text-[#F6F1E6] truncate pl-4">
                  {row.value}
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="flex-1" /> {/* Pushes footer to bottom */}

        {/* Footer CTAs */}
        <div className="mt-16 mb-8 text-center flex flex-col items-center justify-center gap-4">
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#C9A45D]/10 hover:bg-[#C9A45D]/20 border border-[#C9A45D]/20 text-[#B98A3D] dark:text-[#C9A45D] text-[13px] font-medium rounded-full transition-all duration-300"
          >
            Want your own custom card? <span className="text-[#1A1A1A] dark:text-[#F6F1E6] ml-0.5">Get Anoya</span>
          </Link>
          <p className="text-[10px] text-[#A9ADB2] dark:text-[#B8B0A2]/50 uppercase tracking-widest font-semibold">
            Powered by <Link href="/" className="hover:text-[#C9A45D] transition-colors">Anoya</Link>
          </p>
        </div>
      </div>

      {/* Save Connection Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="sm:max-w-md bg-[#F7F7F5] dark:bg-[#15130F] border-[#C9A45D]/30 text-[#1A1A1A] dark:text-[#F6F1E6]">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-medium">Add a Note</DialogTitle>
            <DialogDescription className="text-[#62666B] dark:text-[#B8B0A2]">
              Add context on how you met or what you discussed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="e.g., Met at the real estate summit..."
              className="resize-none bg-transparent border-[#C9A45D]/30 placeholder:text-[#A9ADB2] dark:placeholder:text-[#B8B0A2]/50 focus-visible:ring-[#C9A45D]"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteModal(false)} className="border-[#C9A45D]/30 text-[#1A1A1A] dark:text-[#F6F1E6] hover:bg-[#C9A45D]/10">
              Cancel
            </Button>
            <Button onClick={handleSaveConnectionAndNote} disabled={savingNote} className="bg-gradient-to-r from-[#C9A45D] to-[#B98A3D] text-white dark:text-[#0B0A08] hover:opacity-90 border-0">
              {savingNote ? 'Saving...' : 'Save Connection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
