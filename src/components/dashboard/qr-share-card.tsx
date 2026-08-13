'use client';

import { useState, useEffect, useRef } from 'react';
import { QrCode, X, Share2, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface Props {
  cardUid: string;
}

export function QrShareCard({ cardUid }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/n/${cardUid}`
    : `https://tapthat.app/n/${cardUid}`; // Fallback

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      // Generate QR Code
      QRCode.toCanvas(canvasRef.current, profileUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [isOpen, profileUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Anoya Profile',
          text: 'Check out my digital business card!',
          url: profileUrl,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      {/* Quick Action Card */}
      <button
        onClick={() => setIsOpen(true)}
        className="group text-left bg-card text-card-foreground border border-border rounded-2xl p-5 hover:bg-primary/8 hover:border-brand-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50"
      >
        <QrCode className="w-6 h-6 text-brand-400 mb-3 group-hover:scale-110 transition-transform" />
        <h3 className="text-foreground font-semibold mb-1">Share via QR</h3>
        <p className="text-muted-foreground text-sm">Let someone scan your profile right from your screen.</p>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Modal Content */}
          <div 
            className="bg-card text-card-foreground w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h2 className="font-bold text-lg">Scan to connect</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="p-8 flex flex-col items-center bg-white">
              <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <canvas ref={canvasRef} className="block mx-auto" />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-accent/30 space-y-3">
              <p className="text-center text-sm font-medium text-muted-foreground mb-4">
                Or share your link directly
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-card border border-border hover:bg-accent rounded-xl text-sm font-medium transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
