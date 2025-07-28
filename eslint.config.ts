import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginImport from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Global ignores
    ignores: [
      'node_modules/',
      'coverage/',
      '*.d.ts',
      '*quickie.ts',
      'vitest.config.ts',
      'tsup.config.ts',
      'packages/*/tsup.config.ts',
      'packages/*/dist',
    ],
  },

  // Base configuration
  eslint.configs.recommended,

  // TypeScript configuration
  ...tseslint.configs.recommended,

  // Language options for TypeScript
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },

  // Import plugin configuration
  {
    plugins: {
      import: pluginImport,
    },
    settings: {
      'import/resolver': {
        node: true,
      },
    },
    rules: {
      // Import rules
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // Custom rules
  {
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // General
      'no-console': 'warn',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',

      // Import rules
      'import/no-unresolved': 'off', // Let TypeScript handle this
    },
  },

  // Prettier integration (must be last)
  eslintConfigPrettier
);
