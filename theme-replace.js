/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { search: /bg-\[#09090b\]/g, replace: 'bg-background' },
  { search: /text-white/g, replace: 'text-foreground' },
  { search: /border-white\/10/g, replace: 'border-border' },
  { search: /border-white\/5/g, replace: 'border-border' },
  { search: /bg-white\/5/g, replace: 'bg-card text-card-foreground' },
  { search: /bg-white\/10/g, replace: 'bg-accent text-accent-foreground' },
  { search: /hover:bg-white\/10/g, replace: 'hover:bg-accent hover:text-accent-foreground' },
  { search: /text-zinc-400/g, replace: 'text-muted-foreground' },
  { search: /text-zinc-500/g, replace: 'text-muted-foreground' },
  { search: /border-zinc-800/g, replace: 'border-border' },
  { search: /bg-white\/20/g, replace: 'bg-accent/50' },
  { search: /bg-white/g, replace: 'bg-primary' },
  { search: /text-black/g, replace: 'text-primary-foreground' },
  { search: /text-\[#09090b\]/g, replace: 'text-primary-foreground' },
  { search: /text-zinc-300/g, replace: 'text-muted-foreground' },
];

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      replacements.forEach(r => {
        content = content.replace(r.search, r.replace);
      });
      if (original !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  });
}

processDirectory(directoryPath);
