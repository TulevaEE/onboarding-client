module.exports = {
  extends: [
    '@transferwise',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:import/typescript',
  ],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.spec.js',
          '**/*.spec.jsx',
          '**/*.spec.tsx',
          '**/*.test.tsx',
          'src/setupTests.js',
        ],
      },
    ], // for Enzyme
    'no-irregular-whitespace': 0, // zero width spaces sometimes used
    '@typescript-eslint/no-use-before-define': 0, // for clean code
    '@typescript-eslint/explicit-member-accessibility': 0, // too verbose for React components
    '@typescript-eslint/explicit-function-return-type': 0, // to fix build after ESLint upgrade. TODO: activate
    'react/state-in-constructor': [1, 'never'],
    'react/prop-types': 0, // TypeScript does it for us
    '@typescript-eslint/no-empty-function': 0, // we use it
    '@typescript-eslint/explicit-module-boundary-types': 0, // should only be used once file is renamed to actual typescript
    'import/extensions': [1, 'never'],
    'fp/no-mutation': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/static-property-placement': 'off',
    'react/no-array-index-key': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'react/require-default-props': 'off',
    'arrow-body-style': ['error', 'as-needed'],
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 0, // should only be used once file is renamed to actual typescript
        'no-shadow': 'off', // https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
        '@typescript-eslint/no-shadow': ['error'],
      },
    },
    {
      files: [
        '**/*.d.ts',
        '**/*.test.tsx',
        '**/*.spec.tsx',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/test/**/*.ts',
        'src/test/**/*.tsx',
      ],
      extends: ['plugin:jest-dom/recommended', 'plugin:testing-library/react'],
      rules: {
        '@typescript-eslint/no-explicit-any': 0, // fine in tests
        'import/no-extraneous-dependencies': 0, // devdependencies
        'testing-library/no-await-sync-events': 'error',
        'testing-library/no-wait-for-multiple-assertions': 'error',
        'testing-library/prefer-explicit-assert': 'error',
        'testing-library/prefer-presence-queries': 'error',
        'testing-library/prefer-user-event': 'error',
        'testing-library/prefer-wait-for': 'error',
      },
    },
  ],
};
