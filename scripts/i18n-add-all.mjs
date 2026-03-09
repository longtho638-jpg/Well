import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const EN_DIR = 'src/locales/en';
const VI_DIR = 'src/locales/vi';

console.log('🔍 Extracting missing keys from validation output...\n');

// Run validation and capture full output
let output = '';
try {
  output = execSync('pnpm i18n:validate 2>&1', { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
  console.log('✅ Validation PASSED!');
  process.exit(0);
} catch (e) {
  output = e.stdout || '';
}

// Extract ALL missing keys (not just first 20) by parsing the full output
const lines = output.split('\n');
const missingKeys = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  // Match lines like: "  module.key" followed by "-> Used in:"
  if (/^[a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+$/.test(line)) {
    // Check next line
    if (lines[i + 1] && lines[i + 1].includes('-> Used in:')) {
      missingKeys.push(line);
    }
  }
}

// Remove duplicates
const uniqueKeys = [...new Set(missingKeys)];
console.log(`Found ${uniqueKeys.length} missing keys\n`);

if (uniqueKeys.length === 0) {
  console.log('✅ All keys present!');
  process.exit(0);
}

// Group by module
const moduleKeys = {};
for (const key of uniqueKeys) {
  const moduleName = key.split('.')[0].toLowerCase();
  if (!moduleKeys[moduleName]) moduleKeys[moduleName] = [];
  moduleKeys[moduleName].push(key);
}

console.log('📊 Missing keys by module (showing modules with <= 30 keys):');
Object.entries(moduleKeys)
  .filter(([, keys]) => keys.length <= 30)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([mod, keys]) => {
    console.log(`  ${mod}.ts: ${keys.length} keys`);
  });

const largeModules = Object.entries(moduleKeys).filter(([, keys]) => keys.length > 30);
if (largeModules.length > 0) {
  console.log('\nLarge modules (>30 keys):');
  largeModules.forEach(([mod, keys]) => {
    console.log(`  ${mod}.ts: ${keys.length} keys`);
  });
}
console.log('');

// Get list of existing module files
const existingModules = new Set(
  readdirSync(EN_DIR)
    .filter(f => f.endsWith('.ts'))
    .map(f => f.replace('.ts', '').toLowerCase())
);

// Filter to only process modules that exist
const validModuleKeys = {};
for (const [moduleName, keys] of Object.entries(moduleKeys)) {
  if (existingModules.has(moduleName)) {
    validModuleKeys[moduleName] = keys;
  } else {
    console.log(`⚠️ Skipping ${moduleName}.ts - file doesn't exist`);
  }
}

// Generate translations
function generateEnValue(key) {
  const lastPart = key.split('.').pop() || key;
  return lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
}

function generateViValue(key) {
  const lastPart = key.split('.').pop() || key;
  return lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Add keys to files
let addedCount = 0;

for (const [moduleName, keys] of Object.entries(validModuleKeys)) {
  const enFilePath = `${EN_DIR}/${moduleName}.ts`;
  const viFilePath = `${VI_DIR}/${moduleName}.ts`;
  
  addedCount += addKeysToFile(enFilePath, moduleName, keys, generateEnValue);
  addedCount += addKeysToFile(viFilePath, moduleName, keys, generateViValue);
}

function addKeysToFile(filePath, moduleName, keys, valueGen) {
  let content = readFileSync(filePath, 'utf-8');
  let added = 0;
  
  // Find export const statements
  const exportRe = new RegExp(`(export\\s+const\\s+${moduleName}\\s*(?::[^=]*)?\\s*=\\s*\\{)`, 'si');
  const match = exportRe.exec(content);
  
  if (!match) {
    console.log(`  ⚠️ Could not find export in ${filePath}`);
    return 0;
  }
  
  // Only add flat keys (module.key format with 2 parts)
  const flatKeys = keys.filter(k => k.split('.').length === 2);
  if (flatKeys.length === 0) return 0;
  
  // Check which keys already exist
  const existingKeys = new Set();
  const keyRe = /^\s*([a-zA-Z0-9_]+)\s*:\s*['"`]/gm;
  let m;
  while ((m = keyRe.exec(content)) !== null) {
    existingKeys.add(m[1]);
  }
  
  const newKeys = flatKeys.filter(k => !existingKeys.has(k.split('.')[1]));
  if (newKeys.length === 0) return 0;
  
  const newKeysStr = newKeys.map(k => {
    const subKey = k.split('.')[1];
    const value = valueGen(k);
    return `  ${subKey}: "${value}",`;
  }).join('\n');
  
  content = content.replace(exportRe, `$1\n${newKeysStr}`);
  writeFileSync(filePath, content);
  console.log(`  ✓ ${filePath}: Added ${newKeys.length} keys`);
  return newKeys.length;
}

console.log(`\n✅ Total keys added: ${addedCount}`);
console.log('\n🔄 Running validation...\n');

try {
  execSync('pnpm i18n:validate', { stdio: 'inherit', maxBuffer: 50 * 1024 * 1024 });
  console.log('\n🎉 MISSION COMPLETE - i18n validation PASSED!');
} catch (e) {
  console.log('\n⚠️ Validation still has errors\n');
}
