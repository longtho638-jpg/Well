
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * i18n Debt Scanner
 * Scans the codebase for potential hardcoded strings that need internationalization.
 */

const SOURCE_DIR = 'src';
const IGNORE_PATTERNS = [
  '**/*.test.ts', 
  '**/*.test.tsx', 
  '**/*.d.ts', 
  'src/locales/**',
  'src/i18n.ts'
];

// Regex to find potential hardcoded text in JSX
// 1. Text between tags: >Some Text<
// 2. Placeholder attributes: placeholder="Some Text"
// 3. Title attributes: title="Some Text"
// 4. Alt attributes: alt="Some Text"
const TEXT_IN_TAGS_REGEX = />([^<{]+)</g;
const ATTRIBUTE_REGEX = /(placeholder|title|alt|label|aria-label)=\"([^"{}]+)\"/g;

async function scan() {
  console.log('🔍 Starting i18n Debt Scan...');
  
  const files = await glob(`${SOURCE_DIR}/**/*.{tsx,ts}`, { 
    ignore: IGNORE_PATTERNS,
    absolute: true 
  });

  let totalDebtCount = 0;
  let filesWithDebt = 0;

  console.log(`📂 Analyzing ${files.length} files...\n`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);
    let fileDebtCount = 0;
    const debts: string[] = [];

    // Check for text between tags
    let match;
    while ((match = TEXT_IN_TAGS_REGEX.exec(content)) !== null) {
      const text = match[1].trim();
      // Filter out empty strings, numbers, and likely code artifacts
      if (text && !/^\d+$/.test(text) && !/^["W_]+$/.test(text) && text.length > 1) {
        debts.push(`Tag Content: "${text}"`);
        fileDebtCount++;
      }
    }

    // Check for attributes
    while ((match = ATTRIBUTE_REGEX.exec(content)) !== null) {
      const attr = match[1];
      const text = match[2].trim();
      if (text && !/^\d+$/.test(text)) {
        debts.push(`Attribute [${attr}]: "${text}"`);
        fileDebtCount++;
      }
    }

    if (fileDebtCount > 0) {
      console.log(`🚩 \x1b[33m${relativePath}\x1b[0m (\x1b[31m${fileDebtCount} issues\x1b[0m)`);
      // Only show first 3 to keep output clean
      debts.slice(0, 3).forEach(d => console.log(`   - ${d}`));
      if (debts.length > 3) console.log(`   - ... and ${debts.length - 3} more`);
      console.log('');
      
      totalDebtCount += fileDebtCount;
      filesWithDebt++;
    }
  }

  console.log('='.repeat(50));
  console.log('📊 \x1b[1mSCAN REPORT\x1b[0m');
  console.log('='.repeat(50));
  if (totalDebtCount === 0) {
    console.log('✅ \x1b[32mWOW! Zero i18n Technical Debt Found! Outstanding!\x1b[0m');
  } else {
    console.log(`⚠️  Found \x1b[31m${totalDebtCount}\x1b[0m potential hardcoded strings`);
    console.log(`📂 Across \x1b[33m${filesWithDebt}\x1b[0m files`);
    console.log('💡 Recommendation: Run "npm run i18n:fix" (Plan) to resolve these.');
  }
}

scan().catch(console.error);
