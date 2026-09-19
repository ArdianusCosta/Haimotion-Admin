const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('components/finance');
let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const regex = /const staticData = Array\(\d+\)\.fill\(\{[\s\S]*?\}\)\.map\(\([\s\S]*?id: index \}\)\)/;
  if (regex.test(content)) {
    content = content.replace(regex, 'const staticData: any[] = []');
    fs.writeFileSync(file, content);
    modifiedFiles++;
    console.log('Cleaned:', file);
  }
});
console.log('Total files cleaned:', modifiedFiles);
