'use client';

import { useState } from 'react';

import { claimCardAction } from './actions';
import { Loader2, Zap, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  uid: string;
}

export function ClaimForm({ uid }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    | null
    | { success: true }
    | { success: false; message: string; errorType: string }
  >(null);

  async function handleClaim() {
    setLoading(true);
    setResult(null);

    const res = await claimCardAction(uid);
    setResult(res);
    setLoading(false);
  }

  const springTransition = { type: "spring" as const, bounce: 0.2, duration: 0.5 };

  return (
    <AnimatePresence mode="wait">
      {result?.success ? (
        <motion.div 
          key="success"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          transition={springTransition}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Card Successfully Activated!
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-10">
            Your physical card is now permanently linked to your profile.
          </p>
          <Link
            href="/dashboard/profile"
            className="inline-flex w-full items-center justify-center py-4 px-6 bg-brand-600 hover:bg-brand-500 text-foreground font-semibold rounded-2xl transition-all"
          >
            Set up my profile
          </Link>
        </motion.div>
      ) : result?.success === false ? (
        <motion.div 
          key="error"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          transition={springTransition}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Activation Failed
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-10">
            {result.message}
          </p>
          {result.errorType === 'already_claimed_by_you' ? (
            <Link
              href="/dashboard/cards"
              className="inline-flex w-full items-center justify-center py-4 px-6 bg-card hover:bg-accent border border-border text-foreground font-semibold rounded-2xl transition-all"
            >
              Manage my cards
            </Link>
          ) : (
            <button
              onClick={() => setResult(null)}
              className="w-full py-4 px-6 bg-card hover:bg-accent border border-border text-foreground font-semibold rounded-2xl transition-all"
            >
              Try Again
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div 
          key="ready"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -10 }}
          transition={springTransition}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-8">
            <Zap className="w-10 h-10 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Ready to activate?
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-2">
            You are about to link this physical card to your account.
          </p>
          <p className="text-muted-foreground text-sm mb-10 font-mono bg-card text-card-foreground border border-border rounded-lg px-4 py-2 inline-block">
            Card ID: {uid}
          </p>

          <button
            onClick={handleClaim}
            disabled={loading}
            className="group w-full flex items-center justify-center gap-2 py-4 px-6 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-foreground font-semibold rounded-2xl transition-transform active:scale-[0.97]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Activate Card'
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
