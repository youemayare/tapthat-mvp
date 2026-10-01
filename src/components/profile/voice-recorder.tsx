'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  onClear: () => void;
  existingAudioUrl?: string;
  existingAudioDuration?: number; // used for playback if they already have one, but typically used in edit mode
}

export function VoiceRecorder({ onRecordingComplete, onClear, existingAudioUrl, existingAudioDuration }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(existingAudioDuration || 0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  
  const MAX_DURATION = 30; // 30 seconds

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioBlobUrl && !existingAudioUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl, existingAudioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Microphone access requires a secure (HTTPS) connection or localhost.');
        toast.error('Microphone access unavailable.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        onRecordingComplete(audioBlob, recordingTimeRef.current);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // chunk every 200ms
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev >= MAX_DURATION - 1 ? MAX_DURATION : prev + 1;
          recordingTimeRef.current = next;
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
          }
          return next;
        });
      }, 1000);

    } catch (err: any) {
      console.error('Microphone error:', err);
      const errorMessage = err?.message || err?.name || 'Unknown error occurred.';
      setError(`Mic error: ${errorMessage}`);
      toast.error(`Recording failed: ${errorMessage}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const activeDuration = recordingTime > 0 ? recordingTime : (existingAudioDuration || 0);
    const newTime = percentage * activeDuration;
    
    audioRef.current.currentTime = newTime;
    setPlaybackTime(Math.floor(newTime));
  };

  const handleClear = () => {
    if (existingAudioUrl) {
      setShowConfirmModal(true);
    } else {
      confirmClear();
    }
  };

  const confirmClear = () => {
    if (audioBlobUrl && !existingAudioUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setRecordingTime(0);
    onClear();
    setShowConfirmModal(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioBlobUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const displayTime = (!isPlaying && playbackTime === 0) ? (recordingTime > 0 ? recordingTime : (existingAudioDuration || 0)) : playbackTime;
  const activeRecDuration = (recordingTime > 0 ? recordingTime : existingAudioDuration) || 30;
  const progressPercentage = (playbackTime / activeRecDuration) * 100;

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-xl mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-full">
          {!audioBlobUrl && !isRecording && (
            <Button type="button" size="sm" variant="outline" className="gap-2 border-zinc-800 text-zinc-300 hover:text-white bg-transparent" onClick={startRecording}>
              <Mic className="w-4 h-4" />
              <span>Record Voice Note</span>
            </Button>
          )}

          {isRecording && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
              </div>
              <Button type="button" size="sm" variant="destructive" className="h-8 rounded-full" onClick={stopRecording}>
                <Square className="w-4 h-4 mr-1" /> Stop
              </Button>
            </div>
          )}

          {audioBlobUrl && !isRecording && (
            <div className="flex items-center gap-3 w-full">
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shrink-0" onClick={togglePlayback}>
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </Button>
              
              <div 
                ref={progressBarRef}
                className="flex-1 h-4 flex items-center cursor-pointer relative group"
                onClick={handleProgressClick}
              >
                {/* Track background */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-zinc-800 rounded-full" />
                
                {/* Filled track and pointer */}
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercentage || 0))}%`, transition: isPlaying ? 'width 150ms linear' : 'none' }}
                >
                  {/* Moving Pointer (Knob) */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-amber-200 rounded-full shadow-sm shadow-amber-500/50" />
                </div>
              </div>

              <div className="text-xs text-zinc-400 font-medium w-9 text-right tabular-nums shrink-0">
                {formatTime(displayTime)}
              </div>
              <audio 
                ref={audioRef} 
                src={audioBlobUrl} 
                onTimeUpdate={(e) => {
                  setPlaybackTime(e.currentTarget.currentTime);
                  const d = e.currentTarget.duration;
                  if (d && d !== Infinity && recordingTime === 0 && !existingAudioDuration) {
                    setRecordingTime(Math.floor(d));
                  }
                }}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (d && d !== Infinity && recordingTime === 0 && !existingAudioDuration) {
                    setRecordingTime(Math.floor(d));
                  }
                }}
                onEnded={() => { setIsPlaying(false); setPlaybackTime(0); }}
                className="hidden"
                preload="metadata"
              />
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 shrink-0 ml-1 rounded-full" onClick={handleClear}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {!isRecording && !audioBlobUrl && !error && (
        <p className="text-[11px] text-zinc-500">Private to you. Max 30 seconds.</p>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400 mt-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-background border-border" style={{ borderRadius: '1.5rem' }}>
          <DialogHeader>
            <DialogTitle>Delete Voice Note?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this voice note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between flex-row gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setShowConfirmModal(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmClear} className="rounded-xl">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
