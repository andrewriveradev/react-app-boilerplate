const YargsParser = require('yargs-parser');

/**
 * Parse arguments using yargs-parser (simpler and quicker to use than yargs).
 *
 * If calling a script from `npm run`, a double-hyphen is required,
 * e.g. `npm run myScript -- --opt1 val1 -b val2 positional args`
 *
 * Both hyphenated (`--my-flag`) and camelCase (`--myFlag`) forms are accepted.
 *
 * Technically, single (`-my-flag`) and double (`--m`) hyphens are allowed for all flags, but
 * it's standard to use single hyphens for single letters and vice versa for consistency
 * with other languages/libraries.
 *
 * @param {Object} options
 * @param {string[]} [options.argv=process.argv] - Arg array to parse.
 * @param {boolean} [options.removeNodeAndScriptFromArgs=true] - Remove preceding `node myScript` from args; Set to `false` if not using `process.argv`.
 * @param {boolean} [options.sliceAfterFirstDoubleHyphen=false] - Begin arg parsing only after `--`; Use only if script will be called by another script, thus requiring `npm run script1 -- -- args-for-nested-script2`.
 * @param {boolean} [options.clearArgvAfterProcessing=true] - If `argv` should be emptied after arg parsing.
 * @param {Object<string, string[]>} [options.varNameToFlagAliases] - Mapping of one flag alias (typically the desired camelCase variable name used in your logic) to an array of other flag aliases; The key/val orders don't matter, all will be populated the same.
 * @param {Object} [options.numArgs] - Number of arguments the options take; Use if `-m|--my-arg` doesn't take any arguments and should be cast to a boolean instead of gobbling up subsequent non-arg entries.
 * @param {Object} [options.defaultValues] - Default value for each option (only one needs to be specified); If the flag is a boolean, DO NOT default it to `false`.
 * @returns {Object} - Parsed options with the format `key: (value|true)` and `_: [$@]`.
 */
function parseCliArgs(
    {
        argv = process.argv,
        removeNodeAndScriptFromArgs = true,
        sliceAfterFirstDoubleHyphen = false,
        clearArgvAfterProcessing = true,
        varNameToFlagAliases,
        numArgs,
        defaultValues,
    } = {},
) {
    // argv = [ 'path/to/node', 'myScript', ...args ]
    let argvStartIndex = removeNodeAndScriptFromArgs ? 2 : 0;

    if (sliceAfterFirstDoubleHyphen) {
        argvStartIndex = argv.indexOf('--') + 1;

        if (argvStartIndex === 0) {
            argvStartIndex = argv.length;
        }
    }

    const customArgv = argv.slice(argvStartIndex);
    const customArgs = YargsParser(
        customArgv,
        {
            alias: varNameToFlagAliases,
            default: defaultValues,
            narg: numArgs,
        },
    );

    if (clearArgvAfterProcessing) {
        argv.splice(0, argv.length);
    }

    return customArgs;
}

module.exports = parseCliArgs;
