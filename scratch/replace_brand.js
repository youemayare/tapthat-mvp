const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes('\\api\\') && !fullPath.includes('/api/')) {
        results = results.concat(walk(fullPath));
      }
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = [...walk('./src/app'), ...walk('./src/components')];
let changedFiles = [];

files.forEach(file => {
  if (file.includes('route.ts')) return; // Extra safety for api routes
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Global replacement for TapThat -> Anoya
  content = content.replace(/TapThat/g, 'Anoya');
  
  // Specific replacement for the split logo
  content = content.replace(/Tap<span className="text-brand-400">That<\/span>/g, 'Ano<span className="text-brand-400">ya</span>');
  content = content.replace(/Tap\s*<span className="text-brand-400">\s*That\s*<\/span>/g, 'Ano<span className="text-brand-400">ya</span>');

  // Fix any domain names that got caught if they were capitalized (unlikely, but just in case)
  content = content.replace(/Anoya\.vercel\.app/gi, 'tapthat.vercel.app');
  content = content.replace(/Anoya\.app/gi, 'tapthat.app');
  content = content.replace(/Anoya\.ae/gi, 'tapthat.ae');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles.push(file);
  }
});

fs.writeFileSync('scratch/changed_files.json', JSON.stringify(changedFiles, null, 2));
console.log(`Updated ${changedFiles.length} files.`);
