const fs = require('fs');

let vrContent = fs.readFileSync('src/components/profile/voice-recorder.tsx', 'utf8');

// Add progressBarRef
if (!vrContent.includes('const progressBarRef = useRef<HTMLDivElement | null>(null);')) {
  vrContent = vrContent.replace(
    'const audioRef = useRef<HTMLAudioElement | null>(null);',
    'const audioRef = useRef<HTMLAudioElement | null>(null);\n  const progressBarRef = useRef<HTMLDivElement | null>(null);'
  );
}

// Add handleProgressClick
const handleProgressClickCode = `
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
`;
if (!vrContent.includes('handleProgressClick')) {
  vrContent = vrContent.replace('const handleClear = () => {', handleProgressClickCode + '\n  const handleClear = () => {');
}

// Ensure proper display time calculation
const displayTimeCode = `
  const displayTime = (!isPlaying && playbackTime === 0) ? (recordingTime > 0 ? recordingTime : (existingAudioDuration || 0)) : playbackTime;
  const progressPercentage = (recordingTime > 0 || existingAudioDuration) ? (playbackTime / (recordingTime || existingAudioDuration || 1)) * 100 : 0;
`;
if (!vrContent.includes('displayTime = (!isPlaying')) {
  vrContent = vrContent.replace('return (', displayTimeCode + '\n  return (');
}

// Replace UI
const oldUI = `{audioBlobUrl && !isRecording && (
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
          )}`;

const newUI = `{audioBlobUrl && !isRecording && (
            <div className="flex items-center gap-3 w-full">
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shrink-0" onClick={togglePlayback}>
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </Button>
              
              <div 
                ref={progressBarRef}
                className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden cursor-pointer relative"
                onClick={handleProgressClick}
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-amber-500 transition-all ease-linear"
                  style={{ width: \`\${progressPercentage}%\`, transitionDuration: isPlaying ? '150ms' : '0ms' }}
                />
              </div>

              <div className="text-xs text-zinc-400 font-medium w-9 text-right tabular-nums shrink-0">
                {formatTime(displayTime)}
              </div>
              <audio 
                ref={audioRef} 
                src={audioBlobUrl} 
                onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)}
                onEnded={() => { setIsPlaying(false); setPlaybackTime(0); }}
                className="hidden"
                preload="metadata"
              />
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 shrink-0 ml-1 rounded-full" onClick={handleClear}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}`;

vrContent = vrContent.replace(oldUI, newUI);

fs.writeFileSync('src/components/profile/voice-recorder.tsx', vrContent);
console.log('done modifying voice recorder');
