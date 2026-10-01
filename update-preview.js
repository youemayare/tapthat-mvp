const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/connection-card.tsx', 'utf8');

const target1 = `        className={\`w-9 h-9 rounded-full flex items-center justify-center transition-colors \${currentNote ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'}\`}`;
const replacement1 = `        className={\`w-9 h-9 rounded-full flex items-center justify-center transition-colors \${(currentNote || note?.audioStoragePath) ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'}\`}`;

const target2 = `        {/* Note Preview */}
        {currentNote && (
          <div className="relative z-10 mt-1 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl pointer-events-none">
             <p className="text-xs text-amber-400 font-medium mb-1">Private Note</p>
             <p className="text-sm text-foreground line-clamp-2">{currentNote}</p>
          </div>
        )}`;

const replacement2 = `        {/* Note Preview */}
        {(currentNote || note?.audioStoragePath) && (
          <div className="relative z-10 mt-1 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl pointer-events-none flex flex-col gap-1">
             <div className="flex items-center gap-1.5 text-amber-400">
               <StickyNote className="w-3.5 h-3.5" />
               <p className="text-xs font-medium">Private Note</p>
             </div>
             {currentNote && <p className="text-sm text-foreground line-clamp-2">{currentNote}</p>}
             {note?.audioStoragePath && (
               <div className="flex items-center gap-1.5 text-xs text-amber-500/80 mt-1 font-medium">
                 <Mic className="w-3 h-3" /> Voice Note {note.audioDuration ? \`(\${Math.floor(note.audioDuration/60)}:\${(note.audioDuration%60).toString().padStart(2, '0')})\` : ''}
               </div>
             )}
          </div>
        )}`;

if (!content.includes('import { Mic }')) {
  content = content.replace("import { StickyNote, UserMinus } from 'lucide-react';", "import { StickyNote, UserMinus, Mic } from 'lucide-react';");
}

content = content.replace(target1.replace(/\r/g, ''), replacement1);
content = content.replace(target2.replace(/\r/g, ''), replacement2);

fs.writeFileSync('src/components/dashboard/connection-card.tsx', content);
console.log('done preview');
