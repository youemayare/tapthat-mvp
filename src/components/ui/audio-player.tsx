'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from './button';

interface AudioPlayerProps {
  src: string;
  duration?: number;
}

export function AudioPlayer({ src, duration: knownDuration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(knownDuration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [src]);

  // Update duration if knownDuration prop changes
  useEffect(() => {
    if (knownDuration) {
      setDuration(knownDuration);
    }
  }, [knownDuration]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      // If we don't have a known duration, or if the audio file gives a valid finite one
      if (audioRef.current.duration && audioRef.current.duration !== Infinity && !knownDuration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    // Fallback to max 30 if duration is 0
    const activeDuration = duration > 0 ? duration : 30;
    const newTime = percentage * activeDuration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Show total duration if not playing and at start
  const displayTime = (!isPlaying && currentTime === 0) ? duration : currentTime;

  return (
    <div className="flex items-center gap-3 w-full bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/60 pointer-events-auto">
      <Button 
        type="button" 
        size="icon" 
        variant="ghost" 
        className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 shrink-0" 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePlayback(); }}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
      </Button>
      
      <div 
        ref={progressBarRef}
        className="flex-1 h-4 flex items-center cursor-pointer relative group"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleProgressClick(e); }}
      >
        {/* Track background */}
        <div className="absolute left-0 right-0 h-1.5 bg-zinc-800 rounded-full" />
        
        {/* Filled track and pointer */}
        <div 
          className="absolute left-0 h-1.5 bg-amber-500 rounded-full transition-all ease-linear"
          style={{ width: `${progressPercentage}%`, transitionDuration: isPlaying ? '150ms' : '0ms' }}
        >
          {/* Moving Pointer (Knob) */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-amber-200 rounded-full shadow-sm shadow-amber-500/50" />
        </div>
      </div>

      <div className="text-xs font-medium text-zinc-400 w-9 text-right tabular-nums shrink-0">
        {formatTime(displayTime)}
      </div>

      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
        className="hidden"
        preload="metadata"
      />
    </div>
  );
}
