import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

console.log('Extracting all missing i18n keys...\n');

try {
  const output = execSync('pnpm i18n:validate 2>&1', { 
    encoding: 'utf-8', 
    maxBuffer: 100 * 1024 * 1024 
  });
  console.log('Validation PASSED!');
  process.exit(0);
} catch (e) {
  const output = e.stdout || '';
  const lines = output.split('\n');
  const missingKeys = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Match lines like "  module.key" followed by "-> Used in:"
    if (/^[a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+$/.test(line)) {
      if (lines[i + 1] && lines[i + 1].includes('-> Used in:')) {
        missingKeys.push(line);
      }
    }
  }
  
  const uniqueKeys = [...new Set(missingKeys)];
  console.log(`Found ${uniqueKeys.length} missing keys`);
  
  // Write to file
  writeFileSync('/tmp/all-missing-i18n-keys.json', JSON.stringify(uniqueKeys, null, 2));
  console.log('Written to /tmp/all-missing-i18n-keys.json\n');
  
  // Group by module
  const moduleKeys = {};
  uniqueKeys.forEach(key => {
    const mod = key.split('.')[0].toLowerCase();
    if (!moduleKeys[mod]) moduleKeys[mod] = [];
    moduleKeys[mod].push(key);
  });
  
  // Show all modules
  console.log('All missing keys by module:');
  Object.entries(moduleKeys)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([mod, keys]) => {
      console.log(`  ${mod}.ts: ${keys.length} keys`);
    });
}
