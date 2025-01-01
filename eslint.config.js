import stylistic from '@stylistic/eslint-plugin'
import parser from '@typescript-eslint/parser'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tsEslint from 'typescript-eslint'

export default [
    {
        exclude: [
            'node_modules/',
            'dist/',
            'examples/'
        ]
    },
    {
        files: [
            'src/**/*.ts',
            '*.js'
        ],
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
