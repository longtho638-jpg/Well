import { readFileSync, writeFileSync, readdirSync } from 'fs';

const EN_TS = 'src/locales/en.ts';
const VI_TS = 'src/locales/vi.ts';
const EN_DIR = 'src/locales/en';
const VI_DIR = 'src/locales/vi';

console.log('🔍 Scanning for missing imports...\n');

// Get all module files
const allModules = readdirSync(EN_DIR)
  .filter(f => f.endsWith('.ts'))
  .map(f => f.replace('.ts', ''))
  .filter(m => m !== 'index' && m !== 'en'); // Skip index and en.ts itself

// Read en.ts and get existing imports
const enContent = readFileSync(EN_TS, 'utf-8');
const existingEnImports = new Set();
const importRe = /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]\.\/en\/([^'"]+)['"]/g;
let match;
while ((match = importRe.exec(enContent)) !== null) {
  existingEnImports.add(match[2]);
}

// Find missing modules
const missingModules = allModules.filter(m => !existingEnImports.has(m));
console.log(`Missing imports in en.ts: ${missingModules.length}\n`);

if (missingModules.length === 0) {
  console.log('✅ All modules imported!');
} else {
  // Generate import statements
  const newImports = missingModules.map(m => `import { ${m} } from './en/${m}';`).join('\n');
  
  // Insert after existing imports
  const lastImportIndex = enContent.lastIndexOf('\nimport');
  if (lastImportIndex !== -1) {
    const insertPos = enContent.indexOf('\n', lastImportIndex + 1);
    const newContent = enContent.slice(0, insertPos) + '\n' + newImports + enContent.slice(insertPos);
    writeFileSync(EN_TS, newContent);
    console.log(`✅ Added ${missingModules.length} imports to en.ts`);
  }
}

// Same for vi.ts
const viContent = readFileSync(VI_TS, 'utf-8');
const existingViImports = new Set();
while ((match = importRe.exec(viContent)) !== null) {
  existingViImports.add(match[2]);
}

const missingViModules = allModules.filter(m => !existingViImports.has(m));
console.log(`Missing imports in vi.ts: ${missingViModules.length}\n`);

if (missingViModules.length === 0) {
  console.log('✅ All modules imported!');
} else {
  const newImports = missingViModules.map(m => `import { ${m} } from './vi/${m}';`).join('\n');
  const lastImportIndex = viContent.lastIndexOf('\nimport');
  if (lastImportIndex !== -1) {
    const insertPos = viContent.indexOf('\n', lastImportIndex + 1);
    const newContent = viContent.slice(0, insertPos) + '\n' + newImports + viContent.slice(insertPos);
    writeFileSync(VI_TS, newContent);
    console.log(`✅ Added ${missingViModules.length} imports to vi.ts`);
  }
}

console.log('\n🔄 Running validation...\n');

import { execSync } from 'child_process';
try {
  execSync('pnpm i18n:validate', { stdio: 'inherit', maxBuffer: 100 * 1024 * 1024 });
  console.log('\n🎉 MISSION COMPLETE - i18n validation PASSED!');
} catch (e) {
  console.log('\n⚠️ Validation output above\n');
}
