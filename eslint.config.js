import stylistic from '@stylistic/eslint-plugin'
import parser from '@typescript-eslint/parser'
import importExtensionsPlugin from 'eslint-plugin-file-extension-in-import-ts'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tsEslint from 'typescript-eslint'

export default [
    {
        files: [
            'src/**/*.ts',
            '*.js'
        ],
        ignores: [
            'node_modules/',
            'dist/',
            'examples/'
        ]
    },
    {
        languageOptions: {
            parser,
            parserOptions: { project: ['tsconfig.json'] }
        }
    },
    stylistic.configs.customize({
        indent: 4,
        quotes: 'single',
        semi: false,
        jsx: true,
        commaDangle: 'never'
    }),
    {
        rules: {
            '@stylistic/brace-style': ['error', '1tbs'],
            '@stylistic/jsx-curly-brace-presence': ['error', 'always']
        }
    },
    {
        plugins: {
            'simple-import-sort': simpleImportSort
        },
        rules: {
            'simple-import-sort/imports': 'error'
        }
    },
    {
        plugins: {
            'file-extension-in-import-ts': importExtensionsPlugin
        },
        rules: {
            'file-extension-in-import-ts/file-extension-in-import-ts': 'error'
        }
    },
    ...tsEslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true
                }
            ]
        }
    }
]
