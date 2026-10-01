const fs = require('fs');

const files = [
  'src/components/profile/layouts/canvas-profile-layout.tsx',
  'src/components/profile/layouts/classic-profile-layout.tsx',
  'src/components/profile/layouts/identity-profile-layout.tsx',
  'src/components/profile/layouts/professional-profile-layout.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace('actions.setAudioBlob', 'setAudioBlob');
  content = content.replace('actions.setAudioDuration', 'setAudioDuration');
  
  // Add to destructuring
  content = content.replace('handleSaveConnectionAndNote,', 'handleSaveConnectionAndNote,\n    setAudioBlob,\n    setAudioDuration,');

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
