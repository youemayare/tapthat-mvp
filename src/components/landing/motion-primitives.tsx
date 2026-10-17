"use client";

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}) {
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

export function CtaButton({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
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

export function AnimatedHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.header>
  );
}

export function FloatingArrow({
  axis,
  children,
}: {
  axis: 'x' | 'y';
  children: ReactNode;
}) {
  return (
    <motion.div
      animate={axis === 'x' ? { x: [0, 10, 0] } : { y: [0, 10, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export function HoverScaleBadge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} className={className}>
      {children}
    </motion.div>
  );
}
