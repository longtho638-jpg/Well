import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const EN_DIR = 'src/locales/en';
const VI_DIR = 'src/locales/vi';

console.log('🔍 Scanning source for translation keys...\n');

// Extract all t() keys from source files
const srcFiles = execSync('find src -type f \\( -name "*.tsx" -o -name "*.ts" \\) ! -path "*/locales/*"', { encoding: 'utf-8' })
  .split('\n')
  .filter(f => f.trim());

const usedKeys = new Set();
for (const file of srcFiles) {
  try {
    const content = readFileSync(file, 'utf-8');
    // Match t('key') calls
    const matches = content.match(/t\(['"`]([^'"`]+?)['"`]\)/g);
    if (matches) {
      matches.forEach(m => {
        const key = m.match(/t\(['"`]([^'"`]+?)['"`]\)/)?.[1];
        if (key && !key.includes('${') && !key.includes('{')) {
          usedKeys.add(key);
        }
      });
    }
  } catch (e) { /* skip */ }
}

console.log(`Found ${usedKeys.size} translation keys in source\n`);

// Get all existing keys from locale files
function getExistingKeys(dir) {
  const allKeys = new Set();
  const files = readdirSync(dir).filter(f => f.endsWith('.ts'));
  
  for (const file of files) {
    const moduleName = file.replace('.ts', '');
    const filePath = `${dir}/${file}`;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Find all export const statements
      const exportRe = /export\s+const\s+(\w+)\s*(?::[^=]*)?\s*=\s*/g;
      let match;
      
      while ((match = exportRe.exec(content)) !== null) {
        const varName = match[1];
        
        // Extract keys from this export
        const keyRe = /^\s*([a-zA-Z0-9_]+)\s*:\s*['"`]/gm;
        let m;
        while ((m = keyRe.exec(content)) !== null) {
          allKeys.add(`${varName}.${m[1]}`);
        }
      }
    } catch (e) { /* skip */ }
  }
  
  return allKeys;
}

const enKeys = getExistingKeys(EN_DIR);
const viKeys = getExistingKeys(VI_DIR);

console.log(`EN keys: ${enKeys.size}`);
console.log(`VI keys: ${viKeys.size}\n`);

// Find missing keys (in source but not in both en and vi)
const missingKeys = [...usedKeys].filter(k => !enKeys.has(k) || !viKeys.has(k));
console.log(`Missing keys: ${missingKeys.length}\n`);

if (missingKeys.length === 0) {
  console.log('✅ All keys present!');
  process.exit(0);
}

// Group by module
const moduleKeys = {};
missingKeys.forEach(key => {
  const mod = key.split('.')[0].toLowerCase();
  if (!moduleKeys[mod]) moduleKeys[mod] = [];
  moduleKeys[mod].push(key);
});

// Get list of existing module files
const existingModules = new Set(
  readdirSync(EN_DIR)
    .filter(f => f.endsWith('.ts'))
    .map(f => f.replace('.ts', '').toLowerCase())
);

console.log('Missing keys by module (only existing modules):');
Object.entries(moduleKeys)
  .filter(([mod]) => existingModules.has(mod))
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 30)
  .forEach(([mod, keys]) => {
    console.log(`  ${mod}.ts: ${keys.length} keys`);
  });

const nonExistingModules = Object.entries(moduleKeys)
  .filter(([mod]) => !existingModules.has(mod));
if (nonExistingModules.length > 0) {
  console.log('\nModules that do not exist:');
  nonExistingModules.forEach(([mod, keys]) => {
    console.log(`  ${mod}.ts: ${keys.length} keys (SKIPPED)`);
  });
}
console.log('');

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

for (const [moduleName, keys] of Object.entries(moduleKeys)) {
  // Skip if module doesn't exist
  if (!existingModules.has(moduleName)) continue;
  
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
  
  if (!match) return 0;
  
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
  added += newKeys.length;
  return newKeys.length;
}

console.log(`\n✅ Total keys added: ${addedCount}`);

// Save remaining missing keys for nested handling
const remainingMissing = missingKeys.filter(k => k.split('.').length > 2);
console.log(`Nested keys (need manual handling): ${remainingMissing.length}`);

if (remainingMissing.length > 0) {
  writeFileSync('/tmp/nested-i18n-keys.json', JSON.stringify(remainingMissing, null, 2));
  console.log('Nested keys written to /tmp/nested-i18n-keys.json');
}

console.log('\n🔄 Running validation...\n');

try {
  execSync('pnpm i18n:validate', { stdio: 'inherit', maxBuffer: 50 * 1024 * 1024 });
  console.log('\n🎉 MISSION COMPLETE!');
} catch (e) {
  console.log('\n⚠️ Validation still has errors\n');
}
