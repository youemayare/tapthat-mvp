'use client';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import Link from 'next/link';

interface GuestConversionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetProfileName: string;
  targetProfileHandle: string;
  erasureToken?: string;
  exchangeId?: string;
}

export function GuestConversionDrawer({
  open,
  onOpenChange,
  targetProfileName,
  targetProfileHandle,
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
        <div className="flex flex-col items-center text-center p-6 pb-2 space-y-4">
          <div className="h-12 w-12 rounded-full bg-brand-500/10 flex items-center justify-center mb-2">
            <Share2 className="h-6 w-6 text-brand-500" />
          </div>
          <DrawerHeader className="p-0">
            <DrawerTitle className="text-2xl font-bold">Stay connected with {targetProfileName}</DrawerTitle>
            <DrawerDescription className="text-base pt-2">
              Create your own Anoya card to exchange details instantly at your next introduction. Keep every connection in one place.
            </DrawerDescription>
          </DrawerHeader>
        </div>

        <div className="p-4 flex flex-col gap-3 mt-4">
          <Link href={signupUrlStr} className="w-full" passHref>
            <Button size="lg" className="w-full text-base font-semibold">
              Get Anoya for free →
            </Button>
          </Link>
          <Button variant="ghost" size="lg" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
        </div>

        {removalUrl && (
          <div className="px-6 pb-6 text-center">
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
      </DrawerContent>
    </Drawer>
  );
}
