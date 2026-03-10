import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
    {
        ignores: ['node_modules/**', 'coverage/**', '*.config.js', '*.config.ts', 'public/**', 'src/__tests__/**'],
    },
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
            globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
        },
        plugins: { '@typescript-eslint': typescript, 'react': reactPlugin, 'react-hooks': reactHooksPlugin, 'jsx-a11y': jsxA11y },
        rules: {
            ...Object.fromEntries(Object.entries(jsxA11y.configs.recommended.rules || {}).map(([k, v]) => [k, v === 'error' ? 'warn' : v])),
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            'react/react-in-jsx-scope': 'off', 'react/prop-types': 'off', 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn',
            'jsx-a11y/no-static-element-interactions': 'warn', 'jsx-a11y/click-events-have-key-events': 'warn', 'jsx-a11y/no-autofocus': 'warn', 'jsx-a11y/img-redundant-alt': 'warn',
            'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-case-declarations': 'warn',
            'no-unused-vars': 'off', 'no-undef': 'off', 'prefer-const': 'warn', 'no-debugger': 'error',
        },
        settings: { react: { version: 'detect' } },
    },
    {
        files: ['src/locales/**', 'src/data/**', 'supabase/functions/**', '**/*.test.ts', '**/*.test.tsx', 'src/App.tsx'],
        rules: { 'max-lines': 'off', '@typescript-eslint/no-explicit-any': 'off' },
    },
];
