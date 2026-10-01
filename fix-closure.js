const fs = require('fs');

let content = fs.readFileSync('src/components/profile/voice-recorder.tsx', 'utf8');

// 1. Add recordingTimeRef
if (!content.includes('const recordingTimeRef = useRef(0);')) {
  content = content.replace(
    'const timerRef = useRef<NodeJS.Timeout | null>(null);',
    'const timerRef = useRef<NodeJS.Timeout | null>(null);\n  const recordingTimeRef = useRef(0);'
  );
}

// 2. Fix the timer interval to update the ref
const oldTimer = `      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);`;

const newTimer = `      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev >= MAX_DURATION - 1 ? MAX_DURATION : prev + 1;
          recordingTimeRef.current = next;
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
          }
          return next;
        });
      }, 1000);`;

if (content.includes(oldTimer)) {
  content = content.replace(oldTimer, newTimer);
}

// 3. Fix startRecording initialization
content = content.replace(
  'setRecordingTime(0);\n\n      timerRef.current = setInterval',
  'setRecordingTime(0);\n      recordingTimeRef.current = 0;\n\n      timerRef.current = setInterval'
);

// 4. Fix onstop closure capturing stale recordingTime
const oldOnStop = `      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        onRecordingComplete(audioBlob, recordingTime);
        stream.getTracks().forEach(track => track.stop());
      };`;

const newOnStop = `      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        onRecordingComplete(audioBlob, recordingTimeRef.current);
        stream.getTracks().forEach(track => track.stop());
      };`;

if (content.includes(oldOnStop)) {
  content = content.replace(oldOnStop, newOnStop);
}

// 5. Fix older broken DB durations by reading from HTMLAudioElement directly
const oldAudioTag = `              <audio 
                ref={audioRef} 
                src={audioBlobUrl} 
                onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)}
                onEnded={() => { setIsPlaying(false); setPlaybackTime(0); }}
                className="hidden"
                preload="metadata"
              />`;

const newAudioTag = `              <audio 
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
              />`;

if (content.includes(oldAudioTag)) {
  content = content.replace(oldAudioTag, newAudioTag);
}

fs.writeFileSync('src/components/profile/voice-recorder.tsx', content);
console.log('Fixed recording duration closure bug');
