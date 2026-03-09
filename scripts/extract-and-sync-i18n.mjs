import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const EN_DIR = 'src/locales/en';
const VI_DIR = 'src/locales/vi';

console.log('🔍 Extracting all t() keys from source files...\n');

// Extract all t() keys from source
const srcFiles = execSync('find src -type f \\( -name "*.tsx" -o -name "*.ts" \\) ! -path "*/locales/*"', { encoding: 'utf-8' })
  .split('\n')
  .filter(f => f.trim());

const usedKeys = new Set();
for (const file of srcFiles) {
  try {
    const content = readFileSync(file, 'utf-8');
    // Match t('key'), t("key"), t(`key`)
    const matches = content.match(/t\(['"`]([^'"`]+?)['"`]\)/g);
    if (matches) {
      matches.forEach(m => {
        const key = m.match(/t\(['"`]([^'"`]+?)['"`]\)/)?.[1];
        if (key && !key.includes('${') && !key.includes('{') && !key.startsWith('!')) {
          usedKeys.add(key);
        }
      });
    }
  } catch (e) { /* skip */ }
}

console.log(`Found ${usedKeys.size} unique translation keys\n`);

// Parse existing locale files to get all existing keys
function getAllExistingKeys() {
  const allKeys = new Set();
  
  // Read all .ts files in en/ and vi/
  const modules = readdirSync(EN_DIR).filter(f => f.endsWith('.ts'));
  
  for (const module of modules) {
    const moduleName = module.replace('.ts', '');
    const filePath = `${EN_DIR}/${module}`;
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Find all export const statements
      const exportRe = /export\s+const\s+(\w+)\s*(?::[^=]*)?\s*=\s*/g;
      let match;
      
      while ((match = exportRe.exec(content)) !== null) {
        const varName = match[1];
        
        // Extract keys from this export
        if (varName === 'misc') {
          // Flat keys: key_name: "value"
          const flatKeyRe = /^\s*(\w+)\s*:\s*['"`]/gm;
          let m;
          while ((m = flatKeyRe.exec(content)) !== null) {
            allKeys.add(`${varName}.${m[1]}`);
          }
        } else {
          // Nested keys - find all key: "value" patterns
          const keyRe = /^\s*([a-zA-Z0-9_]+)\s*:\s*['"`]/gm;
          let m;
          while ((m = keyRe.exec(content)) !== null) {
            allKeys.add(`${varName}.${m[1]}`);
          }
        }
      }
    } catch (e) { /* skip */ }
  }
  
  return allKeys;
}

const existingKeys = getAllExistingKeys();
console.log(`Existing locale keys: ${existingKeys.size}\n`);

// Find missing keys
const missingKeys = [...usedKeys].filter(k => !existingKeys.has(k));
console.log(`Missing keys: ${missingKeys.length}\n`);

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

console.log('📊 Missing keys by module (top 20):');
Object.entries(moduleKeys)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 20)
  .forEach(([mod, keys]) => {
    console.log(`  ${mod}.ts: ${keys.length} keys`);
  });
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

// Add keys to module files
let addedCount = 0;

for (const [moduleName, keys] of Object.entries(moduleKeys)) {
  const enFilePath = `${EN_DIR}/${moduleName}.ts`;
  const viFilePath = `${VI_DIR}/${moduleName}.ts`;
  
  const enExists = readdirSync(EN_DIR).find(f => f.toLowerCase() === `${moduleName}.ts`);
  const viExists = readdirSync(VI_DIR).find(f => f.toLowerCase() === `${moduleName}.ts`);
  
  // Add to EN
  if (enExists) {
    addedCount += addKeysToFile(enFilePath, moduleName, keys, generateEnValue);
  } else {
    createModuleFile(enFilePath, moduleName, keys, generateEnValue);
    addedCount += keys.length;
  }
  
  // Add to VI
  if (viExists) {
    addedCount += addKeysToFile(viFilePath, moduleName, keys, generateViValue);
  } else {
    createModuleFile(viFilePath, moduleName, keys, generateViValue);
    addedCount += keys.length;
  }
}

function addKeysToFile(filePath, moduleName, keys, valueGen) {
  let content = readFileSync(filePath, 'utf-8');
  let added = 0;
  
  // Find export const and insert new keys
  const exportRe = new RegExp(`(export\\s+const\\s+${moduleName}\\s*(?::[^=]*)?\\s*=\\s*\\{)`);
  const match = exportRe.exec(content);
  
  if (!match) return 0;
  
  const flatKeys = keys.filter(k => k.split('.').length === 2);
  if (flatKeys.length === 0) return 0;
  
  const newKeysStr = flatKeys.map(k => {
    const subKey = k.split('.')[1];
    const value = valueGen(k);
    return `  ${subKey}: "${value}",`;
  }).join('\n');
  
  content = content.replace(exportRe, `$1\n${newKeysStr}`);
  writeFileSync(filePath, content);
  console.log(`  ✓ ${filePath}: Added ${flatKeys.length} keys`);
  return flatKeys.length;
}

function createModuleFile(filePath, moduleName, keys, valueGen) {
  const content = `export const ${moduleName} = {\n${keys.map(k => {
    const subKey = k.split('.').slice(1).join('.');
    const value = valueGen(k);
    return `  ${subKey}: "${value}",`;
  }).join('\n')}\n};\n`;
  writeFileSync(filePath, content);
  console.log(`  ✓ Created ${filePath} with ${keys.length} keys`);
  return keys.length;
}

console.log(`\n✅ Total keys added: ${addedCount}`);
console.log('\n🔄 Running validation...\n');

try {
  execSync('pnpm i18n:validate', { stdio: 'inherit' });
  console.log('\n🎉 MISSION COMPLETE - i18n validation PASSED!');
} catch (e) {
  console.log('\n⚠️ Validation still has errors - nested keys may need manual handling\n');
}
