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
    <div className="min-h-[100dvh] w-full relative bg-[#F7F7F5] dark:bg-[#0B0A08] text-[#1A1A1A] dark:text-[#F6F1E6] font-sans transition-colors duration-300 overflow-x-hidden selection:bg-[#D9DDE1] dark:selection:bg-[#C9A45D]/30 pb-16">
      
      {/* Background Layer */}
      {hasBackground && (
        <>
          <div 
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-30 mix-blend-multiply dark:mix-blend-overlay"
            style={{ backgroundImage: `url(${profile.layoutBackgroundImageUrl})` }}
          />
          {/* Subtle gradient overlay to ensure text legibility */}
          <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#F7F7F5]/80 to-[#F7F7F5] dark:from-transparent dark:via-[#0B0A08]/90 dark:to-[#0B0A08]" />
        </>
      )}

      <div className="relative z-10 max-w-lg mx-auto w-full px-6 pt-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          {viewerState.isLoggedIn && !viewerState.isOwner ? (
            <Link 
              href="/dashboard" 
              className="w-10 h-10 rounded-full flex items-center justify-center border border-[#D8DADD] dark:border-[#C9A45D]/20 bg-white/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#1A1A1A] dark:text-[#C9A45D] transition-colors"
            >
              <Home className="w-4 h-4" />
            </Link>
          ) : (
            <div className="w-10" /> /* Spacer for centering */
          )}

          {/* Optional small logo could go here in center if needed */}
          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            <ThemeToggle className="rounded-full border border-[#D8DADD] dark:border-[#C9A45D]/20 bg-white/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#1A1A1A] dark:text-[#C9A45D]" />
            <button 
              onClick={handleShare}
              aria-label="Share profile"
              className="w-10 h-10 rounded-full flex items-center justify-center border border-[#D8DADD] dark:border-[#C9A45D]/20 bg-white/50 dark:bg-[#15130F]/50 backdrop-blur-sm text-[#1A1A1A] dark:text-[#C9A45D] transition-colors hover:bg-white dark:hover:bg-[#15130F]"
            >
              <Share className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Identity Block */}
        <div className="flex flex-col items-center text-center">
          <div className="w-28 h-28 mb-6 rounded-full p-[2px] bg-gradient-to-tr from-[#A9ADB2] to-[#E8EAEB] dark:from-[#B98A3D] dark:to-[#E4C98F] shadow-sm">
            <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-[#15130F] flex items-center justify-center">
              {profile.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-playfair text-[#7B8188] dark:text-[#C9A45D]">{initials}</span>
              )}
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-playfair tracking-tight mb-2 font-medium">
            {fullName || 'Name'}
          </h1>
          
          {profile.jobTitle && (
            <div className="mt-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#F0F1F2] dark:bg-[#17140F] text-[#62666B] dark:text-[#C9A45D] border border-[#D8DADD] dark:border-[#C9A45D]/20">
                {profile.jobTitle}
              </span>
            </div>
          )}

          {profile.companyName && (
            <div className="mt-4 flex flex-col items-center">
              {profile.companyLogoUrl && (
                <img src={profile.companyLogoUrl} alt={profile.companyName} className="h-8 mb-2 object-contain" />
              )}
              <h2 className="text-[15px] font-medium text-[#1A1A1A] dark:text-[#B8B0A2]">
                {profile.companyName}
              </h2>
            </div>
          )}

          {profile.bio && (
            <p className="mt-5 text-[15px] leading-relaxed text-[#62666B] dark:text-[#B8B0A2] max-w-sm">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col gap-3">
          <button 
            onClick={handleSaveContact}
            className="w-full h-12 rounded-xl flex items-center justify-center font-semibold text-[15px] transition-all
              bg-gradient-to-b from-[#FFFFFF] to-[#F4F5F6] border border-[#D8DADD] text-[#1A1A1A] shadow-sm
              dark:bg-gradient-to-b dark:from-[#C9A45D] dark:to-[#B98A3D] dark:border-[#B98A3D] dark:text-[#0B0A08]
              hover:opacity-90 active:scale-[0.98]"
          >
            Save Contact
          </button>

          {(viewerState.isLoggedIn && !viewerState.isOwner) && (
            <button 
              onClick={handleToggleSave}
              className="w-full h-12 rounded-xl flex items-center justify-center font-medium text-[15px] transition-all
                bg-transparent border border-[#D8DADD] text-[#1A1A1A] 
                dark:border-[#C9A45D]/30 dark:text-[#F6F1E6]
                hover:bg-[#F0F1F2] dark:hover:bg-[#17140F] active:scale-[0.98]"
            >
              {saved ? 'Saved to Connections' : 'Save to Connections'}
            </button>
          )}
        </div>

        {/* Divider */}
        {contactRows.length > 0 && (
          <div className="w-full flex justify-center my-10">
            <div className="w-12 h-[1px] bg-[#A9ADB2] dark:bg-[#C9A45D]/40" />
          </div>
        )}

        {/* Contact Rows */}
        {contactRows.length > 0 && (
          <div className="space-y-0 border-t border-[#D8DADD] dark:border-[#C9A45D]/10">
            {contactRows.map((row, idx) => (
              <a 
                key={idx}
                href={row.href}
                target={row.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="flex items-center justify-between py-4 border-b border-[#D8DADD] dark:border-[#C9A45D]/10 hover:bg-[#F0F1F2]/50 dark:hover:bg-[#15130F]/50 transition-colors group"
              >
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[#7B8188] dark:text-[#B8B0A2]/70 group-hover:text-[#1A1A1A] dark:group-hover:text-[#C9A45D] transition-colors">
                  {row.label}
                </span>
                <span className="text-[15px] font-medium text-[#1A1A1A] dark:text-[#F6F1E6] truncate pl-4">
                  {row.value}
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-[11px] text-[#A9ADB2] dark:text-[#B8B0A2]/50 uppercase tracking-widest font-semibold">
            Powered by Anoya
          </p>
        </div>
      </div>

      {/* Save Connection Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#15130F] border-[#D8DADD] dark:border-[#C9A45D]/20 text-[#1A1A1A] dark:text-[#F6F1E6]">
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
              className="resize-none bg-transparent border-[#D8DADD] dark:border-[#C9A45D]/20 placeholder:text-[#A9ADB2] dark:placeholder:text-[#B8B0A2]/50 focus-visible:ring-[#7B8188] dark:focus-visible:ring-[#C9A45D]"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteModal(false)} className="border-[#D8DADD] dark:border-[#C9A45D]/20 text-[#1A1A1A] dark:text-[#F6F1E6] hover:bg-[#F0F1F2] dark:hover:bg-[#17140F]">
              Cancel
            </Button>
            <Button onClick={handleSaveConnectionAndNote} disabled={savingNote} className="bg-[#1A1A1A] dark:bg-[#C9A45D] text-white dark:text-[#0B0A08] hover:bg-[#1A1A1A]/90 dark:hover:bg-[#B98A3D]">
              {savingNote ? 'Saving...' : 'Save Connection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
