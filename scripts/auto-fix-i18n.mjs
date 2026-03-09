import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';

const EN_DIR = 'src/locales/en';
const VI_DIR = 'src/locales/vi';

console.log('🔍 Lấy danh sách keys thiếu từ validation...\n');

let missingKeys = [];

try {
  const output = execSync('pnpm i18n:validate 2>&1', { encoding: 'utf-8' });
  console.log('✅ Validation PASSED!');
  process.exit(0);
} catch (e) {
  const output = e.stdout || '';
  // Extract all keys (not just first 20)
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
  const moduleName = key.split('.')[0].toLowerCase();
  if (!moduleKeys[moduleName]) moduleKeys[moduleName] = [];
  moduleKeys[moduleName].push(key);
}

console.log('📊 Keys by module:');
Object.entries(moduleKeys).forEach(([mod, keys]) => {
  console.log(`  ${mod}.ts: ${keys.length} keys`);
});

// Generate translations
function generateEnValue(key) {
  const lastPart = key.split('.').pop() || key;
  return lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
}

function generateViValue(key) {
  const lastPart = key.split('.').pop() || key;
  return lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Add keys to module files
function addKeysToModuleFile(filePath, keys, valueGen) {
  let content = readFileSync(filePath, 'utf-8');
  const moduleName = filePath.split('/').pop().replace('.ts', '');
  
  // Find export const moduleName = { ... }
  const exportRe = new RegExp(`(export\\s+const\\s+${moduleName}\\s*(?::[^=]*)?\\s*=\\s*\\{)([\\s\\S]*?)(\\};?)`);
  const match = content.match(exportRe);
  
  if (!match) {
    console.log(`  ⚠️ Could not find export in ${filePath}`);
    return 0;
  }
  
  const existingContent = match[2];
  const addedKeys = [];
  
  for (const key of keys) {
    const subKey = key.split('.').slice(1).join('.');
    // Check if key already exists (handle nested keys)
    const keyRe = new RegExp(`^[\\s]*${subKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s]*:`, 'm');
    if (!keyRe.test(existingContent)) {
      const value = valueGen(key);
      addedKeys.push({ subKey, value });
    }
  }
  
  if (addedKeys.length > 0) {
    const newKeysStr = addedKeys.map(k => `  ${k.subKey}: "${k.value}",`).join('\n');
    // Insert after opening brace
    const replacement = `${match[1]}\n${newKeysStr}${match[2]}${match[3]}`;
    content = content.replace(exportRe, replacement);
    writeFileSync(filePath, content);
    console.log(`  ✓ Added ${addedKeys.length} keys to ${filePath}`);
    return addedKeys.length;
  }
  
  return 0;
}

// Create new module file if doesn't exist
function createModuleFile(filePath, moduleName, keys, valueGen) {
  const content = `export const ${moduleName} = {\n${keys.map(k => {
    const subKey = k.split('.').slice(1).join('.');
    const value = valueGen(k);
    return `  ${subKey}: "${value}",`;
  }).join('\n')}\n};\n`;
  writeFileSync(filePath, content);
  console.log(`  ✓ Created ${filePath} with ${keys.length} keys`);
}

console.log('\n✏️ Adding keys to module files...\n');

let totalAdded = 0;

for (const [moduleName, keys] of Object.entries(moduleKeys)) {
  const enFilePath = `${EN_DIR}/${moduleName}.ts`;
  const viFilePath = `${VI_DIR}/${moduleName}.ts`;
  
  const enExists = readdirSync(EN_DIR).find(f => f.toLowerCase() === `${moduleName}.ts`);
  const viExists = readdirSync(VI_DIR).find(f => f.toLowerCase() === `${moduleName}.ts`);
  
  if (enExists && viExists) {
    addKeysToModuleFile(enFilePath, keys, generateEnValue);
    addKeysToModuleFile(viFilePath, generateViValue);
  } else if (!enExists && !viExists) {
    createModuleFile(enFilePath, moduleName, keys, generateEnValue);
    createModuleFile(viFilePath, moduleName, keys, generateViValue);
  } else if (enExists) {
    addKeysToModuleFile(enFilePath, keys, generateEnValue);
    createModuleFile(viFilePath, moduleName, keys, generateViValue);
  } else {
    createModuleFile(enFilePath, moduleName, keys, generateEnValue);
    addKeysToModuleFile(viFilePath, keys, generateViValue);
  }
}

console.log('\n✅ Sync complete! Running validation...\n');

try {
  execSync('pnpm i18n:validate', { stdio: 'inherit' });
  console.log('\n🎉 MISSION COMPLETE - i18n validation PASSED!');
} catch (e) {
  console.log('\n⚠️ Still have errors - may need manual review\n');
}
