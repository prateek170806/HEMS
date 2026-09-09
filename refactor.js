const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = 0;

walkDir('./src', (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  // Exclude the auth.ts helper itself
  if (filePath.replace(/\\/g, '/').includes('lib/server/auth.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Pattern to find `prisma.household.findFirst(...)` and replace with `getCurrentHousehold()`
  // NOTE: This assumes findFirst() takes no vital arguments that we need, which is true because it was single-tenant.
  const pattern = /await\s+prisma\.household\.findFirst\(\s*(?:{[^}]*}\s*)?\)/g;
  
  if (pattern.test(content)) {
    content = content.replace(pattern, 'await getCurrentHousehold()');
    
    // Add import if not present
    if (!content.includes('getCurrentHousehold')) {
       // We need to calculate relative path or use alias. We will use the alias @/lib/server/auth
       const importStatement = `import { getCurrentHousehold } from "@/lib/server/auth";\n`;
       
       // Find last import
       const lines = content.split('\n');
       let lastImportIndex = -1;
       for (let i = 0; i < lines.length; i++) {
         if (lines[i].startsWith('import ')) {
           lastImportIndex = i;
         }
       }
       
       if (lastImportIndex !== -1) {
         lines.splice(lastImportIndex + 1, 0, importStatement);
         content = lines.join('\n');
       } else {
         content = importStatement + content;
       }
    }
    changed = true;
  }

  // Also replace `await prisma.household.findFirst()` where it might have been assigned without await? No, it's always awaited.
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
    modifiedFiles++;
  }
});

console.log(`Finished refactoring. Modified ${modifiedFiles} files.`);
