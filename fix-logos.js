const fs = require('fs');
const files = [
  'src/app/page.tsx',
  'src/app/(auth)/layout.tsx',
  'src/components/dashboard/header.tsx',
  'src/components/dashboard/sidebar.tsx',
  'src/components/profile/qr-share-sheet.tsx'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    const original = fs.readFileSync(file, 'utf8');
    const modified = original.replace(/Ano(<span[^>]+>)ya(<\/span>)/g, 'Tay$1z$2');
    if (original !== modified) {
      fs.writeFileSync(file, modified, 'utf8');
      console.log('Updated:', file);
    }
  }
});
