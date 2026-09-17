'use client';

import { useState } from 'react';
import { Share, QrCode } from 'lucide-react';
import { QRShareSheet } from '@/components/profile/qr-share-sheet';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingShareButtonProps {
  profiles: any[]; // The published profiles
  handle?: string | null;
}

export function FloatingShareButton({ profiles, handle }: FloatingShareButtonProps) {
  const [open, setOpen] = useState(false);

  // Do not render the button if there are no published profiles
  if (!profiles || profiles.length === 0) {
    return null;
  }

  // Determine active profile (use default if available, otherwise first)
  const activeProfile = profiles.find((p) => p.is_default) || profiles[0];

  return (
    <>
      {/* 
        Positioning: 
        bottom-32 ensures it sits securely above the standard mobile BottomNav (which is usually h-16 or bottom-0 fixed).
        On desktop, the BottomNav is hidden, so bottom-12 is fine.
      */}
      <div className="fixed bottom-32 lg:bottom-12 left-1/2 -translate-x-1/2 z-40">
        <AnimatePresence>
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            aria-label="Share your profile"
            className="flex items-center gap-2.5 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] ring-1 ring-white/20 transition-colors backdrop-blur-md"
          >
            <QrCode className="w-5 h-5" />
            <span>Share</span>
          </motion.button>
        </AnimatePresence>
      </div>

      <QRShareSheet 
        open={open} 
        onOpenChange={setOpen} 
        profile={activeProfile} 
        handle={handle} 
      />
    </>
  );
}
