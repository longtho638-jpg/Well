/**
 * i18n Auto-Add Missing Keys - Handle nested structures and numeric keys
 */

import * as fs from 'fs';
import * as path from 'path';

const VI_DIR = 'src/locales/vi';
const EN_DIR = 'src/locales/en';

function extractKeysFromContent(content: string): string[] {
  const tFunctionPattern = /\bt\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g;
  const keys: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tFunctionPattern.exec(content)) !== null) {
    const key = match[2];
    if (!key.includes('${')) keys.push(key);
  }
  return keys;
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

function setNestedValue(obj: Record<string, unknown>, keyPath: string, value: string): void {
  const parts = keyPath.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const safeKey = /^\d/.test(part) ? `_${part}` : part;
    if (!(safeKey in current) || typeof current[safeKey] !== 'object') {
      current[safeKey] = {};
    }
    current = current[safeKey] as Record<string, unknown>;
  }
  const lastPart = parts[parts.length - 1];
  const safeLast = /^\d/.test(lastPart) ? `_${lastPart}` : lastPart;
  current[safeLast] = value;
}

function serializeNested(obj: Record<string, unknown>, indent = 2): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(`${' '.repeat(indent)}${key}: {`);
      lines.push(serializeNested(value, indent + 2));
      lines.push(`${' '.repeat(indent)}},`);
    } else if (typeof value === 'string') {
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      lines.push(`${' '.repeat(indent)}${key}: "${escaped}",`);
    }
  }
  return lines.join('\n');
}

function parseExistingFile(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const exportMatch = content.match(/export const (\w+) = (\{[\s\S]*?\n\});/);
  if (!exportMatch) return {};
  return parseObject(exportMatch[2]);
}

function parseObject(objStr: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const inner = objStr.slice(1, -1).trim();
  if (!inner) return result;

  let i = 0;
  while (i < inner.length) {
    while (i < inner.length && /[\s,]/.test(inner[i])) i++;
    if (i >= inner.length) break;

    // Read key (handle quoted keys for numeric prefixes)
    let key = '';
    if (inner[i] === '"' || inner[i] === "'") {
      const q = inner[i++];
      while (i < inner.length && inner[i] !== q) {
        if (inner[i] === '\\') i++;
        key += inner[i++];
      }
      i++;
    } else if (/[\w$]/.test(inner[i])) {
      while (i < inner.length && /[\w$]/.test(inner[i])) key += inner[i++];
    } else { i++; continue; }

    if (!key) continue;
    while (i < inner.length && /\s/.test(inner[i])) i++;
    if (i >= inner.length || inner[i] !== ':') continue;
    i++;
    while (i < inner.length && /\s/.test(inner[i])) i++;

    // Read value
    if (inner[i] === '{') {
      const nested = extractBraces(inner, i);
      if (nested) {
        result[key] = parseObject(nested);
        i += nested.length;
      }
    } else if (inner[i] === '"' || inner[i] === "'") {
      const q = inner[i++];
      let val = '';
      while (i < inner.length && inner[i] !== q) {
        if (inner[i] === '\\') { i++; val += inner[i] === 'n' ? '\n' : inner[i]; }
        else val += inner[i];
        i++;
      }
      i++;
      result[key] = val;
    } else {
      let val = '';
      while (i < inner.length && inner[i] !== ',' && inner[i] !== '}') val += inner[i++];
      result[key] = val.trim().replace(/^['"]|['"]$/g, '');
    }
    while (i < inner.length && /[\s,]/.test(inner[i])) i++;
  }
  return result;
}

function extractBraces(str: string, start: number): string | null {
  let depth = 1, i = start + 1, inStr = false, strCh = '';
  while (i < str.length && depth > 0) {
    const ch = str[i];
    if (inStr) { if (ch === strCh && str[i-1] !== '\\') inStr = false; }
    else if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; }
    else if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return depth === 0 ? str.substring(start, i) : null;
}

function keyToText(key: string): string {
  return key.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function main() {
  const files = findSourceFiles('src');
  const allKeys = new Set<string>();
  files.forEach(f => extractKeysFromContent(fs.readFileSync(f, 'utf-8')).forEach(k => allKeys.add(k)));

  const keysByModule: Record<string, Set<string>> = {};
  allKeys.forEach(key => {
    const parts = key.split('.');
    const moduleName = parts[0];
    if (!keysByModule[moduleName]) keysByModule[moduleName] = new Set();
    keysByModule[moduleName].add(parts.slice(1).join('.'));
  });

  let totalAdded = 0;
  for (const [moduleName, subKeys] of Object.entries(keysByModule)) {
    const viPath = path.join(VI_DIR, `${moduleName}.ts`);
    const enPath = path.join(EN_DIR, `${moduleName}.ts`);
    if (!fs.existsSync(viPath) && !fs.existsSync(enPath)) {
      process.stderr.write(`⚠️  Skipping ${moduleName} - no locale files\n`);
      continue;
    }

    const viData = parseExistingFile(viPath);
    const enData = parseExistingFile(enPath);
    const hasVi = fs.existsSync(viPath);
    const hasEn = fs.existsSync(enPath);

    let addedVi = 0, addedEn = 0;
    subKeys.forEach(subKey => {
      const safeKey = /^\d/.test(subKey.split('.')[0]) ? `_${subKey}` : subKey;
      const viText = keyToText(subKey.replace(/\./g, ' '));
      if (!hasNestedKey(viData, subKey)) {
        setNestedValue(viData, subKey, viText);
        addedVi++;
      }
      if (!hasNestedKey(enData, subKey)) {
        setNestedValue(enData, subKey, viText);
        addedEn++;
      }
    });

    if (addedVi > 0 && hasVi) {
      fs.writeFileSync(viPath, `export const ${moduleName} = {\n${serializeNested(viData)}\n};\n`);
      process.stderr.write(`✅ ${moduleName}.ts (vi): +${addedVi}\n`);
    }
    if (addedEn > 0 && hasEn) {
      fs.writeFileSync(enPath, `export const ${moduleName} = {\n${serializeNested(enData)}\n};\n`);
      process.stderr.write(`✅ ${moduleName}.ts (en): +${addedEn}\n`);
    }
    totalAdded += addedVi + addedEn;
  }
  process.stderr.write(`\n📊 Total: +${totalAdded}\n`);
}

function hasNestedKey(obj: Record<string, unknown>, keyPath: string): boolean {
  const parts = keyPath.split('.');
  let current: Record<string, unknown> = obj;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return false;
    if (!(part in current)) return false;
    current = current[part] as Record<string, unknown>;
  }
  return true;
}

main();
