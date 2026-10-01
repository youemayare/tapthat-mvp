const fs = require('fs');

function fixProgressBar(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace track background
  content = content.replace(
    '<div className="absolute left-0 right-0 h-1.5 bg-zinc-800 rounded-full" />',
    '<div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-zinc-800 rounded-full" />'
  );

  // Replace filled track and pointer
  const oldFilledTrack = `<div 
                  className="absolute left-0 h-1.5 bg-amber-500 rounded-full transition-all ease-linear"
                  style={{ width: \`\${progressPercentage}%\`, transitionDuration: isPlaying ? '150ms' : '0ms' }}
                >`;
  
  const newFilledTrack = `<div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-amber-500 rounded-full"
                  style={{ width: \`\${Math.min(100, Math.max(0, progressPercentage || 0))}%\`, transition: isPlaying ? 'width 150ms linear' : 'none' }}
                >`;

  const oldFilledTrack2 = `<div 
          className="absolute left-0 h-1.5 bg-amber-500 rounded-full transition-all ease-linear"
          style={{ width: \`\${progressPercentage}%\`, transitionDuration: isPlaying ? '150ms' : '0ms' }}
        >`;
        
  const newFilledTrack2 = `<div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-amber-500 rounded-full"
          style={{ width: \`\${Math.min(100, Math.max(0, progressPercentage || 0))}%\`, transition: isPlaying ? 'width 150ms linear' : 'none' }}
        >`;

  if (content.includes(oldFilledTrack)) {
    content = content.replace(oldFilledTrack, newFilledTrack);
  } else if (content.includes(oldFilledTrack2)) {
    content = content.replace(oldFilledTrack2, newFilledTrack2);
  } else {
    console.log("Could not find filled track to replace in", filePath);
  }

  fs.writeFileSync(filePath, content);
}

fixProgressBar('src/components/ui/audio-player.tsx');
fixProgressBar('src/components/profile/voice-recorder.tsx');

console.log('done fixing progress bars');
