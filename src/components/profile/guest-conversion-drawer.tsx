'use client';

import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X, Handshake, User } from 'lucide-react';
import Link from 'next/link';

interface GuestConversionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetProfileName: string;
  targetProfileHandle: string;
  targetProfilePhotoUrl?: string | null;
  targetProfileInitials?: string;
  erasureToken?: string;
  exchangeId?: string;
}

export function GuestConversionDrawer({
  open,
  onOpenChange,
  targetProfileName,
  targetProfileHandle,
  targetProfilePhotoUrl,
  targetProfileInitials,
  erasureToken,
  exchangeId,
}: GuestConversionDrawerProps) {
  
  // Base referral URL
  let signupUrlStr = '/signup?referrer=' + encodeURIComponent(targetProfileHandle);
  if (exchangeId) {
    signupUrlStr += '&exchange_id=' + encodeURIComponent(exchangeId);
  }

  const removalUrl = (erasureToken && exchangeId) 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/remove-exchange/${exchangeId}/${erasureToken}`
    : null;

  const firstName = targetProfileName ? targetProfileName.split(' ')[0] : 'them';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg p-0 bg-background border-none rounded-t-[2rem]">
        <div className="relative px-6 pb-8 pt-4">
          
          {/* Dragger Bar */}
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-6" />

          {/* Close Button */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center mt-2 text-center">
            
            {/* Pill */}
            <div className="bg-muted/60 text-muted-foreground text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-6">
              Last Step
            </div>

            {/* Heading */}
            <h2 className="text-[22px] sm:text-2xl font-bold leading-[1.35] max-w-[300px]">
              <Link href={signupUrlStr} className="text-brand-500 hover:underline">Get your own</Link>{' '}
              digital business card and always stay connected with {firstName}
            </h2>

            {/* Visuals */}
            <div className="flex flex-row items-center justify-center gap-6 py-10 w-full">
              {/* Left (Guest / Generic Anoya User) */}
              <div className="w-[88px] h-[88px] rounded-full bg-muted/30 border border-border/50 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                <span className="absolute top-3 text-[10px] font-bold text-muted-foreground/30 tracking-widest z-10">ANOYA</span>
                <User className="w-12 h-12 text-muted-foreground/20 mt-3" strokeWidth={1.5} />
              </div>

              {/* Middle (Handshake) */}
              <Handshake className="w-9 h-9 text-muted-foreground/40" strokeWidth={1.5} />

              {/* Right (Target Profile) */}
              <div className="w-[88px] h-[88px] rounded-full bg-muted flex items-center justify-center overflow-hidden shadow-md ring-1 ring-border/30">
                {targetProfilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={targetProfilePhotoUrl} alt={targetProfileName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">{targetProfileInitials || firstName[0]}</span>
                )}
              </div>
            </div>
            
          </div>

          <div className="mt-2 flex flex-col gap-4">
            <Link href={signupUrlStr} className="w-full" passHref>
              <Button size="lg" className="relative w-full h-14 rounded-full overflow-hidden border-0 bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg transition-all active:scale-[0.98] group">
                {/* Shine/Gradient overlay similar to reference */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                <div className="absolute inset-0 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                <span className="relative z-10 text-[17px] font-semibold flex items-center gap-2">
                  Get Anoya for Free <span className="text-xl leading-none">&rarr;</span>
                </span>
              </Button>
            </Link>
          </div>

          {removalUrl && (
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Need to remove the details you just shared?{' '}
                <a 
                  href={removalUrl}
                  className="underline hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  Click here
                </a>
              </p>
            </div>
          )}

        </div>
      </DrawerContent>
    </Drawer>
  );
}
