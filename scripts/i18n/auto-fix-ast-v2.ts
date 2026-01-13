

import { Project, SyntaxKind, QuoteKind, StringLiteral } from "ts-morph";
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ============================================================================ 
// CONFIGURATION
// ============================================================================ 

const TARGET_DIR = 'src';
const LOCALE_FILE_PATH = 'src/locales/vi.ts';
const IGNORE_PATTERNS = [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.d.ts',
    'src/locales/**',
    'src/i18n.ts',
    'src/vite-env.d.ts',
    'src/main.tsx',
];

const TRANSLATABLE_ATTRIBUTES = new Set(['placeholder', 'title', 'alt', 'label', 'aria-label', 'loadingText']);

let existingKeys: Set<string> = new Set();
let newTranslations: Record<string, string> = {};

// ============================================================================ 
// HELPERS
// ============================================================================ 

function generateKey(text: string, filePath: string): string {
    const cleanText = text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const shortText = cleanText.substring(0, 30);
    const fileName = path.basename(filePath, path.extname(filePath));
    const namespace = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    let key = `${namespace}.${shortText}`;
    key = key.replace(/_+/g, '_').replace(/\._/g, '.').replace(/_$/g, '');
    
    // Ensure key is safe - actually we will quote all keys so this is less critical for syntax, 
    // but good for readability.
    if (!key || key === `${namespace}.`) {
       key = `${namespace}.text_${Math.floor(Math.random() * 1000)}`;
    }

    if (existingKeys.has(key) || newTranslations[key]) {
        let counter = 1;
        while (existingKeys.has(`${key}_${counter}`) || newTranslations[`${key}_${counter}`]) {
            counter++;
        }
        key = `${key}_${counter}`;
    }
    return key;
}

function shouldTranslate(text: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    if (trimmed.length <= 1) return false;
    if (/^https?:\/\//.test(trimmed)) return false;
    if (/^\d+$/.test(trimmed)) return false;
    if (/^[\W_]+$/.test(trimmed)) return false; 
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return false; 
    return true;
}

// ============================================================================ 
// MAIN LOGIC
// ============================================================================ 

async function run() {
    console.log('🚀 Re-initializing WOW Auto-Fix Engine V2 (Robust Mode)...');

    const project = new Project({
        manipulationSettings: { quoteKind: QuoteKind.Single },
        skipAddingFilesFromTsConfig: true,
    });

    const files = await glob(`${TARGET_DIR}/**/*.{tsx,ts}`, { 
        ignore: IGNORE_PATTERNS,
        absolute: true 
    });

    console.log(`📂 Found ${files.length} files to process.`);
    let processedCount = 0;

    for (const filePath of files) {
        const sourceFile = project.addSourceFileAtPath(filePath);
        let modified = false;
        let hasImport = false;

        const imports = sourceFile.getImportDeclarations();
        const hookImport = imports.find(i => i.getModuleSpecifierValue().includes('hooks') || i.getModuleSpecifierValue().includes('useTranslation'));
        if (hookImport) {
            const namedImports = hookImport.getNamedImports();
            if (namedImports.some(ni => ni.getName() === 'useTranslation')) {
                hasImport = true;
            }
        }

        // JSX Text
        sourceFile.getDescendantsOfKind(SyntaxKind.JsxText).forEach(node => {
            const text = node.getText();
            if (!shouldTranslate(text)) return;
            if (!text.trim()) return;

            const key = generateKey(text.trim(), filePath);
            newTranslations[key] = text.trim();
            node.replaceWithText(`{t('${key}')}`);
            modified = true;
        });

        // JSX Attributes
        sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach(attr => {
            if (!attr || typeof attr.getName !== 'function') return;
            const name = attr.getName();
            if (TRANSLATABLE_ATTRIBUTES.has(name)) {
                const initializer = attr.getInitializer();
                if (initializer && initializer.getKind() === SyntaxKind.StringLiteral) {
                    const text = (initializer as StringLiteral).getLiteralText();
                    if (shouldTranslate(text)) {
                        const key = generateKey(text, filePath);
                        newTranslations[key] = text;
                        attr.setInitializer(`{t('${key}')}`);
                        modified = true;
                    }
                }
            }
        });

        if (modified) {
            if (!hasImport) {
                sourceFile.addImportDeclaration({
                    namedImports: ['useTranslation'],
                    moduleSpecifier: '@/hooks',
                });
            }

            const functions = sourceFile.getFunctions();
            const arrowFunctions = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
            const allFuncs = [...functions, ...arrowFunctions];

            for (const func of allFuncs) {
                const hasJsx = func.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 || func.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0;
                if (hasJsx) {
                    const body = func.getBody();
                    if (body && body.isKind(SyntaxKind.Block)) {
                        const statements = body.getStatements();
                        const hasHookCall = statements.some(s => s.getText().includes('useTranslation()'));
                        if (!hasHookCall) {
                            body.insertStatements(0, "const { t } = useTranslation();");
                        }
                    }
                }
            }
            sourceFile.saveSync();
            processedCount++;
            process.stdout.write('.');
        }
    }

    console.log(`\n✨ Successfully processed ${processedCount} files.`);
    console.log(`📦 Generated ${Object.keys(newTranslations).length} new translation keys.`);

    if (Object.keys(newTranslations).length > 0) {
        const localeFileContent = fs.readFileSync(LOCALE_FILE_PATH, 'utf-8');
        const insertionPoint = localeFileContent.lastIndexOf('};');
        
        if (insertionPoint !== -1) {
            const grouped: Record<string, Record<string, string>> = {};
            for (const [key, value] of Object.entries(newTranslations)) {
                const [ns, ...rest] = key.split('.');
                const subKey = rest.join('.');
                if (!grouped[ns]) grouped[ns] = {};
                grouped[ns][subKey] = value;
            }

            let jsonString = '\n  // --- AUTO-GENERATED BY WOW FIXER ---\n';
            for (const [ns, keys] of Object.entries(grouped)) {
                // Key needs to be quoted if it contains hyphens or numbers at start, but to be safe/consistent, 
                // in the top-level locale object keys are usually unquoted if possible, but strict JSON is quoted.
                // However, TS object literal keys: 
                // valid identifier: key: 'value'
                // invalid: 'key-name': 'value'
                // We will wrap ALL keys in quotes to be 100% safe against "85_" or "we'll".
                
                jsonString += `  '${ns}': {\n`;
                for (const [k, v] of Object.entries(keys)) {
                    // Use JSON.stringify for the value to handle escaping perfectly
                    // But we want single quotes for style if possible. 
                    // JSON.stringify uses double quotes. 
                    // Let's use JSON.stringify and then replace outer double quotes with single if we want to be fancy, 
                    // OR just rely on JSON.stringify since valid TS allows double quotes.
                    // The simplest robust way is JSON.stringify for value.
                    
                    const safeKey = `'${k}'`; // Always quote key
                    // Escape value manually to use single quotes or just use double
                    // Let's use simple single quote escaping
                    const safeValue = v.replace(/\\/g, '\\\\').replace(/'/g, "\'\'").replace(/\n/g, '\\n');
                    jsonString += `    ${safeKey}: '${safeValue}',\n`;
                }
                jsonString += `  },\n`;
            }

            const finalContent = localeFileContent.slice(0, insertionPoint) + jsonString + localeFileContent.slice(insertionPoint);
            fs.writeFileSync(LOCALE_FILE_PATH, finalContent);
            console.log(`💾 Updated ${LOCALE_FILE_PATH}`);
            
            const enPath = 'src/locales/en.ts';
            if (fs.existsSync(enPath)) {
                 const enContent = fs.readFileSync(enPath, 'utf-8');
                 const enInsertion = enContent.lastIndexOf('};');
                 if (enInsertion !== -1) {
                     const finalEn = enContent.slice(0, enInsertion) + jsonString + enContent.slice(enInsertion);
                     fs.writeFileSync(enPath, finalEn);
                     console.log(`💾 Synced to ${enPath}`);
                 }
            }
        }
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
