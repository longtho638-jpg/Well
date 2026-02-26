import { readFileSync } from 'fs';
import { join, dirname } from 'path';
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
  const imports = {};

  // First pass: collect imports
  sourceFile.statements.forEach(node => {
    if (ts.isImportDeclaration(node)) {
      const modulePath = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
      if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        node.importClause.namedBindings.elements.forEach(element => {
          const name = element.name.getText(sourceFile);
          imports[name] = { path: modulePath };
        });
      }
      if (node.importClause?.name) {
        // Default import
        const name = node.importClause.name.getText(sourceFile);
        imports[name] = { path: modulePath, isDefault: true };
      }
    }
  });

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
      } else if (ts.isSpreadAssignment(prop)) {
        // Handle spread operator: ...network
        const spreadName = prop.expression.getText(sourceFile);

        // Resolve the imported content
        if (imports[spreadName]) {
          const importedPath = imports[spreadName].path;
          let fullImportedPath = join(dirname(filePath), importedPath);
          if (!fullImportedPath.endsWith('.ts')) fullImportedPath += '.ts';

          try {
            // Recursively parse the imported file
            // Note: parseLocaleFile returns flattened keys, but here we need the object structure
            // So we'll use a slightly different approach: extract raw data
            const importedContent = readFileSync(fullImportedPath, 'utf-8');
            const importedSource = ts.createSourceFile(fullImportedPath, importedContent, ts.ScriptTarget.Latest, true);

            // Simplified: look for the object exported with the same name or default
            ts.forEachChild(importedSource, (child) => {
              if (ts.isVariableStatement(child)) {
                child.declarationList.declarations.forEach(decl => {
                  if (decl.name.getText(importedSource) === spreadName && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
                    Object.assign(obj, parseObjectLiteralFromOtherFile(decl.initializer, importedSource));
                  }
                });
              } else if (ts.isExportAssignment(child) && ts.isObjectLiteralExpression(child.expression)) {
                Object.assign(obj, parseObjectLiteralFromOtherFile(child.expression, importedSource));
              }
            });
          } catch (e) {
            console.warn(`Could not resolve spread: ${spreadName} at ${fullImportedPath}`);
          }
        }
      }
    });
    return obj;
  }

  function parseObjectLiteralFromOtherFile(node, source) {
    const obj = {};
    node.properties.forEach(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText(source).replace(/['"]/g, '');
        if (ts.isObjectLiteralExpression(prop.initializer)) {
          obj[key] = parseObjectLiteralFromOtherFile(prop.initializer, source);
        } else {
          obj[key] = 'VALUE';
        }
      }
    });
    return obj;
  }

  function visit(node) {
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
          const name = decl.name.getText(sourceFile);
          // Only parse the main exported objects (vi, en, etc) or all top-level objects
          Object.assign(localeData, parseObjectLiteral(decl.initializer));
        }
      });
    } else if (ts.isExportAssignment(node) && ts.isObjectLiteralExpression(node.expression)) {
      Object.assign(localeData, parseObjectLiteral(node.expression));
    }
    ts.forEachChild(node, visit);
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
