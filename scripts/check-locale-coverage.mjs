import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let ts;
try {
  ts = require('typescript');
} catch {
  try {
    ts = require(join(process.cwd(), 'node_modules', 'typescript'));
  } catch {
    ts = null;
  }
}

/**
 * Parse TypeScript locale file and extract all dot-notation keys.
 * Primary: TypeScript compiler API. Fallback: regex-based parsing.
 */
function parseLocaleFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  if (!ts) {
    return parseLocaleFileRegex(content, filePath);
  }

  return parseLocaleFileTS(content, filePath);
}

// ─── TypeScript Compiler API Parser ───────────────────────────────────────────

function parseLocaleFileTS(content, filePath) {
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  let localeData = {};
  const imports = {};

  sourceFile.statements.forEach(node => {
    if (ts.isImportDeclaration(node)) {
      const modulePath = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
      if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        node.importClause.namedBindings.elements.forEach(el => {
          imports[el.name.getText(sourceFile)] = { path: modulePath };
        });
      }
      if (node.importClause?.name) {
        imports[node.importClause.name.getText(sourceFile)] = { path: modulePath, isDefault: true };
      }
    }
  });

  function parseObjLiteral(node, source) {
    const obj = {};
    node.properties.forEach(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText(source).replace(/['"]/g, '');
        if (ts.isObjectLiteralExpression(prop.initializer)) {
          obj[key] = parseObjLiteral(prop.initializer, source);
        } else {
          obj[key] = 'VALUE';
        }
      } else if (ts.isSpreadAssignment(prop)) {
        const name = prop.expression.getText(source);
        if (imports[name]) {
          let fullPath = join(dirname(filePath), imports[name].path);
          if (!fullPath.endsWith('.ts')) fullPath += '.ts';
          try {
            const sub = readFileSync(fullPath, 'utf-8');
            const subSource = ts.createSourceFile(fullPath, sub, ts.ScriptTarget.Latest, true);
            ts.forEachChild(subSource, child => {
              if (ts.isVariableStatement(child)) {
                child.declarationList.declarations.forEach(decl => {
                  if (decl.name.getText(subSource) === name && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
                    Object.assign(obj, parseObjLiteral(decl.initializer, subSource));
                  }
                });
              }
            });
          } catch { /* skip unresolvable */ }
        }
      }
    });
    return obj;
  }

  function visit(node) {
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
          Object.assign(localeData, parseObjLiteral(decl.initializer, sourceFile));
        }
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (Object.keys(localeData).length === 0) {
    return parseLocaleFileRegex(content, filePath);
  }
  return flattenKeys(localeData);
}

// ─── Regex Fallback Parser ────────────────────────────────────────────────────

/**
 * Regex-based parser that handles the common locale pattern:
 *   import { admin } from './vi/admin';
 *   export const vi = { ...admin, ...auth, ... };
 * Recursively parses each sub-module to extract nested keys.
 */
function parseLocaleFileRegex(content, filePath) {
  const importMap = {};

  // Parse: import { name } from './path'
  const importRe = /import\s+\{\s*(\w+)\s*\}\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(content)) !== null) {
    importMap[m[1]] = m[2];
  }

  // Detect spread pattern: { ...admin, ...auth, ... }
  const spreadRe = /\.\.\.(\w+)/g;
  const spreads = [];
  while ((m = spreadRe.exec(content)) !== null) {
    if (importMap[m[1]]) spreads.push(m[1]);
  }

  // If file uses spread imports, parse each sub-module
  if (spreads.length > 0) {
    const allKeys = [];
    for (const name of spreads) {
      let subPath = join(dirname(filePath), importMap[name]);
      if (!subPath.endsWith('.ts')) subPath += '.ts';
      try {
        const subContent = readFileSync(subPath, 'utf-8');
        const subKeys = parseSubModuleKeys(subContent, name);
        allKeys.push(...subKeys);
      } catch { /* skip */ }
    }
    return allKeys;
  }

  // Direct object literal (no spreads)
  return parseSubModuleKeysFromContent(content);
}

/**
 * Parse a sub-module file like:
 *   export const admin = { adminsecuritysettings: { "100": "100", ... }, ... }
 * Returns flat dot-notation keys.
 */
function parseSubModuleKeys(content, expectedVarName) {
  // Find: export const <name> ... = {
  const exportRe = new RegExp(
    `export\\s+const\\s+${expectedVarName}\\s*(?::[^=]*)?\\s*=\\s*`,
    's'
  );
  const exportMatch = exportRe.exec(content);
  if (!exportMatch) return [];

  const startIdx = exportMatch.index + exportMatch[0].length;
  const objStr = extractBalancedBraces(content, startIdx);
  if (!objStr) return [];

  const parsed = parseObjectKeys(objStr);
  return flattenKeys(parsed);
}

function parseSubModuleKeysFromContent(content) {
  const exportRe = /export\s+(?:default\s+|const\s+\w+\s*(?::[^=]*)?\s*=\s*)/s;
  const exportMatch = exportRe.exec(content);
  if (!exportMatch) return [];

  const startIdx = exportMatch.index + exportMatch[0].length;
  const objStr = extractBalancedBraces(content, startIdx);
  if (!objStr) return [];

  return flattenKeys(parseObjectKeys(objStr));
}

/**
 * Extract balanced braces starting from position where '{' is expected.
 */
function extractBalancedBraces(str, startIdx) {
  let i = startIdx;
  while (i < str.length && str[i] !== '{') i++;
  if (i >= str.length) return null;

  let depth = 0;
  let inStr = false;
  let strCh = '';
  const start = i;

  for (; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (ch === strCh && str[i - 1] !== '\\') inStr = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = true;
      strCh = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return str.substring(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse a balanced { ... } string into a nested key object.
 * Handles quoted keys like "100", "15_ph_t" and nested objects.
 */
function parseObjectKeys(objStr) {
  const result = {};
  // Remove outer braces
  const inner = objStr.slice(1, -1);

  let i = 0;
  while (i < inner.length) {
    // Skip whitespace and commas
    while (i < inner.length && /[\s,]/.test(inner[i])) i++;
    if (i >= inner.length) break;

    // Skip comments
    if (inner[i] === '/' && inner[i + 1] === '/') {
      while (i < inner.length && inner[i] !== '\n') i++;
      continue;
    }
    if (inner[i] === '/' && inner[i + 1] === '*') {
      i += 2;
      while (i < inner.length - 1 && !(inner[i] === '*' && inner[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // Skip spread operators
    if (inner[i] === '.' && inner[i + 1] === '.' && inner[i + 2] === '.') {
      // Skip ...identifier
      i += 3;
      while (i < inner.length && /\w/.test(inner[i])) i++;
      continue;
    }

    // Parse key (quoted or unquoted)
    let key = '';
    if (inner[i] === '"' || inner[i] === "'") {
      const q = inner[i];
      i++;
      while (i < inner.length && inner[i] !== q) {
        if (inner[i] === '\\') i++;
        key += inner[i];
        i++;
      }
      i++; // closing quote
    } else if (/[\w$]/.test(inner[i])) {
      while (i < inner.length && /[\w$]/.test(inner[i])) {
        key += inner[i];
        i++;
      }
    } else {
      i++;
      continue;
    }

    if (!key) continue;

    // Skip whitespace, find colon
    while (i < inner.length && /\s/.test(inner[i])) i++;
    if (i >= inner.length || inner[i] !== ':') continue;
    i++; // skip colon
    while (i < inner.length && /\s/.test(inner[i])) i++;

    // Parse value
    if (inner[i] === '{') {
      const braceStr = extractBalancedBraces(inner, i);
      if (braceStr) {
        result[key] = parseObjectKeys(braceStr);
        i += braceStr.length;
      }
    } else {
      // Skip scalar value (string, number, etc.)
      if (inner[i] === "'" || inner[i] === '"' || inner[i] === '`') {
        const q = inner[i];
        i++;
        while (i < inner.length && inner[i] !== q) {
          if (inner[i] === '\\') i++;
          i++;
        }
        i++; // closing quote
      } else {
        // Unquoted value — skip to comma or closing brace
        while (i < inner.length && inner[i] !== ',' && inner[i] !== '}') i++;
      }
      result[key] = 'VALUE';
    }
  }

  return result;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function checkCoverage(requiredKeys, localeFile) {
  const availableKeys = new Set(parseLocaleFile(localeFile));
  const missing = [];
  for (const item of requiredKeys) {
    if (!availableKeys.has(item.key)) {
      missing.push(item);
    }
  }
  return missing;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.length < 4) {
    console.log('Usage: node check-locale-coverage.mjs <keys_json_file> <locale_ts_file>');
    process.exit(1);
  }

  const requiredKeys = JSON.parse(readFileSync(process.argv[2], 'utf-8'));
  const localeFile = process.argv[3];
  const missing = checkCoverage(requiredKeys, localeFile);

  if (missing.length > 0) {
    console.error(`❌ Missing ${missing.length} keys in ${localeFile}:`);
    missing.forEach(item => {
      console.error(`  - ${item.key} (used in ${item.file}:${item.line})`);
    });
    process.exit(1);
  } else {
    console.log(`✅ All keys exist in ${localeFile}`);
  }
}
