import { WaitlistFunnel } from '@/components/waitlist/waitlist-funnel';
import { Suspense } from 'react';
import { Shield, Zap, Smartphone } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Tayz Founding Circle',
  description: 'Join the Tayz Founding Circle and get your premium Metal Card for AED 299.',
};

export default function FoundingCirclePage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-brand-500/30">
      {/* Premium Minimal Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <Link href="/" className="font-bold text-xl tracking-tight text-white hover:opacity-80 transition-opacity">
          Tay<span className="text-brand-400">z</span>
        </Link>
      </header>

      {/* Split Layout: Content (Left) + Funnel (Right) */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Content Area */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-20 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 max-w-xl">
            <div className="inline-block px-3 py-1 mb-8 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold tracking-widest text-brand-300 uppercase">
              Tayz Founding Circle
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8">
              Your identity.<br />
              <span className="text-zinc-500">One tap away.</span>
            </h1>

            <p className="text-xl text-zinc-400 leading-relaxed mb-12 max-w-lg">
              A premium metal NFC card that shares your live professional profile in seconds. Make a lasting first impression—without carrying paper cards.
            </p>

            <div className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-md">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Founding Circle Price</p>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-white">AED 299</p>
                  <p className="text-lg text-zinc-500 line-through mb-1">AED 499</p>
                </div>
                <p className="text-brand-400 font-medium mt-2 text-sm">Save 40% limited to early supporters</p>
              </div>
            </div>
            
            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <Smartphone className="w-6 h-6 text-brand-400 mb-4" />
                <h3 className="font-semibold text-white mb-2">Tap or scan</h3>
                <p className="text-sm text-zinc-400">Share instantly via NFC or QR on any modern phone.</p>
              </div>
              <div>
                <Zap className="w-6 h-6 text-brand-400 mb-4" />
                <h3 className="font-semibold text-white mb-2">Always current</h3>
                <p className="text-sm text-zinc-400">Update your details anytime. Your card stays up to date.</p>
              </div>
              <div>
                <Shield className="w-6 h-6 text-brand-400 mb-4" />
                <h3 className="font-semibold text-white mb-2">Made to last</h3>
                <p className="text-sm text-zinc-400">A premium metal card designed to leave a strong impression.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Funnel Area */}
        <div className="w-full lg:w-[600px] bg-zinc-950 flex flex-col justify-center p-8 lg:p-12 relative border-l border-white/10">
          <div className="relative z-10">
            <Suspense fallback={<div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl h-[400px] animate-pulse" />}>
              <WaitlistFunnel />
            </Suspense>
          </div>
        </div>

      </div>
    </main>
  );
}
