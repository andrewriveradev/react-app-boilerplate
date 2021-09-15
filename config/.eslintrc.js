/** @type {import('eslint').Linter.BaseConfig} */
module.exports = {
    env: {
        browser: true,
        es6: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        require: 'readonly',
        process: 'writable',
        module: 'writable',
        __dirname: 'readonly',
        global: 'writable',
    },
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: [
        'react',
        'react-hooks'
    ],
    rules: {
        indent: [ 'error', 4, {
            SwitchCase: 1,
            ignoredNodes: [ 'TemplateLiteral' ]
        }],
        'react/jsx-indent': [ 'error', 4, {
            checkAttributes: true,
            indentLogicalExpressions: true
        }],
        'react/jsx-closing-bracket-location': [ 'error', {
            selfClosing: 'tag-aligned',
            nonEmpty: 'tag-aligned'
        }],
        'react/prop-types': 'warn',
        'react/display-name': 'off', // don't error on arrow-function components
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
};
