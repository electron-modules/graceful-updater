'use strict';

const eslintConfig = {
  root: true,
  extends: 'eslint-config-egg',
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: [],
  rules: {
    'valid-jsdoc': 0,
    'no-script-url': 0,
    'no-multi-spaces': 0,
    'default-case': 0,
    'no-case-declarations': 0,
    'one-var-declaration-per-line': 0,
    'no-restricted-syntax': 0,
    'jsdoc/require-param': 0,
    'jsdoc/check-param-names': 0,
    'jsdoc/require-param-description': 0,
    'arrow-parens': 0,
    'prefer-promise-reject-errors': 0,
    'no-control-regex': 0,
    'no-use-before-define': 0,
    'array-callback-return': 0,
    'no-bitwise': 0,
    'no-self-compare': 0,
    'one-var': 0,
    'no-trailing-spaces': [ 'warn', { skipBlankLines: true }],
  },
  globals: {
    window: false,
    mock: false,
    assert: false,
  },
  overrides: [],
};

const tslintConfig = {
  extends: 'eslint-config-egg/typescript',
  files: [ '*.ts' ],
  plugins: [
    '@typescript-eslint',
    'no-only-tests',
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': [ '.ts' ],
    },
    'import/resolver': {
      typescript: {
        project: [
          'tsconfig.json',
        ],
      },
    },
  },
  rules: {
    ...eslintConfig.rules,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-use-before-define': [ 'error' ],
    strict: 0,
    '@typescript-eslint/ban-ts-comment': [ 'warn' ],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': [ 'warn' ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};

eslintConfig.overrides.push(tslintConfig);

module.exports = eslintConfig;
