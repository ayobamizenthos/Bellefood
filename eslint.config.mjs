import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      '.netlify/**',
      'next-env.d.ts',
      'public/sw.js',
      'public/swe-worker-*.js',
      'node_modules/**',
      'supabase/functions/**',
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // These two only guide the React Compiler, which this app does not enable.
      // Client-only state (the cart, the session) is read after mount on purpose
      // so the server render and the first client render match.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
]

export default eslintConfig
