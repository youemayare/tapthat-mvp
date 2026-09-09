'use client';

import Link from 'next/link';
import type { Profile } from '@/lib/db/schema';
import { buildWhatsAppUrl } from '@/lib/utils';
import { Share, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useProfileActions } from '@/components/profile/use-profile-actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

interface Props {
  profile: Partial<Profile> & { id: string; userId: string };
  cardUid: string;
}

export function ProfessionalProfileLayout({ profile, cardUid }: Props) {
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
    handleToggleSave
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
    <div className="min-h-[100dvh] w-full relative bg-gradient-to-b from-[#F7F7F5] to-[#E8EAEB] dark:bg-none dark:bg-[#0B0A08] text-[#1A1A1A] dark:text-[#F6F1E6] font-sans transition-colors duration-300 overflow-x-hidden selection:bg-[#C9A45D]/20 pb-16">
      
      {/* Background Layer - Hidden in Light Mode */}
      {hasBackground && (
        <>
          <div 
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat hidden dark:block opacity-30 mix-blend-overlay"
            style={{ backgroundImage: `url(${profile.layoutBackgroundImageUrl})` }}
          />
          <div className="fixed inset-0 z-0 hidden dark:block bg-gradient-to-b from-transparent via-[#0B0A08]/90 to-[#0B0A08]" />
        </>
      )}

      <div className="relative z-10 max-w-lg mx-auto w-full px-6 pt-6 flex flex-col min-h-[100dvh]">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          {viewerState.isLoggedIn && !viewerState.isOwner ? (
            <Link 
              href="/dashboard" 
              className="w-10 h-10 rounded-full flex items-center justify-center border border-[#C9A45D]/30 dark:border-[#C9A45D]/20 bg-white/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#C9A45D] transition-colors"
            >
              <Home className="w-4 h-4" />
            </Link>
          ) : (
            <div className="w-10" />
          )}

          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            <ThemeToggle className="rounded-full border border-[#C9A45D]/30 dark:border-[#C9A45D]/20 bg-white/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#C9A45D]" />
            <button 
              onClick={handleShare}
              aria-label="Share profile"
              className="w-10 h-10 rounded-full flex items-center justify-center border border-[#C9A45D]/30 dark:border-[#C9A45D]/20 bg-white/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#C9A45D] transition-colors hover:bg-white dark:hover:bg-[#15130F]"
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

          <h1 className="text-4xl md:text-5xl font-playfair tracking-tight mb-2 font-medium">
            {fullName || 'Name'}
          </h1>
          
          {profile.jobTitle && (
            <div className="mt-2">
              <span className="inline-block text-[13px] font-medium tracking-wide text-[#62666B] dark:text-[#B8B0A2]">
                {profile.jobTitle}
              </span>
            </div>
          )}

          {profile.companyLogoUrl && (
            <div className="mt-6 flex flex-col items-center">
              <div className="w-24 h-12 rounded-lg overflow-hidden shadow-sm border border-[#C9A45D]/20 bg-[#F7F7F5] dark:bg-[#15130F]">
                <img src={profile.companyLogoUrl} alt={profile.companyName || 'Company Logo'} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {profile.bio && (
            <div className="mt-6 flex justify-center w-full">
              <p className="text-[15px] leading-relaxed text-[#62666B] dark:text-[#B8B0A2] max-w-sm relative px-6">
                <span className="absolute left-0 top-0 text-2xl text-[#C9A45D]/40 font-playfair">"</span>
                {profile.bio}
                <span className="absolute right-0 bottom-[-10px] text-2xl text-[#C9A45D]/40 font-playfair">"</span>
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col gap-3 w-full max-w-sm mx-auto">
          <button 
            onClick={handleSaveContact}
            className="w-full h-12 rounded-full flex items-center justify-center font-medium text-[15px] tracking-wide transition-all
              bg-gradient-to-b from-[#C9A45D] to-[#B98A3D] border border-[#B98A3D] text-white dark:text-[#0B0A08] shadow-md
              hover:opacity-90 active:scale-[0.98]"
          >
            Save Contact
          </button>

          {(viewerState.isLoggedIn && !viewerState.isOwner) && (
            <button 
              onClick={saved ? undefined : handleToggleSave}
              disabled={saved}
              className={`w-full h-12 rounded-full flex items-center justify-center font-medium text-[15px] tracking-wide transition-all ${
                saved 
                  ? 'bg-gradient-to-b from-[#C9A45D]/80 to-[#B98A3D]/80 border-transparent text-white dark:text-[#0B0A08] cursor-default'
                  : 'bg-transparent border border-[#C9A45D]/40 text-[#1A1A1A] dark:border-[#C9A45D]/40 dark:text-[#F6F1E6] hover:bg-[#C9A45D]/5 active:scale-[0.98]'
              }`}
            >
              {saved ? 'Saved to Connections' : 'Save to Connections'}
            </button>
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
    </div>
  );
}
