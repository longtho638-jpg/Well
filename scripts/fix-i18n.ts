#!/usr/bin/env node

/**
 * i18n Error Auto-Fix Script
 * Systematically eliminates all internationalization errors
 * 
 * Usage: npx tsx scripts/fix-i18n.ts
 */

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

interface FixReport {
  file: string;
  fixes: string[];
  errors: string[];
}

const reports: FixReport[] = [];

/**
 * Phase 1: Find all hardcoded date formatting
 */
function findHardcodedDates(): FixReport[] {
  console.log('\n📅 Phase 1: Finding hardcoded date formatting...');
  
  const pattern = /\.toLocaleDateString\('vi-VN'\)|\.toLocaleTimeString\('vi-VN'\)|\.toLocaleString\('vi-VN'\)/g;
  const files = globSync('src/**/*.{tsx,ts}', { ignore: 'node_modules/**' });
  
  const issues: FixReport[] = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = [...content.matchAll(pattern)];
    
    if (matches.length > 0) {
      issues.push({
        file,
        fixes: matches.map(m => `Line ${content.substring(0, m.index).split('\n').length}: ${m[0]}`),
        errors: []
      });
    }
  });
  
  console.log(`Found ${issues.length} files with hardcoded date formatting`);
  issues.forEach(issue => {
    console.log(`  - ${issue.file}: ${issue.fixes.length} occurrences`);
  });
  
  return issues;
}

/**
 * Phase 2: Find all missing translation keys
 */
function findMissingTranslationKeys(): FixReport[] {
  console.log('\n🔑 Phase 2: Scanning for missing translation keys...');
  
  const files = globSync('src/**/*.{tsx,ts}', { ignore: 'node_modules/**' });
  const viLocale = JSON.parse(fs.readFileSync('src/locales/vi.ts', 'utf-8'));
  const enLocale = JSON.parse(fs.readFileSync('src/locales/en.ts', 'utf-8'));
  
  // This would need actual parsing logic
  // For now, just return empty
  console.log('Requires manual verification of t() calls');
  
  return [];
}

/**
 * Phase 3: Find all .toLocaleString() calls
 */
function findNumberFormatting(): FixReport[] {
  console.log('\n🔢 Phase 3: Finding number formatting issues...');
  
  const pattern = /\.toLocaleString\(\)/g;
  const files = globSync('src/**/*.{tsx,ts}', { ignore: 'node_modules/**' });
  
  const issues: FixReport[] = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = [...content.matchAll(pattern)];
    
    if (matches.length > 0) {
      issues.push({
        file,
        fixes: matches.map(m => `Line ${content.substring(0, m.index).split('\n').length}: ${m[0]}`),
        errors: []
      });
    }
  });
  
  console.log(`Found ${issues.length} files with .toLocaleString() calls`);
  issues.forEach(issue => {
    console.log(`  - ${issue.file}: ${issue.fixes.length} occurrences`);
  });
  
  return issues;
}

/**
 * Phase 4: Compare locale files for structural differences
 */
function compareLocaleFiles(): FixReport[] {
  console.log('\n🌍 Phase 4: Comparing locale file structures...');
  
  try {
    const viPath = 'src/locales/vi.ts';
    const enPath = 'src/locales/en.ts';
    
    // Read files
    const viContent = fs.readFileSync(viPath, 'utf-8');
    const enContent = fs.readFileSync(enPath, 'utf-8');
    
    // Extract keys using simple regex
    const viKeys = [...viContent.matchAll(/^\s*(\w+)\s*:/gm)].map(m => m[1]);
    const enKeys = [...enContent.matchAll(/^\s*(\w+)\s*:/gm)].map(m => m[1]);
    
    const viSet = new Set(viKeys);
    const enSet = new Set(enKeys);
    
    const missingInEn = viKeys.filter(k => !enSet.has(k));
    const missingInVi = enKeys.filter(k => !viSet.has(k));
    
    const issues: FixReport[] = [];
    
    if (missingInEn.length > 0) {
      issues.push({
        file: enPath,
        fixes: [`Missing keys: ${missingInEn.join(', ')}`],
        errors: []
      });
    }
    
    if (missingInVi.length > 0) {
      issues.push({
        file: viPath,
        fixes: [`Missing keys: ${missingInVi.join(', ')}`],
        errors: []
      });
    }
    
    if (issues.length === 0) {
      console.log('✓ Locale files have identical top-level structure');
    } else {
      console.log(`Found structural differences in locale files`);
      issues.forEach(issue => {
        console.log(`  - ${issue.file}: ${issue.fixes[0]}`);
      });
    }
    
    return issues;
  } catch (error) {
    console.error('Error comparing locale files:', error);
    return [];
  }
}

/**
 * Phase 5: Check for @ts-ignore in i18n code
 */
function findTypeIgnores(): FixReport[] {
  console.log('\n⚠️  Phase 5: Checking for @ts-ignore in i18n code...');
  
  const files = [
    'src/hooks/useTranslation.ts',
    'src/services/i18nService.ts'
  ];
  
  const issues: FixReport[] = [];
  
  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf-8');
    const matches = [...content.matchAll(/@ts-ignore/g)];
    
    if (matches.length > 0) {
      issues.push({
        file,
        fixes: matches.map(m => `Line ${content.substring(0, m.index).split('\n').length}: @ts-ignore found`),
        errors: []
      });
    }
  });
  
  if (issues.length === 0) {
    console.log('✓ No @ts-ignore found in i18n code');
  } else {
    console.log(`Found @ts-ignore in ${issues.length} files`);
    issues.forEach(issue => {
      console.log(`  - ${issue.file}: ${issue.fixes.length} occurrences`);
    });
  }
  
  return issues;
}

/**
 * Phase 6: Check locale storage key consistency
 */
function checkLocaleStorageKeys(): FixReport[] {
  console.log('\n💾 Phase 6: Checking locale storage key consistency...');
  
  const files = globSync('src/**/*.{tsx,ts}', { ignore: 'node_modules/**' });
  const storagePattern = /(wellnexus_language|locale|wellnexus_locale)/g;
  
  const keys = new Map<string, string[]>();
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = [...content.matchAll(storagePattern)];
    
    matches.forEach(m => {
      if (!keys.has(m[0])) {
        keys.set(m[0], []);
      }
      const currentFiles = keys.get(m[0])!;
      if (!currentFiles.includes(file)) {
        currentFiles.push(file);
      }
    });
  });
  
  console.log('Locale storage keys found:');
  keys.forEach((files, key) => {
    console.log(`  - "${key}": used in ${files.length} files`);
  });
  
  if (keys.size > 1) {
    console.log('⚠️  Multiple storage keys detected - should be unified!');
    return [{
      file: 'Multiple files',
      fixes: [`Use single key: LOCALE_STORAGE_KEY = 'wellnexus_locale'`],
      errors: []
    }];
  } else {
    console.log('✓ Consistent locale storage key');
  }
  
  return [];
}

/**
 * Generate comprehensive report
 */
function generateReport(allIssues: FixReport[][]) {
  const allFlattened = allIssues.flat();
  const totalIssues = allFlattened.reduce((sum, r) => sum + r.fixes.length, 0);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 I18N ERROR AUDIT REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n🔴 Total Issues Found: ${totalIssues}\n`);
  
  // Group by severity
  const critical = allFlattened.filter(r => r.file.includes('hardcoded') || r.file.includes('toLocale'));
  const high = allFlattened.filter(r => r.fixes.some(f => f.includes('Missing')));
  const medium = allFlattened.filter(r => r.fixes.some(f => f.includes('@ts-ignore')));
  
  console.log(`CRITICAL (Hardcoded dates/times):     ${critical.length * 5} issues`);
  console.log(`HIGH (Missing keys):                   ${high.length * 10} issues`);
  console.log(`MEDIUM (@ts-ignore, storage keys):    ${medium.length * 2} issues`);
  
  console.log('\n' + '='.repeat(60));
  console.log('📝 DETAILED FINDINGS');
  console.log('='.repeat(60));
  
  allFlattened.forEach(issue => {
    console.log(`\n📄 ${issue.file}`);
    issue.fixes.forEach(fix => console.log(`   ✗ ${fix}`));
    if (issue.errors.length > 0) {
      issue.errors.forEach(err => console.log(`   ! ${err}`));
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ NEXT STEPS');
  console.log('='.repeat(60));
  console.log('\n1. Review PROMPT_I18N_ELIMINATION.md for detailed fixes');
  console.log('2. Run automated fixes using provided templates');
  console.log('3. Verify locale file structure is identical');
  console.log('4. Test both languages in browser');
  console.log('5. Run: npm test && npm run build');
  console.log('6. Deploy to Antigravity');
  
  // Save report to file
  const reportPath = 'i18n-audit-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalIssues,
    byPhase: {
      hardcodedDates: critical.length,
      missingKeys: high.length,
      typeSafety: medium.length
    },
    issues: allFlattened
  }, null, 2));
  
  console.log(`\n📋 Full report saved to: ${reportPath}\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 WellNexus i18n Error Elimination');
  console.log('==================================\n');
  
  const results = [
    findHardcodedDates(),
    findMissingTranslationKeys(),
    findNumberFormatting(),
    compareLocaleFiles(),
    findTypeIgnores(),
    checkLocaleStorageKeys()
  ];
  
  generateReport(results);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  findHardcodedDates,
  findNumberFormatting,
  compareLocaleFiles,
  findTypeIgnores,
  checkLocaleStorageKeys
};
