'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Loader2, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import type { Area } from 'react-easy-crop';

interface WalletHeroUploadProps {
  currentUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
}

export function WalletHeroUpload({ currentUrl, onUploadSuccess, onRemove }: WalletHeroUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('image.png');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_MIME = ['image/png', 'image/jpeg'];
  const MAX_SIZE_MB = 2;
  // Google Wallet GenericObject heroImage: approx 5:4 (1032x812)
  const ASPECT = 1032 / 812;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error('Only PNG or JPEG images are accepted for the Wallet image.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropSrc(reader.result?.toString() || null);
      setCropFileName(file.name);
    });
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = (_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  };

  const handleApply = async () => {
    if (!croppedAreaPixels || !cropSrc) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      if (!blob) return;
      setCropSrc(null);
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', blob, cropFileName.replace(/\.(jpe?g|png|webp)$/i, '.png'));
      formData.append('type', 'wallet_hero_image');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Upload failed');
      }
      const { publicUrl } = await res.json();
      onUploadSuccess(publicUrl);
      toast.success('Wallet image uploaded!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {currentUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border" style={{ aspectRatio: '1032/812', maxWidth: 400 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl} alt="Wallet hero image" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              aria-label="Remove wallet image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-col items-center justify-center gap-2 w-full max-w-sm rounded-xl border-2 border-dashed border-border hover:border-brand-500/50 hover:bg-accent/30 transition-all text-muted-foreground p-8 cursor-pointer disabled:opacity-50"
            style={{ aspectRatio: '1032/812' }}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm font-medium">Click to upload</span>
                <span className="text-xs text-center">PNG recommended · Max 2 MB</span>
              </>
            )}
          </button>
        )}

        {!currentUrl && (
          <button
            type="button"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            {isUploading ? 'Uploading…' : 'Upload Wallet Image'}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Crop modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
            <button
              type="button"
              onClick={() => setCropSrc(null)}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
            <p className="text-white/70 text-sm">Crop your Wallet image (5:4)</p>
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing}
              className="bg-white text-black px-4 py-1.5 rounded-full font-medium text-sm hover:bg-neutral-200 disabled:opacity-50"
            >
              {isProcessing ? 'Processing…' : 'Apply'}
            </button>
          </div>
          <div className="relative w-full h-[70vh] sm:h-[80vh] max-w-2xl mx-auto">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT}
              cropShape="rect"
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onZoomChange={setZoom}
              showGrid
              style={{ containerStyle: { background: 'transparent' } }}
            />
          </div>
          <div className="absolute bottom-8 left-0 right-0 px-6 max-w-md mx-auto">
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      )}
    </>
  );
}
