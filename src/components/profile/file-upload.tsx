'use client';

import { useState, useRef } from 'react';
import { FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  label: string;
  type: 'cv';
  currentUrl?: string | null;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
}

export function FileUpload({ label, type, currentUrl, onUploadSuccess, onRemove }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          type
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload to storage');
      }

      toast.success(`${label} uploaded successfully!`);
      onUploadSuccess(publicUrl);
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong during upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      
      {currentUrl ? (
        <div className="flex items-center gap-4 bg-card text-card-foreground border border-border rounded-xl p-4 w-full">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:underline truncate block">
              View Current Document
            </a>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 hover:bg-accent text-accent-foreground rounded-lg transition-colors text-muted-foreground hover:text-red-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center gap-3 w-full py-4 px-4 bg-muted border border-border border-dashed rounded-xl hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-5 h-5" />
              <span>Click to upload PDF</span>
            </>
          )}
        </button>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />
      <p className="text-xs text-muted-foreground">Max 10MB. PDF only.</p>
    </div>
  );
}
