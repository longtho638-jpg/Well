import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
    // Ignore patterns
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'coverage/**',
            '*.config.js',
            '*.config.ts',
            'public/**',
            'src/__tests__/**',
        ],
    },

    // Base JS config
    js.configs.recommended,

    // TypeScript files
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
            'react': reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        rules: {
            // TypeScript rules
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn',

            // React rules
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // General rules
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'no-unused-vars': 'off', // Use TypeScript version
            'no-undef': 'off', // TypeScript handles this
            'prefer-const': 'warn',
            'no-debugger': 'error',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
];
