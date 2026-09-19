const fs = require('fs');
const path = require('path');

function fixDuplicates(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDuplicates(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      if (code.includes('const { t } = useLanguage()')) {
        // If there's another useLanguage declaration, remove the simple one we added
        const matches = code.match(/useLanguage\(\)/g);
        if (matches && matches.length > 1) {
          console.log(`Fixing duplicate in ${fullPath}`);
          // Remove the first occurrence of `  const { t } = useLanguage()\n`
          code = code.replace(/\s*const \{ t \} = useLanguage\(\)\n?/, '');
          fs.writeFileSync(fullPath, code);
        }
      }
    }
  }
}

fixDuplicates('components/finance');
