module.exports = {
  extends: [
    '@transferwise',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:import/typescript',
  ],
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.spec.js', '**/*.test.tsx', 'src/setupTests.js'] }], // for Enzyme
    '@typescript-eslint/no-use-before-define': 0, // for clean code
    '@typescript-eslint/explicit-member-accessibility': 0, // too verbose for React components
    "@typescript-eslint/explicit-function-return-type": ['error', {
      allowTypedFunctionExpressions: true, // to infer types for functional React components
    }],
    'react/state-in-constructor': [1, 'never'],
    'react/prop-types': 0, // TypeScript does it for us
  },
};
