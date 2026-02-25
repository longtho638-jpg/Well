import { readFileSync } from 'fs';
import { join } from 'path';
import ts from 'typescript';

/**
 * Parse TypeScript locale file and extract all keys
 * Using TypeScript compiler API for safer parsing than regex/eval
 */
function parseLocaleFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // Create a source file
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  let localeData = {};

  // Find the default export or the exported object
  // This is a simplified traversal to find the exported object literal
  function visit(node) {
    if (ts.isExportAssignment(node)) {
      // export default { ... }
      if (ts.isObjectLiteralExpression(node.expression)) {
        localeData = parseObjectLiteral(node.expression);
      }
    } else if (ts.isVariableStatement(node)) {
      // Handle 'export const vi = { ... }'
      const declarationList = node.declarationList;
      declarationList.declarations.forEach(declaration => {
        if (declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
          // We found an object literal assigned to a variable export
          // Merge it (in case there are multiple, though unlikely for locale files)
          const obj = parseObjectLiteral(declaration.initializer);
          localeData = { ...localeData, ...obj };
        }
      });
    }
    ts.forEachChild(node, visit);
  }

  function parseObjectLiteral(node) {
    const obj = {};
    node.properties.forEach(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText(sourceFile).replace(/['"]/g, ''); // Remove quotes if present

        if (ts.isObjectLiteralExpression(prop.initializer)) {
          obj[key] = parseObjectLiteral(prop.initializer);
        } else if (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
          obj[key] = prop.initializer.text;
        } else {
          // Fallback for other types or dynamic values - treat as leaf
          obj[key] = 'VALUE';
        }
      }
    });
    return obj;
  }

  visit(sourceFile);

  // Fallback to simple regex/eval if TS parsing fails to find anything (e.g. strict format not followed)
  // The plan suggested eval, but TS is safer. If TS fails, we can try the regex approach from the plan.
  if (Object.keys(localeData).length === 0) {
     // Regex approach from plan as backup
      const objMatch = content.match(/export\s+(?:default\s+)?(\{[\s\S]+\});?/);
      if (objMatch) {
        try {
            // This eval is risky but if it's just object literal it might work
            // However, TS files might have type annotations that break eval
            // Let's stick to TS parser or improve it if needed.
            // For now, let's assume the TS parser works for standard object literals.
        } catch (e) {
            console.error('Failed to parse with regex fallback', e);
        }
      }
  }

  return flattenKeys(localeData);
}

/**
 * Flatten nested object to dot-notation keys
 * { auth: { login: 'text' } } → ['auth.login']
 */
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

/**
 * Check if all required keys exist in locale
 */
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
  // Check if we have enough args
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
