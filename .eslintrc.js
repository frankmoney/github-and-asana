module.exports = {
  root: true,
  globals: {
    preval: false,
  },
  parser: 'babel-eslint',
  'extends': [
    'airbnb',
    'plugin:import/recommended',
    'prettier',
  ],
  plugins: [
    'import',
    'mocha',
    'jsx-a11y',
    'prettier'
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
  },
  rules: {
    'no-console': 0,
    'import/extensions': 0,
    'import/no-extraneous-dependencies': 0,
    "import/no-unresolved": [
      "error",
      {
        "ignore": ['test/']
      }
    ],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        printWidth: 80,
        trailingComma: 'es5',
        semi: false,
      }
    ],
    'mocha/handle-done-callback': 'error',
    'mocha/no-exclusive-tests': 'error',
    'mocha/no-global-tests': 'error',
    'mocha/no-pending-tests': 'error',
    'mocha/no-skipped-tests': 'error',
  }
}
