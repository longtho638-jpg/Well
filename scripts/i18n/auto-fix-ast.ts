
import { Project, SyntaxKind, QuoteKind, JsxText, StringLiteral } from "ts-morph";
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

// Attributes to translate
const TRANSLATABLE_ATTRIBUTES = new Set(['placeholder', 'title', 'alt', 'label', 'aria-label', 'loadingText']);

// Existing keys to avoid duplicates
let existingKeys: Set<string> = new Set();
let newTranslations: Record<string, string> = {};

// ============================================================================ 
// HELPERS
// ============================================================================ 

function generateKey(text: string, filePath: string): string {
    // simplify text for key
    const cleanText = text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const shortText = cleanText.substring(0, 30);
    
    // Use filename as namespace
    const fileName = path.basename(filePath, path.extname(filePath));
    const namespace = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    let key = `${namespace}.${shortText}`;
    
    // clean up leading/trailing underscores
    key = key.replace(/_+/g, '_').replace(/\._/g, '.').replace(/_$/g, '');

    // Ensure uniqueness
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
    // Skip if it looks like a url, email, or pure number/symbol
    if (/^https?:\/\/ /.test(trimmed)) return false;
    if (/^\d+$/.test(trimmed)) return false;
    if (/^[\W_]+$/.test(trimmed)) return false; // symbols only
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return false; // JSX expr
    return true;
}

// ============================================================================ 
// MAIN LOGIC
// ============================================================================ 

async function run() {
    console.log('🚀 Initializing WOW Auto-Fix Engine (powered by ts-morph)...');

    // 1. Initialize Project
    const project = new Project({
        manipulationSettings: {
            quoteKind: QuoteKind.Single,
        },
        skipAddingFilesFromTsConfig: true,
    });

    // 2. Find Files
    const files = await glob(`${TARGET_DIR}/**/*.{tsx,ts}`, { 
        ignore: IGNORE_PATTERNS,
        absolute: true 
    });

    console.log(`📂 Found ${files.length} files to process.`);

    // 3. Load Locale File to Memory (Naive parsing for now, or just append)
    // For a robust solution, we read the existing keys first? 
    // Let's assume we append new keys to a specific object or just log them for manual addition to be safe, 
    // BUT user asked for WOW auto-fix. So we must append.
    
    // We will append to the end of the file or replace the export object. 
    // To be safe, let's keep track of new translations and generate a patch file or append strictly. 
    
    let processedCount = 0;

    for (const filePath of files) {
        const sourceFile = project.addSourceFileAtPath(filePath);
        let modified = false;
        let hasImport = false;

        // Check if useTranslation is imported
        const imports = sourceFile.getImportDeclarations();
        const hookImport = imports.find(i => i.getModuleSpecifierValue().includes('hooks') || i.getModuleSpecifierValue().includes('useTranslation'));
        
        if (hookImport) {
            const namedImports = hookImport.getNamedImports();
            if (namedImports.some(ni => ni.getName() === 'useTranslation')) {
                hasImport = true;
            }
        }

        // --- STRATEGY: JSX Text ---
        sourceFile.getDescendantsOfKind(SyntaxKind.JsxText).forEach(node => {
            const text = node.getText();
            // JsxText often contains whitespace/newlines. Trim it.
            if (!shouldTranslate(text)) return;
            // It might be whitespace only
            if (!text.trim()) return;

            const key = generateKey(text.trim(), filePath);
            newTranslations[key] = text.trim();

            node.replaceWithText(`{t('${key}')}`);
            modified = true;
        });

        // --- STRATEGY: JSX Attributes (String Literals) ---
        sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach(attr => {
            // TS-Morph safety check
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

        // --- Add Hook if modified ---
        if (modified) {
            // 1. Add import if missing
            if (!hasImport) {
                // Try to find where to add it. 
                // Simple: Add to top.
                sourceFile.addImportDeclaration({
                    namedImports: ['useTranslation'],
                    moduleSpecifier: '@/hooks',
                });
            }

            // 2. Add hook call inside component
            // This is tricky. We need to find the functional component.
            // Heuristic: Find the first function that is exported or has JSX. 
            
            const functions = sourceFile.getFunctions();
            const arrowFunctions = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
            const allFuncs = [...functions, ...arrowFunctions];

            for (const func of allFuncs) {
                // Check if it has JSX
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

    // 4. Update Locale File
    // We will append the new keys to the 'vi' object in src/locales/vi.ts
    // This is a bit "hacky" string manipulation to ensure we don't break the file structure, 
    // as parsing the huge locale object with AST might be slow/complex.
    
    if (Object.keys(newTranslations).length > 0) {
        const localeFileContent = fs.readFileSync(LOCALE_FILE_PATH, 'utf-8');
        
        // Find the end of the object. Assuming it ends with "};".
        // We will insert a new "autofix" section before the end.
        
        const insertionPoint = localeFileContent.lastIndexOf('};');
        if (insertionPoint !== -1) {
            const newContentParts: string[] = [];
            
            // Group by namespace (filename)
            const grouped: Record<string, Record<string, string>> = {};
            for (const [key, value] of Object.entries(newTranslations)) {
                const [ns, ...rest] = key.split('.');
                const subKey = rest.join('.');
                if (!grouped[ns]) grouped[ns] = {};
                grouped[ns][subKey] = value;
            }

            let jsonString = '\n  // --- AUTO-GENERATED BY WOW FIXER ---\n';
            for (const [ns, keys] of Object.entries(grouped)) {
                jsonString += `  ${ns}: {\n`;
                for (const [k, v] of Object.entries(keys)) {
                    // Escape single quotes
                    const safeValue = v.replace(/'/g, "\'");
                    jsonString += `    ${k}: '${safeValue}',\n`;
                }
                jsonString += `  },\n`;
            }

            const finalContent = localeFileContent.slice(0, insertionPoint) + jsonString + localeFileContent.slice(insertionPoint);
            fs.writeFileSync(LOCALE_FILE_PATH, finalContent);
            console.log(`💾 Updated ${LOCALE_FILE_PATH}`);
            
            // Also sync to EN (keeping VI values as placeholder)
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
        } else {
            console.error("❌ Could not find insertion point in locale file.");
        }
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
