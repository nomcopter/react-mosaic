import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // `flat/react` re-enables the base ESLint `no-redeclare`, which
      // typescript-eslint's recommended set turns off for TypeScript because
      // it misreports overload signatures as redeclarations.
      'no-redeclare': 'off',
    },
  },
];
