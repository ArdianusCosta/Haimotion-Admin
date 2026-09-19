const fs = require('fs');
const path = require('path');

function processDirectory(directory) {
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      content = content.replace(/text-\[\#d98b4e\]/g, 'text-primary');
      content = content.replace(/text-\[\#b85b24\]/g, 'text-primary');
      content = content.replace(/bg-\[\#b85b24\]/g, 'bg-primary');
      content = content.replace(/bg-\[\#d98b4e\]/g, 'bg-primary');
      content = content.replace(/hover:bg-\[\#a04e1f\]/g, 'hover:bg-primary/90');
      content = content.replace(/focus:border-\[\#d98b4e\]/g, 'focus:border-primary');
      content = content.replace(/border-\[\#d98b4e\]/g, 'border-primary');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated colors in: ${fullPath}`);
      }
    }
  });
}

processDirectory('components/finance');
console.log('Finished updating colors.');
