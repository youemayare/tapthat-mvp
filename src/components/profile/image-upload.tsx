'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { CropperModal } from './cropper-modal';

interface ImageUploadProps {
  label: string;
  type: 'avatar' | 'logo';
  currentUrl?: string | null;
  onUploadSuccess: (url: string) => void;
}

export function ImageUpload({ label, type, currentUrl, onUploadSuccess }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  
  // Cropper states
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('image.jpg');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }

    // Read the file for the cropper
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setSelectedImageSrc(reader.result?.toString() || null);
      setSelectedFileName(file.name);
    });
    reader.readAsDataURL(file);

    // Reset input so they can select the same file again if they cancel
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadCroppedImage = async (blob: Blob) => {
    setSelectedImageSrc(null); // Close modal
    setIsUploading(true);
    setImageFailed(false);
    
    try {
      const formData = new FormData();
      // Append the blob as a file with the original filename
      formData.append('file', blob, selectedFileName);
      formData.append('type', type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to upload image');
      }

      const { publicUrl } = await res.json();
      
      onUploadSuccess(publicUrl);
      toast.success(`${label} uploaded successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong during upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-start gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative group cursor-pointer overflow-hidden bg-muted border flex items-center justify-center transition-all ${
            type === 'avatar' ? 'w-24 h-24 rounded-full' : 'w-32 h-16 rounded-xl'
          } ${isUploading ? 'opacity-50' : 'hover:bg-accent'} ${imageFailed ? 'border-red-500 bg-red-50' : 'border-border'}`}
        >
          {currentUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={currentUrl} 
              alt={label} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                console.error('Image failed to load:', currentUrl);
                setImageFailed(true);
              }}
              onLoad={() => setImageFailed(false)}
            />
          ) : (
            <UploadCloud className="w-6 h-6 text-muted-foreground" />
          )}

          {/* Overlay for hover state on desktop / indicates tap on mobile */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${currentUrl && !imageFailed ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white/80" />
            )}
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">Max 5MB. JPEG, PNG, WebP.</p>
      </div>

      {selectedImageSrc && (
        <CropperModal
          imageSrc={selectedImageSrc}
          type={type}
          onClose={() => setSelectedImageSrc(null)}
          onCropComplete={uploadCroppedImage}
        />
      )}
    </>
  );
}
