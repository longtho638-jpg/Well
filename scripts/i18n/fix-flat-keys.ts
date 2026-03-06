/**
 * i18n Fix Flat Keys - Convert flat keys to nested structure
 * Preserves existing export structure, only converts flat keys within each export
 *
 * Example:
 * BEFORE: { 'auth.login.email': 'Email' }
 * AFTER:  { auth: { login: { email: 'Email' } } }
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALE_DIRS = ['src/locales/vi', 'src/locales/en'];

/**
 * Parse TypeScript locale file with multiple exports
 */
function parseLocaleFile(filePath: string): Record<string, Record<string, unknown>> {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf-8');
  const result: Record<string, Record<string, unknown>> = {};

  // Match all export const name = { ... }; patterns
  const exportPattern = /export const (\w+) = (\{[\s\S]*?\n\});/g;
  let match: RegExpExecArray | null;

  while ((match = exportPattern.exec(content)) !== null) {
    const exportName = match[1];
    const objContent = match[2];
    result[exportName] = parseObjectContent(objContent);
  }

  return result;
}

/**
 * Parse object content handling nested objects and multiline strings
 */
function parseObjectContent(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Remove outer braces
  let inner = content.trim();
  if (inner.startsWith('{')) inner = inner.slice(1);
  if (inner.endsWith('}')) inner = inner.slice(0, -1);

  let i = 0;
  while (i < inner.length) {
    // Skip whitespace and comments
    while (i < inner.length && (/\s/.test(inner[i]) || inner[i] === '/' && inner[i + 1] === '/')) {
      if (inner[i] === '/') {
        while (i < inner.length && inner[i] !== '\n') i++;
      }
      i++;
    }
    if (i >= inner.length) break;

    // Read key
    const keyMatch = inner.slice(i).match(/^(\w+)\s*:\s*/);
    if (!keyMatch) {
      i++;
      continue;
    }

    const key = keyMatch[1];
    i += keyMatch[0].length;

    // Read value
    const valueResult = readValue(inner, i);
    if (!valueResult) break;

    result[key] = valueResult.value;
    i = valueResult.endIndex;

    // Skip comma and whitespace
    while (i < inner.length && /[\s,]/.test(inner[i])) i++;
  }

  return result;
}

/**
 * Read value handling strings and nested objects
 */
function readValue(
  content: string,
  i: number
): { value: string | Record<string, unknown>; endIndex: number } | null {
  while (i < content.length && /\s/.test(content[i])) i++;
  if (i >= content.length) return null;

  const char = content[i];

  if (char === '"' || char === "'" || char === '`') {
    return readString(content, i, char);
  }

  if (char === '{') {
    return readNestedObject(content, i);
  }

  return null;
}

/**
 * Read string literal with escape handling
 */
function readString(
  content: string,
  i: number,
  quoteChar: string
): { value: string; endIndex: number } {
  const startIndex = i;
  i++; // Skip opening quote
  let escaped = false;

  while (i < content.length) {
    const char = content[i];

    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === quoteChar) {
      i++; // Include closing quote
      break;
    }

    i++;
  }

  // Extract raw string including quotes
  const rawString = content.slice(startIndex, i);

  // Safely evaluate the string literal
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const value = new Function(`return ${rawString}`)() as string;
    return { value, endIndex: i };
  } catch {
    // Fallback: manual unescape
    let value = content.slice(startIndex + 1, i - 1);
    value = value.replace(/\\n/g, '\n')
                 .replace(/\\r/g, '\r')
                 .replace(/\\t/g, '\t')
                 .replace(/\\"/g, '"')
                 .replace(/\\'/g, "'")
                 .replace(/\\\\/g, '\\');
    return { value, endIndex: i };
  }
}

/**
 * Read nested object
 */
function readNestedObject(
  content: string,
  i: number
): { value: Record<string, unknown>; endIndex: number } {
  i++; // Skip opening brace
  let braceCount = 1;
  let objContent = '';

  while (i < content.length && braceCount > 0) {
    const char = content[i];
    if (char === '{') braceCount++;
    else if (char === '}') braceCount--;

    if (braceCount > 0) {
      objContent += char;
    }
    i++;
  }

  return {
    value: parseObjectContent(`{${objContent}}`),
    endIndex: i
  };
}

/**
 * Convert flat keys to nested structure
 * e.g., { 'login.email.label': 'Email' } → { login: { email: { label: 'Email' } } }
 */
function convertFlatToNested(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!key.includes('.')) {
      result[key] = value;
      continue;
    }

    const parts = key.split('.');
    let current: Record<string, unknown> = result;

    for (let j = 0; j < parts.length - 1; j++) {
      const part = parts[j];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[parts[parts.length - 1]] = value;
  }

  return result;
}

/**
 * Serialize object to TypeScript format with proper indentation
 */
function serializeObject(obj: Record<string, unknown>, indent = 2): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(`${' '.repeat(indent)}${key}: {`);
      lines.push(serializeObject(value as Record<string, unknown>, indent + 2));
      lines.push(`${' '.repeat(indent)}},`);
    } else if (typeof value === 'string') {
      const escaped = escapeString(value);
      lines.push(`${' '.repeat(indent)}${key}: "${escaped}",`);
    }
  }

  return lines.join('\n');
}

/**
 * Escape string for TypeScript
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Generate file content with all exports
 */
function generateFileContent(exports: Record<string, Record<string, unknown>>): string {
  const lines: string[] = [];

  for (const [exportName, data] of Object.entries(exports)) {
    const nested = convertFlatToNested(data);
    const serialized = serializeObject(nested);
    lines.push(`export const ${exportName} = {`);
    lines.push(serialized);
    lines.push('};');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Fix a single locale file
 */
function fixLocaleFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const parsed = parseLocaleFile(filePath);
  if (Object.keys(parsed).length === 0) return;

  const newContent = generateFileContent(parsed);
  fs.writeFileSync(filePath, newContent);
  process.stderr.write(`✅ Fixed ${filePath}\n`);
}

// Main execution
for (const dir of LOCALE_DIRS) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    fixLocaleFile(filePath);
  }
}

process.stderr.write('\n💡 Done! Run build to verify.\n');
