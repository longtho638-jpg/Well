import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🔍 Extracting all missing keys...\n');

try {
  execSync('pnpm i18n:validate 2>&1 > /tmp/i18n-validate-output.txt', { encoding: 'utf-8' });
  console.log('✅ Validation PASSED!');
  process.exit(0);
} catch (e) {
  const output = e.stdout || '';
  writeFileSync('/tmp/i18n-validate-output.txt', output);
  
  // Extract all keys
  const keyMatches = output.match(/^\s+([a-zA-Z0-9_.]+)\n\s+-> Used in:/gm);
  if (keyMatches) {
    const keys = keyMatches.map(m => m.match(/^\s+([a-zA-Z0-9_.]+)/)?.[1]).filter(Boolean);
    console.log(`Found ${keys.length} missing keys (first batch)\n`);
    
    // Write to file
    writeFileSync('/tmp/missing-keys.json', JSON.stringify(keys, null, 2));
    console.log('Keys written to /tmp/missing-keys.json');
  } else {
    console.log('No keys found in output');
  }
}
