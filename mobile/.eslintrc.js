module.exports = {
  extends: ['../../../.eslintrc.js', '@react-native'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    'react-native/no-inline-styles': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
