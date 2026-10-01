const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/connection-card.tsx', 'utf8');

const replacement = `        {/* Note Preview */}
        {(currentNote || note?.audioStoragePath) && (
          <div className="relative z-10 mt-1 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl pointer-events-none flex flex-col gap-1">
             <div className="flex items-center gap-1.5 text-amber-400">
               <StickyNote className="w-3.5 h-3.5" />
               <p className="text-xs font-medium">Private Note</p>
             </div>
             {currentNote && <p className="text-sm text-foreground line-clamp-2">{currentNote}</p>}
             {note?.audioStoragePath && (
               <div className="flex flex-col gap-2 mt-2 border-t border-amber-500/20 pt-2 pointer-events-auto">
                 <div className="flex items-center gap-1.5 text-xs text-amber-500/80 font-medium">
                   <Mic className="w-3 h-3" /> Voice Note
                 </div>
                 <audio controls src={\`/api/audio/\${note.audioStoragePath}\`} className="h-8 w-full" preload="metadata" />
               </div>
             )}
          </div>
        )}`;

content = content.replace(/\{\/\* Note Preview \*\/\}\s*\{currentNote && \(\s*<div className="relative z-10 mt-1 p-3 bg-amber-500\/10 border border-amber-500\/20 rounded-xl pointer-events-none">\s*<p className="text-xs text-amber-400 font-medium mb-1">Private Note<\/p>\s*<p className="text-sm text-foreground line-clamp-2">\{currentNote\}<\/p>\s*<\/div>\s*\)\}/, replacement);

if (!content.includes('import { StickyNote, UserMinus, Mic }')) {
    content = content.replace("import { StickyNote, UserMinus } from 'lucide-react';", "import { StickyNote, UserMinus, Mic } from 'lucide-react';");
}

fs.writeFileSync('src/components/dashboard/connection-card.tsx', content);
console.log('done preview fix');
