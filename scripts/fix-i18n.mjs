import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Lấy danh sách keys thiếu từ validation...\n');

let missingKeys = [];

try {
  execSync('pnpm i18n:validate 2>&1', { encoding: 'utf-8' });
  console.log('✅ Validation PASSED!');
  process.exit(0);
} catch (e) {
  const output = e.stdout || '';
  const keyMatches = output.match(/^\s+([a-zA-Z0-9_.]+)\n\s+-> Used in:/gm);
  if (keyMatches) {
    keyMatches.forEach(m => {
      const key = m.match(/^\s+([a-zA-Z0-9_.]+)/)?.[1];
      if (key && !missingKeys.includes(key)) {
        missingKeys.push(key);
      }
    });
  }
}

console.log(`Found ${missingKeys.length} missing keys\n`);

if (missingKeys.length === 0) {
  console.log('✅ All keys present!');
  process.exit(0);
}

// Group by module
const moduleKeys = {};
for (const key of missingKeys) {
  const moduleName = key.split('.')[0];
  if (!moduleKeys[moduleName]) moduleKeys[moduleName] = [];
  moduleKeys[moduleName].push(key);
}

console.log('📊 Keys by module:');
Object.entries(moduleKeys).forEach(([mod, keys]) => {
  console.log(`  ${mod}: ${keys.length} keys`);
});

// Add keys to en.ts and vi.ts
function addKeysToMainFile(filePath, modulesKeys) {
  let content = readFileSync(filePath, 'utf-8');
  
  for (const [moduleName, keys] of Object.entries(modulesKeys)) {
    // Check if module exists in export object
    const moduleRe = new RegExp(`(${moduleName}:\\s*\\{)([^}]*)(\\})`, 's');
    const match = content.match(moduleRe);
    
    if (match) {
      // Module exists, add missing keys
      const existingContent = match[2];
      const newKeys = [];
      
      for (const key of keys) {
        const subKey = key.split('.').slice(1).join('.');
        // Check if key already exists
        const keyRe = new RegExp(`^\\s*${subKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`, 'm');
        if (!keyRe.test(existingContent)) {
          const value = `[MISSING] ${subKey.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}`;
          newKeys.push(`    ${subKey}: "${value}"`);
        }
      }
      
      if (newKeys.length > 0) {
        const replacement = `$1\n${newKeys.join(',\n')},$2$3`;
        content = content.replace(moduleRe, replacement);
        console.log(`  ✓ ${filePath}: Added ${newKeys.length} keys to ${moduleName}`);
      }
    } else {
      // Module doesn't exist, create it before closing brace of main export
      const keysObj = keys.map(k => {
        const subKey = k.split('.').slice(1).join('.');
        const value = `[MISSING] ${subKey.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}`;
        return `    ${subKey}: "${value}"`;
      }).join(',\n');
      
      const mainCloseRe = /^(\s*)\};\s*$/m;
      const newModule = `  ${moduleName}: {\n${keysObj}\n  },\n};`;
      
      content = content.replace(mainCloseRe, newModule);
      console.log(`  ✓ ${filePath}: Created ${moduleName} with ${keys.length} keys`);
    }
  }
  
  writeFileSync(filePath, content);
}

console.log('\n✏️ Adding keys to en.ts and vi.ts...\n');

addKeysToMainFile('src/locales/en.ts', moduleKeys);
addKeysToMainFile('src/locales/vi.ts', moduleKeys);

console.log('\n✅ Sync complete! Running validation...\n');

try {
  execSync('pnpm i18n:validate', { stdio: 'inherit' });
  console.log('\n🎉 MISSION COMPLETE - i18n validation PASSED!');
} catch (e) {
  console.log('\n⚠️ Still have errors\n');
}
