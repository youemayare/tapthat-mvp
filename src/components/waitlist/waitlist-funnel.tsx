'use client';

import { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type FunnelState = 'color_selection' | 'email_form' | 'submitting_join' | 'success_intro' | 'completed';

const CARDS = [
  { id: 'Matte Black', src: '/cards/black.png', hex: '#1c1c1c' },
  { id: 'Silver', src: '/cards/silver.jpg', hex: '#d1d5db' },
  { id: 'Gold', src: '/cards/gold.png', hex: '#d4af37' },
  { id: 'Rose Gold', src: '/cards/rose.jpg', hex: '#b76e79' },
  { id: 'Navy Blue', src: '/cards/navy.png', hex: '#1d2951' },
  { id: 'Cherry Red', src: '/cards/cherry.png', hex: '#990000' }
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export function WaitlistFunnel() {
  const [state, setState] = useState<FunnelState>('color_selection');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const turnstileRef = useRef<any>(null);

  const [[page, direction], setPage] = useState([0, 0]);
  const imageIndex = ((page % CARDS.length) + CARDS.length) % CARDS.length;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const selectColor = (index: number) => {
    setPage([index, index > imageIndex ? 1 : -1]);
  };

  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    profession: '',
    whatsappNumber: '',
    turnstileToken: '',
  });

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.turnstileToken) {
      toast.error('Please complete the captcha');
      return;
    }

    setState('submitting_join');
    
    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          preferredCardColor: CARDS[imageIndex].id,
          referredByCode: searchParams.get('ref') || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join');

      if (data.alreadyExists) {
        toast.success('You are already in the Tayz Founding Circle!');
      }

      setReferralCode(data.referralCode || data.waitlistId);
      setState('success_intro');
    } catch (err: any) {
      toast.error(err.message);
      setState('email_form');
      turnstileRef.current?.reset();
    }
  };

  if (state === 'color_selection') {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Design your Tayz card.</h2>
        <p className="text-zinc-400 mb-6 text-sm text-center">
          Choose your preferred metal finish.
        </p>

        <div className="relative w-[calc(100%+3rem)] -mx-6 sm:w-[calc(100%+4rem)] sm:-mx-8 aspect-[1.58] mb-10 select-none">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing w-full h-full rounded-[20px] overflow-hidden drop-shadow-2xl border border-white/10"
            >
              <Image 
                src={CARDS[imageIndex].src}
                alt={CARDS[imageIndex].id}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
                priority
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-3 mb-4">
          {CARDS.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => selectColor(idx)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${idx === imageIndex ? 'border-brand-500 scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: card.hex }}
              aria-label={`Select ${card.id}`}
            />
          ))}
        </div>
        
        <p className="text-white font-medium mb-8 text-center">{CARDS[imageIndex].id}</p>

        <Button 
          onClick={() => setState('email_form')} 
          className="w-full bg-brand-600 hover:bg-brand-500 text-white py-6 text-lg"
        >
          Reserve this color
        </Button>
      </div>
    );
  }

  if (state === 'email_form' || state === 'submitting_join') {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Almost there.</h2>
        <p className="text-zinc-400 mb-8 text-sm">
          Lock in your {CARDS[imageIndex].id} card at the AED 299 founding price.
        </p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-zinc-300">First name</Label>
            <Input
              id="firstName"
              required
              className="bg-zinc-900 border-white/10 text-white"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              className="bg-zinc-900 border-white/10 text-white"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profession" className="text-zinc-300">Profession / Role</Label>
            <select
              id="profession"
              required
              className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
            >
              <option value="" disabled>Select your profession</option>
              <option value="Founder / Business owner">Founder / Business owner</option>
              <option value="Sales / Business development">Sales / Business development</option>
              <option value="Real estate">Real estate</option>
              <option value="Consultant / Freelancer">Consultant / Freelancer</option>
              <option value="Corporate professional">Corporate professional</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="pt-4 flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={(token) => setFormData({ ...formData, turnstileToken: token })}
              options={{ theme: 'dark' }}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-6 text-lg mt-4"
            disabled={state === 'submitting_join'}
          >
            {state === 'submitting_join' ? 'Reserving...' : 'Unlock AED 299 Access'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setState('color_selection')}
            className="w-full text-zinc-400 hover:text-white mt-2"
          >
            Back to colors
          </Button>
        </form>
      </div>
    );
  }

  if (state === 'success_intro' || state === 'completed') {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-zinc-950 border border-brand-500/30 shadow-2xl shadow-brand-500/10 text-center">
        <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">You’re in the Tayz Founding Circle.</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Your AED 299 founding access for the {CARDS[imageIndex].id} card is reserved. Keep an eye on your inbox.
        </p>

        {referralCode && (
          <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 mb-6">
            <p className="text-xs text-zinc-500 mb-2 font-semibold uppercase tracking-wider">Your Invite Link</p>
            <code className="text-brand-400 text-sm">tapthat.vercel.app/founding-circle?ref={referralCode}</code>
          </div>
        )}

        <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
          Return to Home
        </Button>
      </div>
    );
  }

  return null;
}
