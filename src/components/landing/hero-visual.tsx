"use client";

import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';

export function HeroVisual({ assetMode }: { assetMode: 'dummy' | 'real' }) {
  const cardControls = useAnimation();
  const screenControls = useAnimation();
  const [isTapped, setIsTapped] = useState(false);
  const isAutoPlaying = useRef(false);
  const [isTouch, setIsTouch] = useState(false);

  const playTapSequence = useCallback(async () => {
    setIsTapped(true);
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
    screenControls.start({ opacity: 1, transition: { duration: 0.3 } });
    await cardControls.start({
      y: "100%",
      opacity: 0,
      transition: { duration: 0.6, delay: 0.2, ease: "easeInOut" }
    });
  }, [cardControls, screenControls]);

  const playResetSequence = useCallback(async () => {
    setIsTapped(false);
    screenControls.start({ opacity: 0, transition: { duration: 0.3 } });
    await cardControls.start({
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
  }, [cardControls, screenControls]);

  const handleHover = async () => {
    if (isAutoPlaying.current || isTapped) return;
    await playTapSequence();
  };

  const handleMouseLeave = async () => {
    if (isAutoPlaying.current) return;
    await playResetSequence();
  };

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    setIsTouch(isTouchDevice);
    if (!isTouchDevice) return;

    isAutoPlaying.current = true;
    let mounted = true;

    const loop = async () => {
      while (mounted) {
        await new Promise(r => setTimeout(r, 500));
        if (!mounted) break;

        await playTapSequence();

        await new Promise(r => setTimeout(r, 2000));
        if (!mounted) break;

        await playResetSequence();

        await new Promise(r => setTimeout(r, 1500));
      }
    };

    loop();

    return () => {
      mounted = false;
      isAutoPlaying.current = false;
    };
  }, [playTapSequence, playResetSequence]);

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
          <Image src={`/storyboard/${assetMode}/layout-canvas.png`} alt="Tayz Live Profile" fill className="object-cover object-top" />
        </motion.div>

        {/* Helper text before hover */}
        {!isTapped && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isTapped ? 0 : 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span className="text-zinc-600 text-sm font-medium tracking-widest uppercase animate-pulse">{isTouch ? 'Tap to Connect' : 'Hover to Tap'}</span>
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
