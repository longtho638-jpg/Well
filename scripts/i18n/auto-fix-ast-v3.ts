
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

    // --- REPAIR MODE: Force append cleanly ---
    if (Object.keys(newTranslations).length > 0) {
        const localeFileContent = fs.readFileSync(LOCALE_FILE_PATH, 'utf-8');
        
        // Remove previous auto-gen block if exists to avoid duplication
        const markerIndex = localeFileContent.indexOf('// --- AUTO-GENERATED BY WOW FIXER ---');
        let baseContent = localeFileContent;
        if (markerIndex !== -1) {
            baseContent = localeFileContent.substring(0, markerIndex);
        } else {
            // Find last closing brace
            const lastBrace = localeFileContent.lastIndexOf('};');
            if (lastBrace !== -1) {
                baseContent = localeFileContent.substring(0, lastBrace);
            }
        }

        const grouped: Record<string, Record<string, string>> = {};
        for (const [key, value] of Object.entries(newTranslations)) {
            const [ns, ...rest] = key.split('.');
            const subKey = rest.join('.');
            if (!grouped[ns]) grouped[ns] = {};
            grouped[ns][subKey] = value;
        }

        let jsonString = '\n  // --- AUTO-GENERATED BY WOW FIXER ---\n';
        for (const [ns, keys] of Object.entries(grouped)) {
            jsonString += `  '${ns}': {\n`;
            for (const [k, v] of Object.entries(keys)) {
                const safeValue = v.replace(/\\/g, '\\\\').replace(/'/g, "\'\'").replace(/\n/g, '\\n');
                jsonString += `    '${k}': '${safeValue}',\n`;
            }
            jsonString += `  },\n`;
        }
        
        // Close the object
        const finalContent = baseContent + jsonString + '};\n';
        
        fs.writeFileSync(LOCALE_FILE_PATH, finalContent);
        console.log(`💾 Updated ${LOCALE_FILE_PATH}`);
        
        const enPath = 'src/locales/en.ts';
        if (fs.existsSync(enPath)) {
             const enContent = fs.readFileSync(enPath, 'utf-8');
             // Similar logic for EN
             const enMarkerIndex = enContent.indexOf('// --- AUTO-GENERATED BY WOW FIXER ---');
             let enBase = enContent;
             if (enMarkerIndex !== -1) {
                 enBase = enContent.substring(0, enMarkerIndex);
             } else {
                 const enLastBrace = enContent.lastIndexOf('};');
                 if (enLastBrace !== -1) {
                     enBase = enContent.substring(0, enLastBrace);
                 }
             }
             
             const finalEn = enBase + jsonString + '};\n';
             fs.writeFileSync(enPath, finalEn);
             console.log(`💾 Synced to ${enPath}`);
        }
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
