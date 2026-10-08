const fs = require('fs');
let content = fs.readFileSync('src/components/profile/use-profile-actions.ts', 'utf8');

const target1 = "toast.success('Saved to My Tayz! 🤙'";
const target2 = "toast.success('Saved to My Tayz!";
const target3 = "toast.success('Saved to My Tayz! dYZ%'";

let replaced = false;

if (content.includes(target1)) {
  content = content.replace(target1, "toast.success('Saved to your connections!'");
  replaced = true;
} else if (content.includes(target3)) {
  content = content.replace(target3, "toast.success('Saved to your connections!'");
  replaced = true;
} else {
  // regex fallback
  content = content.replace(/toast\.success\('Saved to My Tayz!.*?'/, "toast.success('Saved to your connections!'");
  replaced = true;
}

if (replaced) {
  fs.writeFileSync('src/components/profile/use-profile-actions.ts', content);
  console.log('Replaced successfully');
} else {
  console.log('Not replaced');
}
