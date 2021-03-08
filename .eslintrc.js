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
        devDependencies: ['**/*.spec.js', '**/*.test.tsx', 'src/setupTests.js'],
      },
    ], // for Enzyme
    '@typescript-eslint/no-use-before-define': 0, // for clean code
    '@typescript-eslint/explicit-member-accessibility': 0, // too verbose for React components
    '@typescript-eslint/explicit-function-return-type': 0, // to fix build after ESLint upgrade. TODO: activate
    'react/state-in-constructor': [1, 'never'],
    'react/prop-types': 0, // TypeScript does it for us
    '@typescript-eslint/no-empty-function': 0, // we use it
    '@typescript-eslint/explicit-module-boundary-types': 0, // should only be used once file is renamed to actual typescript
    'import/extensions': [1, 'never'],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 1, // should only be used once file is renamed to actual typescript
      },
    },
  ],
};
