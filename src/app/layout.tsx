import type { Metadata } from 'next';
import { Inter, Geist, Playfair_Display, Orbitron, Courier_Prime, Archivo_Black, Allura } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const courier = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-courier',
  display: 'swap',
});

const archivo = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

const allura = Allura({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-allura',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Anoya — Professional Identity, One Tap Away',
    template: '%s | Anoya',
  },
  description:
    'Premium NFC business cards with editable profiles, instant vCard download, and built-in analytics. One tap to share your professional identity.',
  keywords: ['NFC business card', 'digital business card', 'professional profile', 'networking', 'UAE', 'GCC'],
  authors: [{ name: 'Anoya' }],
  creator: 'Anoya',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://tapthat.vercel.app',
    siteName: 'Anoya',
    title: 'Anoya — Professional Identity, One Tap Away',
    description:
      'Premium NFC business cards. One tap to share your professional identity — no app required.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anoya — Professional Identity, One Tap Away',
    description: 'Premium NFC business cards with editable profiles and analytics.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { ThemeProvider } from '@/components/theme-provider';
import { MotionConfig } from 'framer-motion';

import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable, playfair.variable, orbitron.variable, courier.variable, archivo.variable, allura.variable)}>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <MotionConfig reducedMotion="user">
            {children}
            <Toaster />
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
