"use client";

import Image from 'next/image';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { useState, useEffect } from 'react';
import { WAITLIST_URL } from '@/lib/constants';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

function FadeIn({ children, delay = 0, direction = 'up', className = '' }: { children: React.ReactNode, delay?: number, direction?: 'up' | 'down' | 'left' | 'right' | 'none', className?: string }) {
  const yOffset = direction === 'up' ? 40 : direction === 'down' ? -40 : 0;
  const xOffset = direction === 'left' ? 40 : direction === 'right' ? -40 : 0;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function CtaButton({ children, href, className = "" }: { children: React.ReactNode, href: string, className?: string }) {
  return (
    <motion.a
      href={href}
      className={`relative inline-flex items-center justify-center overflow-hidden font-semibold text-white bg-[#0071e3] transition-colors hover:bg-[#005bb8] shadow-[0_0_40px_rgba(0,113,227,0.2)] hover:shadow-[0_0_60px_rgba(0,113,227,0.4)] ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]"
        initial={{ x: "-200%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </motion.a>
  );
}

  function Header() {
    return (
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full border-b border-border-subtle bg-nav-bg backdrop-blur-md sticky top-0 z-50"
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight text-foreground">TAYZ</div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-semibold hover:opacity-80 transition-opacity">Sign in</Link>
            <CtaButton
              href={WAITLIST_URL}
              className="text-sm px-4 py-2 rounded-full"
            >
              Get Your Card
            </CtaButton>
          </div>
        </div>
      </motion.header>
    );
  }

  function HeroVisual() {
  const cardControls = useAnimation();
  const screenControls = useAnimation();
  const [isTapped, setIsTapped] = useState(false);

  const handleHover = async () => {
    if (isTapped) return;
    setIsTapped(true);
    // 1. Card moves in to tap the screen
    await cardControls.start({
      y: "-50%",
      x: "-50%",
      z: 0,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    });
    // 2. Screen lights up
    screenControls.start({ opacity: 1, transition: { duration: 0.3 } });
    // 3. Card slides away (down) to reveal the profile
    await cardControls.start({
      y: "100%",
      opacity: 0,
      transition: { duration: 0.6, delay: 0.2, ease: "easeInOut" }
    });
  };

  const handleMouseLeave = async () => {
    setIsTapped(false);
    screenControls.start({ opacity: 0, transition: { duration: 0.3 } });
    cardControls.start({
      y: "-80%",
      x: "-35%",
      z: 50,
      rotateX: 25,
      rotateY: -15,
      rotateZ: -10,
      scale: 1.1,
      opacity: 1,
      transition: { duration: 0.5, ease: "backOut" }
    });
  };

  return (
    <div
      className="relative w-full max-w-[260px] mx-auto sm:max-w-[280px] lg:max-w-[300px] aspect-[9/19.5] [perspective:1200px] cursor-pointer group"
      onMouseEnter={handleHover}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleHover}
    >
      {/* Phone Frame */}
      <div className="absolute inset-0 rounded-[3rem] border-[8px] border-[#262626] bg-black overflow-hidden shadow-[0_0_80px_rgba(0,113,227,0.15)] z-10 transition-transform duration-500 group-hover:scale-[1.02]">
        <motion.div
          className="relative w-full h-full"
          initial={{ opacity: 0 }}
          animate={screenControls}
        >
          <Image src="/storyboard/layout-canvas.png" alt="Tayz Live Profile" fill className="object-cover object-top" />
        </motion.div>

        {/* Helper text before hover */}
        {!isTapped && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isTapped ? 0 : 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span className="text-zinc-600 text-sm font-medium tracking-widest uppercase animate-pulse">Hover to Tap</span>
          </motion.div>
        )}
      </div>

      {/* Matte Black Metal Card */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[80%] aspect-[1.586] bg-gradient-to-br from-[#2a2a2a] via-[#111] to-[#000] rounded-xl border border-border-medium shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col justify-center items-center z-20 pointer-events-none"
        style={{ transformStyle: "preserve-3d" }}
        initial={{
          y: "-80%",
          x: "-35%",
          z: 50,
          rotateX: 25,
          rotateY: -15,
          rotateZ: -10,
          scale: 1.1,
          opacity: 1
        }}
        animate={cardControls}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-30 rounded-xl" />
        <div className="text-white font-bold tracking-[0.2em] text-2xl uppercase mb-2">Tayz</div>
        <div className="w-8 h-[2px] bg-[#0071e3] mb-4"></div>
        <div className="text-white/60 font-sans tracking-widest text-xs uppercase">Your Name</div>
      </motion.div>
    </div>
  );
}

function StoryboardHero() {
  return (
    <section className="py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl">
            <FadeIn>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
                One tap.<br />They know you.
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-xl text-muted mb-10 leading-relaxed">
                A premium metal card that opens your live professional profile with a tap or scan. Share who you are, stay up to date, and make every introduction count.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="inline-flex flex-col sm:flex-row gap-4 items-center">
                <CtaButton
                  href={WAITLIST_URL}
                  className="text-base px-8 py-4 rounded-full"
                >
                  Get Founding Circle access
                </CtaButton>
                <p className="text-sm text-secondary font-medium">Exclusive early-bird pricing</p>
              </div>
            </FadeIn>
          </div>
          <FadeIn direction="left" delay={0.3}>
            <HeroVisual />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function StoryboardCards() {
  const [emblaRef] = useEmblaCarousel({ loop: true, dragFree: true }, [WheelGesturesPlugin()]);

  const cards = [
    { id: 'black', name: 'Matte Black', src: '/designs/black.png' },
    { id: 'silver', name: 'Matte Silver', src: '/designs/silver.jpg' },
    { id: 'gold', name: 'Matte Gold', src: '/designs/gold.png' },
    { id: 'rose-gold', name: 'Matte Rose Gold', src: '/designs/rosegold.jpg' },
    { id: 'navy', name: 'Matte Navy', src: '/designs/navy.png' },
    { id: 'cherry', name: 'Matte Cherry', src: '/designs/cherry.png' },
  ];

  return (
    <section className="py-24 bg-background overflow-hidden relative">
      <div className="container mx-auto px-6 max-w-6xl mb-12 text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Timeless metal.
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Choose from our collection of premium finishes. We recommend keeping it simple with just your name - so your card stays relevant even if your company or role changes. 
          </p>
          <p className="text-sm mt-4 text-secondary">
            Looking for custom company logos, colors or designs? Contact our team for custom orders.
          </p>
        </FadeIn>
      </div>

      <div className="overflow-hidden pb-12 cursor-grab active:cursor-grabbing" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {cards.map((card) => (
            <div 
              key={card.id}
              className="flex-[0_0_85vw] sm:flex-[0_0_500px] md:flex-[0_0_600px] min-w-0 flex flex-col items-center gap-6 px-4 md:px-8 group/card"
            >
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-border-medium group-hover/card:shadow-[0_0_60px_rgba(255,255,255,0.1)] group-hover/card:border-border-strong transition-all duration-500 select-none">
                <Image src={card.src} alt={card.name} fill className="object-cover group-hover/card:scale-105 transition-transform duration-1000 pointer-events-none" draggable={false} />
              </div>
              <div className="text-lg font-medium text-muted group-hover/card:text-foreground transition-colors duration-300">
                {card.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryboardStyles() {
  return (
    <section className="py-24 bg-section-alt border-y border-border-subtle">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              A profile that feels like you.
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Choose from structurally distinct layouts and unlock deep customizability. Mix fonts, structures & styles to find one that matches your vibe.
            </p>
          </FadeIn>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {['canvas', 'classic', 'identity', 'professional'].map((theme, i) => (
            <FadeIn key={theme} delay={i * 0.1} direction="up" className="relative aspect-[9/19.5] rounded-2xl overflow-hidden border border-border-medium shadow-2xl group hover:border-white/30 transition-colors duration-300">
              <Image src={`/storyboard/layout-${theme}.png`} alt={`Tayz ${theme} layout`} fill className="object-cover object-top transition-transform duration-700 group-hover:scale-105" />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryboardEditor() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <FadeIn direction="right" className="order-2 md:order-1 relative aspect-[9/19.5] max-w-[280px] mx-auto w-full rounded-2xl overflow-hidden border border-border-medium shadow-[0_0_50px_rgba(255,255,255,0.02)] hover:shadow-[0_0_80px_rgba(255,255,255,0.05)] transition-shadow duration-500">
            <Image src="/storyboard/editor.png" alt="Tayz Profile Editor" fill className="object-cover object-top" />
          </FadeIn>
          <div className="order-1 md:order-2">
            <FadeIn direction="left">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                Make every detail yours.
              </h2>
            </FadeIn>
            <FadeIn direction="left" delay={0.1}>
              <p className="text-xl text-muted leading-relaxed">
                Refine your digital presence in seconds. Change your bio, update your contact details, and swap layouts effortlessly. Every change you make in the editor reflects instantly on your live profile.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryboardUpdate() {
  return (
    <section className="py-24 bg-section-alt border-y border-border-subtle overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Always current.
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-xl text-muted max-w-2xl mx-auto mb-16">
            Got promoted? Change your title in the dashboard. The next person who taps your card sees the update instantly.
          </p>
        </FadeIn>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12">
          <FadeIn direction="right" delay={0.2} className="relative w-full max-w-[240px] lg:max-w-[260px] aspect-[9/19.5] rounded-2xl border border-border-medium overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-muted z-10 border border-border-medium">Before</div>
            <Image src="/storyboard/hero.png" alt="Before update" fill className="object-cover object-top grayscale-[30%] opacity-80" />
          </FadeIn>

          <FadeIn delay={0.4} className="text-zinc-600 hidden md:block">
            <motion.div animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
              <svg className="w-8 h-8 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.4} className="text-zinc-600 block md:hidden my-4">
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
              <svg className="w-8 h-8 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </FadeIn>

          <FadeIn direction="left" delay={0.6} className="relative w-full max-w-[240px] lg:max-w-[260px] aspect-[9/19.5] rounded-2xl border border-[#0071e3]/40 overflow-hidden shadow-[0_0_80px_rgba(0,113,227,0.2)]">
            <div className="absolute top-4 left-4 bg-[#0071e3] px-3 py-1 rounded-full text-xs font-semibold text-white z-10">After</div>
            <Image src="/storyboard/after-update.png" alt="After update" fill className="object-cover object-top" />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function StoryboardCompatibility() {
  return (
    <section className="py-24 bg-section-alt border-y border-border-subtle relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,113,227,0.05)_0%,transparent_50%)]" />
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 items-center">
          
          <FadeIn direction="right" className="relative w-full max-w-sm mx-auto lg:max-w-none aspect-[3/4] rounded-3xl overflow-hidden border border-border-medium shadow-xl">
            <Image src="/iphone-tap.jpg" alt="Tapping iPhone" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
            <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center">
              <svg className="w-10 h-10 text-foreground" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
            </div>
          </FadeIn>

          <div className="text-center order-first lg:order-none mb-8 lg:mb-0">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
                Universal<br />compatibility.
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-xl text-muted max-w-sm mx-auto">
                Tayz works instantly out of the box. Just tap an iPhone or Android to share your profile. No app installation needed.
              </p>
            </FadeIn>
          </div>

          <FadeIn direction="left" className="relative w-full max-w-sm mx-auto lg:max-w-none aspect-[3/4] rounded-3xl overflow-hidden border border-border-medium shadow-xl">
            <Image src="/android-tap.jpg" alt="Tapping Android" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
            <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center">
              <svg className="w-11 h-11 text-foreground" viewBox="0 0 512 512" fill="currentColor"><path d="M325.3 234.3c-25.7 0-46.5-20.8-46.5-46.5s20.8-46.5 46.5-46.5 46.5 20.8 46.5 46.5-20.8 46.5-46.5 46.5zm-138.6 0c-25.7 0-46.5-20.8-46.5-46.5s20.8-46.5 46.5-46.5 46.5 20.8 46.5 46.5-20.8 46.5-46.5 46.5zm205.6-111.4l35.8-61.9c3.4-5.9 1-13.4-4.8-16.8-5.9-3.4-13.4-1-16.8 4.8l-36.9 63.8c-34.1-15.6-72.2-24.4-112.5-24.4s-78.4 8.8-112.5 24.4l-36.9-63.8c-3.4-5.9-10.9-8.2-16.8-4.8-5.9 3.4-8.2 10.9-4.8 16.8l35.8 61.9c-85 41-144.1 123.6-150.1 219.7H493c-6-96.1-65.1-178.7-150.1-219.7z"/></svg>
            </div>
          </FadeIn>

        </div>
      </div>
    </section>
  );
}

function StoryboardShare() {
  const methods = [
    { title: "NFC Tap", desc: "A simple tap on any modern smartphone instantly opens your profile." },
    { title: "QR Code", desc: "Share your profile with a QR code. You can also add it to your apple/google wallet." },
    { title: "Profile Link", desc: "Share your custom URL directly in your email signature or social bio." }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Share it your way.
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-xl text-muted mb-12">
            Whether you are in a boardroom, at a conference, or networking online, Tayz adapts to how you introduce yourself.
          </p>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-8">
          {methods.map((method, i) => (
            <FadeIn key={method.title} delay={0.2 + (i * 0.1)} direction="up" className="p-8 rounded-3xl bg-section-alt border border-border-subtle hover:border-border-strong transition-colors duration-300 group">
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-[#0071e3] transition-colors">{method.title}</h3>
              <p className="text-muted">{method.desc}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryboardConnections() {
  return (
    <section className="py-24 bg-section-alt border-y border-border-subtle">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <FadeIn direction="right">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                Remember the people you meet.
              </h2>
            </FadeIn>
            <FadeIn direction="right" delay={0.1}>
              <p className="text-xl text-muted leading-relaxed mb-6">
                When you exchange details, their information is saved directly to your Connections dashboard. Never lose track of a meaningful encounter again. You can add notes, collect leads & more.
              </p>
            </FadeIn>
          </div>
          <FadeIn direction="left" delay={0.2} className="relative aspect-[9/19.5] max-w-[280px] mx-auto w-full rounded-2xl overflow-hidden border border-border-medium shadow-[0_0_50px_rgba(255,255,255,0.02)] hover:shadow-[0_0_80px_rgba(255,255,255,0.05)] transition-shadow duration-500">
            <Image src="/storyboard/connections.png" alt="Tayz Connections" fill className="object-cover object-top" />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function StoryboardAnalytics() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <FadeIn direction="right" className="order-2 md:order-1 relative aspect-[9/19.5] max-w-[280px] mx-auto w-full rounded-2xl overflow-hidden border border-border-medium shadow-[0_0_50px_rgba(255,255,255,0.02)] hover:shadow-[0_0_80px_rgba(255,255,255,0.05)] transition-shadow duration-500">
            <Image src="/storyboard/analytics.png" alt="Tayz Analytics" fill className="object-cover object-top" />
          </FadeIn>
          <div className="order-1 md:order-2">
            <FadeIn direction="left">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                Know what's working.
              </h2>
            </FadeIn>
            <FadeIn direction="left" delay={0.1}>
              <p className="text-xl text-muted leading-relaxed">
                See profile visits and link activity in your dashboard. Understand unique views and where your connections are happening in real-time. Make every interaction measurable.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingOffer() {
  return (
    <section id="founding-offer" className="py-24 bg-section-alt border-t border-border-subtle relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0071e3]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-12">
            Be among the first to carry Tayz.
          </h2>
        </FadeIn>

        <FadeIn delay={0.2} direction="up" className="bg-background border border-border-medium rounded-3xl p-8 md:p-12 max-w-2xl mx-auto shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex flex-col items-center mb-8 pb-8 border-b border-border-subtle">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Founding Circle Membership</h3>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#60a5fa] font-medium text-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approximately 40% off the planned regular price
              </motion.div>
            </div>

            <p className="text-muted leading-relaxed mb-8">
              Join the Founding Circle for early access to the Tayz Metal Card at an exclusive discounted price. We'll notify you when Tayz is ready to launch. Joining is free, and you can decide whether to order then.
            </p>

            <CtaButton
              href={WAITLIST_URL}
              className="text-base px-8 py-4 w-full rounded-xl"
            >
              Get Founding Circle access
            </CtaButton>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-32 bg-gradient-to-b from-section-alt to-background">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        <FadeIn>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-8">
            Make your next introduction count.
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="text-lg md:text-xl text-muted mb-12 max-w-2xl mx-auto">
            Join the Tayz Founding Circle for access to the Metal Card at an exclusive early-bird discount of approximately 40% off the planned regular price.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="flex flex-col items-center gap-6">
            <CtaButton
              href={WAITLIST_URL}
              className="text-lg px-10 py-5 rounded-full"
            >
              Join the Founding Circle
            </CtaButton>
            <p className="text-sm text-secondary max-w-sm mx-auto">
              Free to join. We'll notify you when Tayz launches. No payment today and no obligation to buy.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-background rounded-2xl border border-border-medium hover:border-border-strong transition-colors overflow-hidden">
      <button 
        className="w-full text-left p-6 flex items-center justify-between focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className="text-xl font-medium text-foreground pr-8">{question}</h3>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }} 
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-shrink-0 text-muted"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 pt-0">
              <p className="text-muted leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StoryboardFaq() {
    const faqs = [
    {
      question: "Do the people I meet need an app?",
      answer: "No app is required. When they tap your card or scan your QR code, your profile instantly opens in their phone's default web browser."
    },
    {
      question: "Can I update my details after ordering?",
      answer: "Yes, always. Your Tayz card links to a dynamic digital profile. You can update your job title, links, and contact info instantly through your dashboard without having to buy a new card."
    },
    {
      question: "Are there any subscription fees?",
      answer: "Purchasing your Tayz metal card gives you lifetime access to your basic digital profile. Plus, every metal card comes with a full year of Tayz Pro for free! After the first year, there is a small monthly fee to keep the Pro features, but your core profile remains completely free for life."
    },
    {
      question: "Can I share my profile without my physical card?",
      answer: "Yes. You can add your Tayz QR code directly to your Apple Wallet or Google Wallet, or simply save it to your phone's photo gallery for quick access anytime."
    },
    {
      question: "What if there is no internet connection?",
      answer: "If you or the other person are completely offline, you can present your Offline QR code. When scanned, it instantly saves your contact card to their phone - no internet required!"
    },
    {
      question: "Can I get a custom logo on my card?",
      answer: "Absolutely. While we recommend sticking to just your name for longevity, we do accept bespoke orders for company logos and custom designs. Just contact our team."
    }
  ];

  return (
    <section className="py-24 bg-section-alt border-t border-border-subtle relative z-10">
      <div className="container mx-auto px-6 max-w-3xl">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Frequently asked questions
          </h2>
        </FadeIn>
        
        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <FadeIn key={idx} delay={idx * 0.1} direction="up">
              <FaqItem question={faq.question} answer={faq.answer} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 border-t border-border-subtle bg-background">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-xl font-bold tracking-tight text-foreground">TAYZ</div>
        <div className="flex gap-6 text-sm text-secondary">
          {/* Privacy Policy and Terms will go here when ready */}
        </div>
        <div className="text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} Tayz. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-background selection:bg-[#0071e3]/30">
      <Header />
      <StoryboardHero />
      <StoryboardCards />
      <StoryboardStyles />
      <StoryboardEditor />
      <StoryboardUpdate />
      <StoryboardCompatibility />
      <StoryboardShare />
      <StoryboardConnections />
      <StoryboardAnalytics />
      <PricingOffer />
      <StoryboardFaq />
      <FinalCTA />
      <Footer />
    </main>
  );
}
