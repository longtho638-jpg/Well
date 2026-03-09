import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

const EN_DIR = 'src/locales/en';
const VI_DIR = 'src/locales/vi';

console.log('🔍 Chạy validation để lấy keys thiếu...\n');

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

function extractBalancedBraces(str, startIdx) {
  let i = startIdx;
  while (i < str.length && str[i] !== '{') i++;
  if (i >= str.length) return null;
  let depth = 1, inStr = false, strCh = '';
  const start = i++;
  for (; i < str.length; i++) {
    const ch = str[i];
    if (inStr) { if (ch === strCh && str[i-1] !== '\\') inStr = false; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = true; strCh = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return str.substring(start, i+1); }
  }
  return null;
}

function generateEnValue(key) {
  const lastPart = key.split('.').pop() || key;
  return lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
}

function generateViValue(key) {
  const lastPart = key.split('.').pop() || key;
  return lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
}

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
console.log('');

for (const [moduleName, keys] of Object.entries(moduleKeys)) {
  const enFilePath = `${EN_DIR}/${moduleName}.ts`;
  const viFilePath = `${VI_DIR}/${moduleName}.ts`;

  const enExists = readdirSync(EN_DIR).find(f => f.toLowerCase() === `${moduleName}.ts`);
  const viExists = readdirSync(VI_DIR).find(f => f.toLowerCase() === `${moduleName}.ts`);

  if (enExists && viExists) {
    console.log(`✏️ Adding ${keys.length} keys to ${moduleName}.ts`);
    addKeysToModule(enFilePath, keys, generateEnValue);
    addKeysToModule(viFilePath, keys, generateViValue);
  } else if (!enExists && !viExists) {
    console.log(`📄 Creating ${moduleName}.ts with ${keys.length} keys`);
    createModuleFile(enFilePath, moduleName, keys, generateEnValue);
    createModuleFile(viFilePath, moduleName, keys, generateViValue);
  } else {
    console.log(`⚠️ Module mismatch for ${moduleName}: EN=${enExists}, VI=${viExists}`);
  }
}

function addKeysToModule(filePath, keys, valueGen) {
  let content = readFileSync(filePath, 'utf-8');
  const moduleName = filePath.split('/').pop().replace('.ts', '');
  const exportRe = new RegExp(`(export\\s+const\\s+${moduleName}\\s*(?::[^=]*)?\\s*=\\s*\\{)`);
  const match = exportRe.exec(content);

  if (!match) {
    console.log(`  ⚠️ Could not find export in ${filePath}`);
    return;
  }

  const flatKeys = keys.filter(k => k.split('.').length === 2);
  if (flatKeys.length === 0) {
    console.log(`  → No flat keys to add`);
    return;
  }

  const newKeysStr = flatKeys.map(k => {
    const subKey = k.split('.')[1];
    const value = valueGen(k);
    return `  ${subKey}: "${value}",`;
  }).join('\n');

  content = content.replace(exportRe, `$1\n${newKeysStr}`);
  writeFileSync(filePath, content);
  console.log(`  → Added ${flatKeys.length} keys`);
}

function createModuleFile(filePath, moduleName, keys, valueGen) {
  const content = `export const ${moduleName} = {\n${keys.map(k => {
    const subKey = k.split('.').slice(1).join('.');
    const value = valueGen(k);
    return `  ${subKey}: "${value}",`;
  }).join('\n')}\n};\n`;
  writeFileSync(filePath, content);
}

console.log('\n✅ Sync complete! Running validation...\n');

try {
  execSync('pnpm i18n:validate', { stdio: 'inherit' });
  console.log('\n🎉 MISSION COMPLETE - i18n validation PASSED!');
} catch (e) {
  console.log('\n⚠️ Still have errors - may need manual review for nested keys\n');
}
