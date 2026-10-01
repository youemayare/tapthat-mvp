const fs = require('fs');

// 1. Fix AudioPlayer.tsx fallback
let apContent = fs.readFileSync('src/components/ui/audio-player.tsx', 'utf8');

const oldApProgress = `  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;`;
const newApProgress = `  const activeDuration = duration > 0 ? duration : 30;
  const progressPercentage = (currentTime / activeDuration) * 100;`;

if (apContent.includes(oldApProgress)) {
  apContent = apContent.replace(oldApProgress, newApProgress);
  fs.writeFileSync('src/components/ui/audio-player.tsx', apContent);
}

// 2. Fix VoiceRecorder.tsx fallback
let vrContent = fs.readFileSync('src/components/profile/voice-recorder.tsx', 'utf8');

const oldVrProgress = `  const progressPercentage = (recordingTime > 0 || existingAudioDuration) ? (playbackTime / (recordingTime || existingAudioDuration || 1)) * 100 : 0;`;
const newVrProgress = `  const activeRecDuration = (recordingTime > 0 ? recordingTime : existingAudioDuration) || 30;
  const progressPercentage = (playbackTime / activeRecDuration) * 100;`;

if (vrContent.includes(oldVrProgress)) {
  vrContent = vrContent.replace(oldVrProgress, newVrProgress);
  fs.writeFileSync('src/components/profile/voice-recorder.tsx', vrContent);
}

console.log('Fixed progress percentage fallbacks');
