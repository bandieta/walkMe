module.exports = {
  extends: ['../../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // NestJS commonly uses any in decorators
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
