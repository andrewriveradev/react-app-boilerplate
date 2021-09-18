const path = require('path');

// ESLint requires either JSON or CommonJS files, it doesn't support ESM.
// Cannot `require()` .mjs files, so we must duplicate the code here.
// Path is relative to package.json, much like the `eslintConfig.extends` entry.
const babelConfigPath = path.resolve('./config/babel.config.json');

/** @type {import('eslint').Linter.BaseConfig} */
module.exports = {
    env: {
        browser: true,
        es6: true,
        jest: true,
    },
    parser: '@babel/eslint-parser',
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
        babelOptions: {
            configFile: babelConfigPath,
        },
    },
    ignorePatterns: [
        '**/node_modules/**',
        '**/.eslintrc*', // Since we're resolving the path from package.json, JetBrains throws error that `root/config/config/.eslintrc doesn't exist (fixed by simply ignoring this file)
    ],
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
    ],
    plugins: [
        '@babel',
        'react',
        'react-hooks',
    ],
    // Settings for specific plugins
    settings: {
        react: { // `eslint-plugin-react` docs: https://github.com/yannickcr/eslint-plugin-react#configuration
            version: 'detect', // Automatically detect React version
        },
    },
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        require: 'readonly',
        process: 'writable',
        module: 'writable',
        __dirname: 'readonly',
        global: 'writable',
    },
    rules: {
        indent: [ 'error', 4, { // Indent with 4 spaces, not tab or 2 spaces
            SwitchCase: 1, // Same for switch-case statements
            ignoredNodes: [ 'TemplateLiteral' ]
        }],
        eqeqeq: [ 'warn', 'always', {
            null: 'ignore' // Encourage using ===/!== except for `x != null` (`!= null` --> `!== null && !== undefined`)
        }],
        // Enforce spacing between square/curly braces except for nested arrays/objects
        'object-curly-spacing': [ 'error', 'always', {
            arraysInObjects: false,
            objectsInObjects: false,
        }],
        'array-bracket-spacing': [ 'error', 'always', {
            arraysInArrays: false,
            objectsInArrays: false,
        }],
        'brace-style': 'error', // Enforce all function/statement curly braces to be on same line as declaration; else(if) statements on same line as closing curly brace. Defaults to '1tbs' - one-true-brace-style. See: https://eslint.org/docs/rules/brace-style#1tbs
        'comma-dangle': [ 'error', 'always-multiline' ], // Enforce commas after array/object/import/export/function parameters, but only if they're on multiple lines
        semi: [ 'error', 'always' ], // Enforce semicolon usage
        // Wait until https://github.com/eslint/eslint/issues/15078 is fixed, then uncomment below.
        // 'no-unused-vars': [ 'error', {
        //     // Prohibit unused vars unless they're functions
        //     varsIgnorePattern: '(?<= )(\\w+)(?=( = )?\\([^\\)]*\\)( =>)? [\\(\\{])',
        // }],

        // TODO Find out how to force imports to use aliases (unless ./File import)
        //  I think we have to write our own plugin because none of the below work:
        //  eslint-plugin-import, eslint-import-resolver-alias, eslint-plugin-import-alias
        //  Starting point: https://stackoverflow.com/questions/66349222/how-to-enforce-a-rule-on-importing-path-using-alias-by-eslint

        'react/jsx-indent': [ 'error', 4, {
            checkAttributes: true,
            indentLogicalExpressions: true
        }],
        'react/jsx-closing-bracket-location': [ 'error', {
            selfClosing: 'tag-aligned',
            nonEmpty: 'tag-aligned'
        }],
        'react/prop-types': 'warn',
        'react/display-name': 'off', // Don't error on arrow-function components
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
};
