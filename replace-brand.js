
const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.git') && !dirFile.includes('.next')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = [...walkSync('src'), ...walkSync('public')];
let changedFiles = 0;

files.forEach(file => {
  if (path.extname(file).match(/\.(ts|tsx|js|jsx|json|md|html|css|scss|sql)$/)) {
    const original = fs.readFileSync(file, 'utf8');
    let modified = original
      .replace(/Anoya/g, 'Tayz')
      .replace(/anoya/g, 'tayz')
      .replace(/ANOYA/g, 'TAYZ');
      
    if (original !== modified) {
      fs.writeFileSync(file, modified, 'utf8');
      changedFiles++;
      console.log('Updated:', file);
    }
  }
});
console.log('Total files changed:', changedFiles);
