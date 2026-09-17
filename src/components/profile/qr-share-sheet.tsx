'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Share, Copy, Download, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { generateSlimVCard } from '@/lib/utils/vcard';

interface QRShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  handle?: string | null;
}

export function QRShareSheet({ open, onOpenChange, profile, handle }: QRShareSheetProps) {
  const [mode, setMode] = useState<'online' | 'offline'>('online');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const profileUrl = handle 
    ? `${window.location.origin}/${handle}`
    : `${window.location.origin}/p/${profile?.slug || profile?.id}`;

  const displayName = profile?.label || [profile?.firstName || profile?.first_name, profile?.lastName || profile?.last_name].filter(Boolean).join(' ') || 'Profile';

  useEffect(() => {
    if (!open || !canvasRef.current || !profile) return;

    let payload = profileUrl;
    if (mode === 'offline') {
      payload = generateSlimVCard(profile, profileUrl);
    }

    QRCode.toCanvas(canvasRef.current, payload, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: mode === 'online' ? 'H' : 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }).catch(err => {
      console.error('QR Generate Error:', err);
      toast.error('Failed to generate QR code');
    });
  }, [open, mode, profile, profileUrl]);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Connect with ${displayName}`,
          text: `Check out my Anoya profile!`,
          url: profileUrl,
        });
      } catch (err) {
        // user aborted or failed
      }
    } else {
      handleCopy();
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(profileUrl);
    toast.success('Link copied to clipboard!');
  }

  function handleDownload() {
    if (!canvasRef.current) return;
    
    // We need to construct a new canvas to embed the logo for the downloaded image in online mode
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = 1024;
    downloadCanvas.height = 1024;
    const ctx = downloadCanvas.getContext('2d');
    
    if (ctx) {
      // 1. Draw the QR code (scaled up)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(canvasRef.current, 0, 0, 1024, 1024);
      
      // 2. Draw the logo if online
      if (mode === 'online') {
        const logoWidth = 240;
        const logoHeight = 80;
        const cx = (1024 - logoWidth) / 2;
        const cy = (1024 - logoHeight) / 2;
        
        // Draw center plate background
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(cx - 10, cy - 10, logoWidth + 20, logoHeight + 20, 20);
        ctx.fill();
        
        // Draw Text "Anoya"
        ctx.font = 'bold 64px sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText('Ano', cx + 15, cy + 58);
        ctx.fillStyle = '#60A5FA'; // brand-400
        const anoWidth = ctx.measureText('Ano').width;
        ctx.fillText('ya', cx + 15 + anoWidth, cy + 58);
      }
      
      const link = document.createElement('a');
      link.download = `anoya-qr-${mode}.png`;
      link.href = downloadCanvas.toDataURL('image/png');
      link.click();
      toast.success('QR Code saved!');
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background border-border max-w-lg mx-auto">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-foreground">Share {displayName}</DrawerTitle>
          <DrawerDescription>
            {mode === 'online' 
              ? 'Always up to date. Includes your full profile and links.' 
              : 'Lets someone save your basic details without internet.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col items-center px-4 pb-8 space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'online'|'offline')} className="w-full max-w-xs">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="online">Online</TabsTrigger>
              <TabsTrigger value="offline">Offline</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative bg-white p-4 rounded-3xl shadow-sm border border-black/5 ring-1 ring-black/5">
            <canvas ref={canvasRef} className="w-[280px] h-[280px] rounded-xl" />
            
            {/* Center Logo UI overlay (only for online) */}
            {mode === 'online' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-black/5 flex items-center justify-center">
                <span className="text-xl font-bold text-black leading-none tracking-tight">
                  Ano<span className="text-brand-400">ya</span>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 w-full max-w-xs gap-3">
            {mode === 'online' ? (
              <>
                <Button variant="outline" className="flex-col h-auto py-3 gap-2 border-border bg-card hover:bg-accent" onClick={handleShare}>
                  <Share className="w-5 h-5" />
                  <span className="text-xs">Share</span>
                </Button>
                <Button variant="outline" className="flex-col h-auto py-3 gap-2 border-border bg-card hover:bg-accent" onClick={handleCopy}>
                  <Copy className="w-5 h-5" />
                  <span className="text-xs">Copy</span>
                </Button>
              </>
            ) : (
              <div className="col-span-2 flex items-center justify-center border-border bg-muted/50 rounded-xl px-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <WifiOff className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Static Data</span>
                </div>
              </div>
            )}
            <Button variant="outline" className="flex-col h-auto py-3 gap-2 border-border bg-card hover:bg-accent" onClick={handleDownload}>
              <Download className="w-5 h-5" />
              <span className="text-xs">Save QR</span>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
