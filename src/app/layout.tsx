import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TapThat — Professional Identity, One Tap Away',
    template: '%s | TapThat',
  },
  description:
    'Premium NFC business cards with editable profiles, instant vCard download, and built-in analytics. One tap to share your professional identity.',
  keywords: ['NFC business card', 'digital business card', 'professional profile', 'networking', 'UAE', 'GCC'],
  authors: [{ name: 'TapThat' }],
  creator: 'TapThat',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://tapthat.vercel.app',
    siteName: 'TapThat',
    title: 'TapThat — Professional Identity, One Tap Away',
    description:
      'Premium NFC business cards. One tap to share your professional identity — no app required.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TapThat — Professional Identity, One Tap Away',
    description: 'Premium NFC business cards with editable profiles and analytics.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { ThemeProvider } from '@/components/theme-provider';

import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
