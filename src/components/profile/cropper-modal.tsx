'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';
import getCroppedImg from '@/lib/cropImage';

interface CropperModalProps {
  imageSrc: string;
  type: 'avatar' | 'logo' | 'background';
  profileLayout?: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

export function CropperModal({ imageSrc, type, profileLayout, onClose, onCropComplete }: CropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<import('react-easy-crop').Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const onCropCompleteHandler = useCallback((croppedArea: import('react-easy-crop').Area, croppedAreaPixels: import('react-easy-crop').Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  const isCircularLogo = type === 'logo' && (profileLayout === 'canvas' || profileLayout === 'identity');
  const cropAspect = type === 'avatar' ? 1 : type === 'background' ? 9 / 16 : isCircularLogo ? 1 : 2;
  const computedCropShape = (type === 'avatar' || isCircularLogo) ? 'round' : 'rect';

  const content = (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center"
      style={{ touchAction: 'none' }} // Crucial for pinch-to-zoom on mobile
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onClose}
          className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={handleApply}
          disabled={isProcessing}
          className="bg-white text-black px-4 py-1.5 rounded-full font-medium text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Apply'}
        </button>
      </div>

      {/* Cropper Container */}
      <div className="relative w-full h-[70vh] sm:h-[80vh] max-w-2xl mx-auto">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={cropAspect}
          cropShape={computedCropShape}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={setZoom}
          showGrid={false}
          style={{
            containerStyle: { background: 'transparent' },
          }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 px-6 max-w-md mx-auto" onPointerDown={(e) => e.stopPropagation()}>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => {
            setZoom(Number(e.target.value));
          }}
          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
