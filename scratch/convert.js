
const fs = require("fs");
let content = fs.readFileSync("src/components/profile/layouts/identity-profile-layout.tsx", "utf-8");

const replacements = [
  // Layout wrappers
  [/bg-zinc-950 text-white/g, "bg-background text-foreground"],
  [/bg-black\/40 backdrop-blur-md border border-white\/10 rounded-full flex items-center justify-center text-white hover:bg-black\/60/g, "bg-background\/40 backdrop-blur-md border border-border rounded-full flex items-center justify-center text-foreground hover:bg-background\/60"],
  
  // Hero Section
  [/bg-gradient-to-br from-zinc-800 to-zinc-950/g, "bg-gradient-to-br from-muted to-background"],
  [/text-white\/10/g, "text-muted-foreground\/20"],
  [/from-zinc-950 via-zinc-950\/60 to-transparent/g, "from-background via-background\/60 to-transparent"],
  [/text-white mb-1 drop-shadow-md/g, "text-foreground mb-1 drop-shadow-md"],
  [/text-zinc-300/g, "text-muted-foreground"],
  [/bg-white p-0\.5 border border-white\/20/g, "bg-background p-0.5 border border-border"],
  
  // Buttons
  [/bg-white text-zinc-950 hover:bg-zinc-200/g, "bg-primary text-primary-foreground hover:bg-primary\/90"],
  [/border-white\/20 bg-white\/5 text-white hover:bg-white\/10 hover:text-white/g, "border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"],
  [/bg-zinc-900 border border-white\/10 text-white font-medium hover:bg-zinc-800/g, "bg-card border border-border text-card-foreground font-medium hover:bg-accent"],
  
  // Grid / Links
  [/bg-zinc-900 border border-white\/10 hover:bg-zinc-800 transition-colors group text-white/g, "bg-card border border-border hover:bg-accent transition-colors group text-card-foreground"],
  [/text-zinc-400 group-hover:text-white/g, "text-muted-foreground group-hover:text-foreground"],
  
  // Social Bar
  [/bg-zinc-900 border border-white\/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/g, "bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"],
  
  // CV Link
  [/bg-zinc-900 border border-white\/10 hover:bg-zinc-800 transition-colors text-white/g, "bg-card border border-border hover:bg-accent transition-colors text-card-foreground"],
  [/text-zinc-400/g, "text-muted-foreground"],
  
  // Footer
  [/bg-white\/5 hover:bg-white\/10 text-zinc-400 text-xs font-medium rounded-full transition-all duration-200 border border-white\/5/g, "bg-card hover:bg-accent text-muted-foreground text-xs font-medium rounded-full transition-all duration-200 border border-border"],
  [/text-white ml-0\.5/g, "text-foreground ml-0.5"],
  [/text-zinc-500/g, "text-muted-foreground\/80"],
  [/hover:text-white/g, "hover:text-foreground"],
  
  // Dialog
  [/bg-zinc-900 text-white border-zinc-800/g, "bg-background text-foreground border-border"],
  [/bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-zinc-700/g, "bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"],
  [/hover:bg-zinc-800/g, "hover:bg-accent"]
];

replacements.forEach(([regex, replaceStr]) => {
  content = content.replace(regex, replaceStr);
});

fs.writeFileSync("src/components/profile/layouts/identity-profile-layout.tsx", content, "utf-8");
console.log("Done");

