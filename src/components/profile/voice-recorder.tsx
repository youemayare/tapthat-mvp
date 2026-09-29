'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  onClear: () => void;
  existingAudioUrl?: string; // used for playback if they already have one, but typically used in edit mode
}

export function VoiceRecorder({ onRecordingComplete, onClear, existingAudioUrl }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
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
        onRecordingComplete(audioBlob, recordingTime);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // chunk every 200ms
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
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

  const handleClear = () => {
    if (audioBlobUrl && !existingAudioUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setRecordingTime(0);
    onClear();
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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
              <Button type="button" size="icon" variant="outline" className="h-8 w-8 rounded-full border-zinc-800" onClick={togglePlayback}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <div className="text-sm text-zinc-400 font-medium w-12">
                {formatTime(playbackTime || recordingTime)}
              </div>
              <audio 
                ref={audioRef} 
                src={audioBlobUrl} 
                onTimeUpdate={(e) => setPlaybackTime(Math.floor(e.currentTarget.currentTime))}
                onEnded={() => { setIsPlaying(false); setPlaybackTime(0); }}
                className="hidden"
              />
              <div className="flex-1" />
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-red-400" onClick={handleClear}>
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
    </div>
  );
}
