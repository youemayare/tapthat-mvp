'use client';

import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { Download, Printer, Loader2, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function QrDisplayGenerator({ profiles, handle, initialProfileId }: { profiles: any[], handle: string | null, initialProfileId?: string }) {
  const [selectedId, setSelectedId] = useState(initialProfileId || (profiles[0]?.id || ''));
  const [layout, setLayout] = useState<'portrait' | 'a5'>('portrait');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  const profile = profiles.find((p: any) => p.id === selectedId) || profiles[0];
  const selectedLabel = profile ? (profile.label || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() + (profile.isDefault ? ' (Default)' : '')) : "Select a profile";

  useEffect(() => {
    if (!profile) return;
    const generateQr = async () => {
      try {
        const canonicalUrl = handle 
          ? `${window.location.origin}/${handle}`
          : `${window.location.origin}/p/${profile.slug || profile.id}`;
        
        const url = await QRCode.toDataURL(canonicalUrl, {
          width: 800,
          margin: 0,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('QR Gen error', err);
      }
    };
    generateQr();
  }, [profile, handle]);

  if (!profile) {
    return <div className="p-8 text-center text-muted-foreground">No profiles available.</div>;
  }

  const handleDownload = async () => {
    if (!displayRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(displayRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `tayz-qr-${profile.label || profile.firstName || 'display'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getFontClass = (fontValue: string) => {
    switch (fontValue) {
      case 'playfair': return 'font-playfair';
      case 'orbitron': return 'font-orbitron';
      case 'courier': return 'font-courier';
      case 'archivo': return 'font-archivo';
      case 'allura': return 'font-allura';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const bgColor = profile.layoutBackgroundColor || '#ffffff';
  const isDarkBg = bgColor !== '#ffffff' && bgColor !== '#f8fafc' && bgColor !== '#f1f5f9';
  const textColor = isDarkBg ? '#ffffff' : '#000000';
  const mutedColor = isDarkBg ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';

  // Use the local proxy to bypass CORS issues for canvas export and browser rendering
  const getProxiedUrl = (url?: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    return url;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full print:bg-white print:p-0">
      
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 print:hidden bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold mb-1 text-foreground">Create QR Display</h2>
          <p className="text-sm text-muted-foreground">
            Generate a displayable QR code for your physical spaces. The QR points securely to this exact profile URL.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Select Profile</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full bg-background border border-input rounded-xl h-[48px] px-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              <SelectValue placeholder="Select a profile">{selectedLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label || `${p.firstName || ''} ${p.lastName || ''}`.trim()} {p.isDefault ? '(Default)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Format Layout</label>
          <div className="flex bg-accent p-1 rounded-xl">
            <button
              onClick={() => setLayout('portrait')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", layout === 'portrait' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              Portrait
            </button>
            <button
              onClick={() => setLayout('a5')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", layout === 'a5' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              A5 Print
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <button 
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      <div className="flex-1 w-full bg-black/5 dark:bg-white/5 rounded-3xl p-4 sm:p-8 flex items-center justify-center overflow-hidden print:p-0 print:bg-transparent min-h-[500px]">
        <div 
          ref={displayRef}
          className={cn(
            "relative shadow-2xl print:shadow-none overflow-hidden flex flex-col items-center justify-center text-center",
            layout === 'portrait' ? "w-[360px] h-[640px] rounded-3xl print:rounded-none" : "w-[148mm] h-[210mm] sm:w-[420px] sm:h-[595px] rounded-sm print:w-[148mm] print:h-[210mm]"
          )}
          style={{
            backgroundColor: bgColor,
            backgroundImage: profile.layoutBackgroundImageUrl ? `url(${getProxiedUrl(profile.layoutBackgroundImageUrl)})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: textColor
          }}
        >
          {profile.layoutBackgroundImageUrl && (
            <div className="absolute inset-0 bg-black/40 z-0" />
          )}

          <div className={cn("relative z-10 w-full h-full flex flex-col items-center p-8", getFontClass(profile.layoutFont))}>
            
            {/* Header: Photo and Details */}
            <div className="w-full flex flex-col items-center gap-4 mt-2 shrink-0">
              {profile.profilePhotoUrl && (
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden shrink-0 bg-black/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getProxiedUrl(profile.profilePhotoUrl)} alt="Profile" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="flex flex-col items-center gap-1">
                {(profile.firstName || profile.lastName) && (
                  <h1 className="text-3xl font-bold tracking-tight text-center" style={{ color: profile.layoutBackgroundImageUrl ? '#fff' : textColor }}>
                    {[profile.firstName, profile.lastName].filter(Boolean).join(' ')}
                  </h1>
                )}
                {profile.jobTitle && (
                  <p className="text-lg font-medium opacity-90 text-center" style={{ color: profile.layoutBackgroundImageUrl ? '#fff' : mutedColor }}>
                    {profile.jobTitle}
                  </p>
                )}
                {profile.companyName && (
                  <p className="text-base font-semibold mt-1 text-center" style={{ color: profile.layoutBackgroundImageUrl ? '#fff' : textColor }}>
                    {profile.companyName}
                  </p>
                )}
              </div>
            </div>

            {/* Middle: QR Code flex-centered */}
            <div className="flex-1 flex flex-col items-center justify-evenly w-full min-h-0 py-2">
              <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl w-56 h-56 sm:w-64 sm:h-64 shrink-0 flex items-center justify-center">
                {qrCodeUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                )}
              </div>
              <p className="text-xl font-bold uppercase tracking-wider text-center whitespace-nowrap shrink-0" style={{ color: profile.layoutBackgroundImageUrl ? '#fff' : textColor }}>
                Scan to Connect
              </p>
            </div>

            {/* Footer: Company Logo */}
            {profile.companyLogoUrl && (
              <div className="shrink-0 mb-2 mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getProxiedUrl(profile.companyLogoUrl)} alt="Company Logo" className="h-12 w-auto max-w-[12rem] rounded-xl object-cover shadow-sm" />
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
