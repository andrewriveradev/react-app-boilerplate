#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const parseCliArgs = require('../config/utils/parseCliArgs');

function getPropTypesText(indentForClassStaticVar, typescript) {
    if (typescript) {
        return '';
    }

    const spacesIndent = ' '.repeat(4);
    const extraIndent = indentForClassStaticVar ? spacesIndent : '';

    return (
`propTypes = {
${extraIndent}    className: PropTypes.string,
${extraIndent}    children: PropTypes.node,
${extraIndent}};`
    );
}

function getClassComponentText(componentName, typescript) {
    return (
`class ${componentName} extends React.Component${typescript ? `<${componentName}Props, ${componentName}State>` : ''} {
    ${
        typescript
            ? ''
            : `static ${getPropTypesText(true, typescript)}\n    `
    }static defaultProps = {};

    state = {};

    render() {
        return (
            <>
                <div className={this.props.className}>{this.props.children}</div>
            </>
        );
    }
}`
    );
}

function getFunctionalComponentText(componentName, typescript) {
    let functionDefinitionStr =
`function ${componentName}({
    className = '',
    children,
}${typescript ? `: ${componentName}Props` : ''}) {
    return (
        <>
            <div className={className}>{children}</div>
        </>
    );
}`;

    if (!typescript) {
        functionDefinitionStr +=
`

${componentName}.${getPropTypesText(false, typescript)}`;
    }

    return functionDefinitionStr;
}

function getComponentText(componentName, { functionalComponent = false, typescript = false } = {}) {
    let propTypesImport = `import PropTypes from 'prop-types';`;

    if (typescript) {
        propTypesImport =
`\nexport interface ${componentName}Props {
    className?: string;
    children?: React.ReactNode;
}`;

        if (!functionalComponent) {
            propTypesImport += `\n\ninterface ${componentName}State {}`;
        }
    }

    return (
`import React from 'react';
${propTypesImport}

${functionalComponent ? getFunctionalComponentText(componentName, typescript) : getClassComponentText(componentName, typescript)}

export default ${componentName};
`
    );
}

function createComponentInDirectory(
    componentName,
    {
        dirName = '.',
        functionalComponent,
        typescript,
        soloComponent,
    } = {},
) {
    const dir = `./src/components/${dirName}/${soloComponent ? '.' : componentName}`;
    const componentFileExtension = typescript ? 'tsx' : 'jsx';
    const indexFileExtension = typescript ? 'ts' : 'js';
    const indexText = `import ${componentName} from './${componentName}';\n\nexport default ${componentName};\n`;
    const componentText = getComponentText(
        componentName,
        {
            functionalComponent,
            typescript,
        },
    );

    try {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(`${dir}/${componentName}.${componentFileExtension}`, componentText);

        if (!soloComponent) {
            fs.writeFileSync(`${dir}/index.${indexFileExtension}`, indexText);
        }

        console.log(`Created new "${componentName}" component in ${path.relative('.', dir)}/`);
    } catch (e) {
        error(e);
    }
}


function printUsage() {
    const usage = `Creates a new component inside its own folder under \`src/components/\` along with an \`index.[tj]s\` file.

    Usage:
        npm script (requires two hyphens):
            npm run createComponent -- [options] <ComponentName>
        Direct script call:
            ./createComponent.js [options] <ComponentName>

    Options:
        -d|--dir  <directory-name>  |   Directory under \`src/components/\` to place your component.
        -f|--func                   |   Make the component a functional component (default: class component).
        -j|--javascript             |   Use JavaScript to create the component (default: TypeScript).
        -s|--solo                   |   Create the component file only without nest it in its own directory.
`;

    console.log(usage);
    process.exit(1);
}

function error(err) {
    console.error(err);
    process.exit(1);
}

/**
 * Creates a new React component under `src/components/`.
 *
 * Optionally allows:
 * - Specifying a sub-directory.
 * - Making it a functional component (default is a class component).
 * - Using TypeScript (default is JavaScript).
 *
 * @param {string[]} [argv] - Array of option flags with the component name arg as the final array entry.
 */
function createComponent(argv) {
    const args = parseCliArgs({
        argv,
        removeNodeAndScriptFromArgs: !argv,
        varNameToFlagAliases: {
            functionalComponent: [ 'f', 'func' ],
            dirName: [ 'd', 'dir' ],
            javascript: [ 'j' ],
            soloComponent: [ 's', 'solo' ],
        },
        numArgs: {
            functionalComponent: 0,
            dirName: 1,
            typescript: 0,
            soloComponent: 0,
        },
    });

    const {
        functionalComponent,
        dirName,
        javascript,
        soloComponent,
    } = args;
    const componentName = args._?.[0];

    if (!componentName) {
        printUsage();
    }

    createComponentInDirectory(
        componentName,
        {
            dirName,
            functionalComponent,
            typescript: !javascript,
            soloComponent,
        },
    );
}

const isMain = !!process.argv?.[1].match(new RegExp(`${__filename}$`));

if (isMain) {
    createComponent();
}

module.exports = createComponent;
