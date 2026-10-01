const fs = require('fs');

// 1. Update VoiceRecorder.tsx
let vrContent = fs.readFileSync('src/components/profile/voice-recorder.tsx', 'utf8');
vrContent = vrContent.replace('const MAX_DURATION = 120; // 2 minutes', 'const MAX_DURATION = 30; // 30 seconds');
vrContent = vrContent.replace('Max 2 mins.', 'Max 30 seconds.');
fs.writeFileSync('src/components/profile/voice-recorder.tsx', vrContent);

// 2. Update upload route
let apiContent = fs.readFileSync('src/app/api/audio/upload/route.ts', 'utf8');
apiContent = apiContent.replace('const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB limit for 2min audio', 'const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB limit for 30s audio');
apiContent = apiContent.replace('if (file.size > MAX_AUDIO_SIZE) {\n      return NextResponse.json({ error: `File exceeds 10MB limit` }, { status: 400 });\n    }', 'if (file.size > MAX_AUDIO_SIZE) {\n      return NextResponse.json({ error: `File exceeds 5MB limit` }, { status: 400 });\n    }');
apiContent = apiContent.replace('if (duration > 120) {\n      return NextResponse.json({ error: `Audio exceeds 2 minutes limit` }, { status: 400 });\n    }', 'if (duration > 30) {\n      return NextResponse.json({ error: `Audio exceeds 30 seconds limit` }, { status: 400 });\n    }');
fs.writeFileSync('src/app/api/audio/upload/route.ts', apiContent);

console.log('done');
