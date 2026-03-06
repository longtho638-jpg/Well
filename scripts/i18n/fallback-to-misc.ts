/**
 * i18n Fallback to misc.ts - Move orphan keys (no locale file) into misc.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const VI_MISC = 'src/locales/vi/misc.ts';
const EN_MISC = 'src/locales/en/misc.ts';

// Known locale files that exist
const KNOWN_MODULES = new Set([
  'achievementgrid', 'admin', 'agent', 'app', 'auth',
  'commissionwallet', 'common', 'copilot', 'copilotcoaching',
  'copilotheader', 'copilotmessageitem', 'copilotsuggestions',
  'dailyquesthub', 'dashboard', 'errorboundary', 'health',
  'health-check', 'healthcheck', 'herocard', 'liveActivities',
  'liveactivitiesticker', 'marketing', 'marketplace', 'misc',
  'network', 'quickactionscard', 'raas', 'recentactivitylist',
  'referral', 'revenuebreakdown', 'revenuechart',
  'revenueprogresswidget', 'statsgrid', 'team', 'topproducts',
  'valuationcard', 'wallet',
]);

function extractKeysFromContent(content: string): string[] {
  const tFunctionPattern = /\bt\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g;
  const keys: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tFunctionPattern.exec(content)) !== null) {
    const key = match[2];
    if (!key.includes('${')) keys.push(key);
  }
  return [...new Set(keys)];
}

function findSourceFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'locales') continue;
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) findSourceFiles(fullPath, files);
    else if (/\.(tsx?|jsx?)$/.test(entry)) files.push(fullPath);
  }
  return files;
}

function parseMiscFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(\w+):\s*['"`](.*?)['"`],?\s*$/);
    if (match) result[match[1]] = match[2];
  }
  return result;
}

function generateMiscFile(data: Record<string, string>): string {
  const sortedKeys = Object.keys(data).sort();
  const lines = sortedKeys.map(key => `  ${key}: "${data[key].replace(/"/g, '\\"')}",`);
  return `export const misc = {\n${lines.join('\n')}\n};\n`;
}

function keyToText(key: string): string {
  return key.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function textToVi(text: string): string {
  return `[VI:${text}]`;
}

function main() {
  const files = findSourceFiles('src');
  const allKeys = new Set<string>();
  files.forEach(f => extractKeysFromContent(fs.readFileSync(f, 'utf-8')).forEach(k => allKeys.add(k)));

  // Find orphan keys (modules not in KNOWN_MODULES)
  const orphanKeys: string[] = [];
  allKeys.forEach(key => {
    const moduleName = key.split('.')[0];
    if (!KNOWN_MODULES.has(moduleName)) orphanKeys.push(key);
  });

  process.stderr.write(`Found ${orphanKeys.length} orphan keys\n`);

  const viMisc = parseMiscFile(VI_MISC);
  const enMisc = parseMiscFile(EN_MISC);

  let addedVi = 0, addedEn = 0;
  orphanKeys.forEach(fullKey => {
    const miscKey = fullKey.replace(/\./g, '_');
    if (!(miscKey in viMisc)) {
      viMisc[miscKey] = textToVi(keyToText(fullKey.replace(/\./g, ' ')));
      addedVi++;
    }
    if (!(miscKey in enMisc)) {
      enMisc[miscKey] = keyToText(fullKey.replace(/\./g, ' '));
      addedEn++;
    }
  });

  fs.writeFileSync(VI_MISC, generateMiscFile(viMisc));
  fs.writeFileSync(EN_MISC, generateMiscFile(enMisc));

  process.stderr.write(`✅ vi/misc.ts: +${addedVi}\n`);
  process.stderr.write(`✅ en/misc.ts: +${addedEn}\n`);
}

main();
