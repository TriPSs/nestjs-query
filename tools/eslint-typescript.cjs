// TypeScript-aware Airbnb rules, migrated to typescript-eslint 8.
// Formatting remains owned by Prettier.
module.exports = {
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts']
    },
    'import/resolver': {
      node: {
        extensions: ['.mjs', '.js', '.json', '.ts', '.d.ts']
      }
    },
    'import/extensions': ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.d.ts'],
    'import/external-module-folders': ['node_modules', 'node_modules/@types']
  },
  rules: {
    camelcase: 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE']
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase']
      },
      {
        selector: 'typeLike',
        format: ['PascalCase']
      }
    ],
    'default-param-last': 'off',
    '@typescript-eslint/default-param-last': 'error',
    'dot-notation': 'off',
    '@typescript-eslint/dot-notation': [
      'error',
      {
        allowKeywords: true
      }
    ],
    'lines-between-class-members': 'off',
    'no-array-constructor': 'off',
    '@typescript-eslint/no-array-constructor': 'error',
    'no-dupe-class-members': 'off',
    '@typescript-eslint/no-dupe-class-members': 'error',
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': [
      'error',
      {
        allow: ['arrowFunctions', 'functions', 'methods']
      }
    ],
    'no-implied-eval': 'off',
    'no-new-func': 'off',
    '@typescript-eslint/no-implied-eval': 'error',
    'no-loss-of-precision': 'off',
    'no-loop-func': 'off',
    '@typescript-eslint/no-loop-func': 'error',
    'no-magic-numbers': 'off',
    '@typescript-eslint/no-magic-numbers': [
      'off',
      {
        ignore: [],
        ignoreArrayIndexes: true,
        enforceConst: true,
        detectObjects: false
      }
    ],
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': 'error',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    'no-throw-literal': 'off',
    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: false,
        allowTernary: false,
        allowTaggedTemplates: false
      }
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        caughtErrors: 'none',
        ignoreRestSiblings: true
      }
    ],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error',
      {
        functions: true,
        classes: true,
        variables: true
      }
    ],
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
    'require-await': 'off',
    '@typescript-eslint/require-await': 'off',
    'no-return-await': 'off',
    '@typescript-eslint/return-await': ['error', 'in-try-catch'],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        mjs: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never'
      }
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'test/**',
          'tests/**',
          'spec/**',
          '**/__tests__/**',
          '**/__mocks__/**',
          'test.{js,jsx}',
          'test.{ts,tsx}',
          'test-*.{js,jsx}',
          'test-*.{ts,tsx}',
          '**/*{.,_}{test,spec}.{js,jsx}',
          '**/*{.,_}{test,spec}.{ts,tsx}',
          '**/jest.config.js',
          '**/jest.config.ts',
          '**/jest.setup.js',
          '**/jest.setup.ts',
          '**/vue.config.js',
          '**/vue.config.ts',
          '**/webpack.config.js',
          '**/webpack.config.ts',
          '**/webpack.config.*.js',
          '**/webpack.config.*.ts',
          '**/rollup.config.js',
          '**/rollup.config.ts',
          '**/rollup.config.*.js',
          '**/rollup.config.*.ts',
          '**/gulpfile.js',
          '**/gulpfile.ts',
          '**/gulpfile.*.js',
          '**/gulpfile.*.ts',
          '**/Gruntfile{,.js}',
          '**/Gruntfile{,.ts}',
          '**/protractor.conf.js',
          '**/protractor.conf.ts',
          '**/protractor.conf.*.js',
          '**/protractor.conf.*.ts',
          '**/karma.conf.js',
          '**/karma.conf.ts',
          '**/.eslintrc.js',
          '**/.eslintrc.ts'
        ],
        optionalDependencies: false
      }
    ],
    '@typescript-eslint/only-throw-error': 'error'
  }
}
