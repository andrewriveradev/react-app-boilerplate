import { MimeTypes } from '@/utils/Constants';

/**
 * Encodes a string with Base64.
 *
 * Optionally, creates a data URL if a `mimeType` is specified.
 *
 * @param {string} str - String to Base64-encode.
 * @param {string} [mimeType] - Mime type of the content; include this if you want a [Data URL]{@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs}.
 * @returns {string} - Base64-encoded string.
 */
export function encodeToBase64(str, mimeType) {
    try {
        const base64String = btoa(str);

        if (mimeType) {
            return `data:${mimeType};base64,${base64String}`;
        }

        return base64String;
    } catch (e) {
        // Could not encode
    }

    return null;
}

export function decodeBase64(base64String) {
    try {
        return atob(base64String);
    } catch (e) {
        // Could not decode, likely a malformed Base64 string
    }

    return null;
}

/**
 * Extracts the content string from a Base64 data URL.
 * Optionally, decode the content string for direct usage.
 *
 * e.g. Either `'aGVsbG8gd29ybGQ='` (`decode == false`) or
 * `'hello world'` (`decode == true`) would be extracted
 * from `'data:text/plain;base64,aGVsbG8gd29ybGQ='`.
 *
 * @param {string} dataUrl - Base64 data URL, including the `data`/`base64` header content.
 * @param {boolean} [decode=false] - Decode the Base64 content string.
 * @returns {string} - The Base64 content from the data URL.
 */
export function getTextFromBase64DataUrl(dataUrl = '', decode = false) {
    const encodedContentString = dataUrl.replace(/(.*?base64,)/, '');

    if (!decode) {
        return encodedContentString;
    }

    return decodeBase64(encodedContentString);
}

/**
 * Extracts the mime type from a Base64 data URL.
 *
 * e.g. `image/svg+xml` would be extracted
 * from `data:image/svg+xml;base64,aGVsbG8gd29ybGQ=`.
 *
 * @param {string} dataUrl - Base64 data URL, including the `data`/`base64` header content.
 * @returns {string} - The mime type from the data URL.
 */
export function getMimeTypeFromDataUrl(dataUrl = '') {
    try {
        return dataUrl.match(/(?<=data:)[^;]+/)[0];
    } catch (e) {
        // Could not find match, likely a malformed data URL
    }

    return null;
}

/**
 * Gets a {@code Document} from the passed {@code dataUrl}.
 *
 * Data URLs formatting: `data:MIME_TYPE;base64,BASE_64_STRING`.
 *
 * e.g. `data:image/svg+xml;base64,aGVsbG8gd29ybGQ=`
 *
 * @param {string} dataUrl - Data URL to parse into XML.
 * @returns {Document} - Respective Document object generated from the retrieved XML.
 */
export function getXmlDocFromDataUrl(dataUrl) {
    const mimeType = getMimeTypeFromDataUrl(dataUrl);
    const xmlText = getTextFromBase64DataUrl(dataUrl, true);
    const xmlParser = new DOMParser();

    return xmlParser.parseFromString(xmlText, mimeType || MimeTypes.XML);
}


/**
 * Hashes a string with the specified algorithm.
 *
 * Algorithms can be selected from the `hash.ALGORITHMS` object.
 *
 * @param {string} text - String to hash.
 * @param {string} [algorithm='SHA-256'] - The algorithm to use when hashing the supplied string; valid options can be used via the `hash.ALGORITHMS` object.
 * @returns {Promise<string>} - The hashed string.
 * @see [SubtleCrypt.digest]{@link https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string}
 */
export async function hash(text, algorithm = hash.ALGORITHMS.Sha256) {
    const validAlgorithms = new Set(Object.values(hash.ALGORITHMS));

    if (!validAlgorithms.has(algorithm)) {
        throw new TypeError(`Error: Hash algorithm "${algorithm}" not supported. Valid values are: [ ${[ ...validAlgorithms ].join(', ')} ].`);
    }

    const msgUint8 = new TextEncoder().encode(text);  // Encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);  // Hash the text
    const hashArray = Array.from(new Uint8Array(hashBuffer));  // Convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');  // Convert bytes to hex string

    return hashHex;
}
hash.ALGORITHMS = {
    Sha1: 'SHA-1',
    Sha256: 'SHA-256',
    Sha384: 'SHA-384',
    Sha512: 'SHA-512',
};


/**
 * Converts hyphen-case and snake_case to camelCase.
 *
 * @param {string} str - Hyphen/snake-case string to convert to camelCase.
 * @returns {string} - camelCase version of the passed string.
 * @see [String.replace(regex, func)]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_function_as_a_parameter}
 */
export function hyphenOrSnakeCaseToCamelCase(str) {
    return str.replace(/[-_]([^-_])/g, (fullStrMatch, matchGroup) => {
        // One match group: The letter after a hyphen/underscore.
        // Uppercase it and discard the hyphen/underscore.
        return matchGroup.toUpperCase();
    });
}


/*
 * Useful description of RegExp flags: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#advanced_searching_with_flags
 * d - Generate indices for substring matches. (RegExp.prototype.hasIndices)
 * m - Multi-line search. (RegExp.prototype.multiline)
 * s - Allows . to match newline characters. (RegExp.prototype.dotAll)
 * g - Global search. (RegExp.prototype.global)
 * i - Case-insensitive search. (RegExp.prototype.ignoreCase)
 * u - "unicode"; treat a pattern as a sequence of unicode code points. (RegExp.prototype.unicode)
 * y - Perform a "sticky" search that matches starting at the current position in the target string. See [sticky]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/sticky}.
 */

/**
 * Extracts all quoted strings nested within a single string.
 *
 * @param {string} str - String from which to extract quoted string content.
 * @returns {string[]} - All quoted strings.
 */
export function extractQuotedStrings(str) {
    /**
     * (quote)
     * (non-capturing group since we don't care about the inner content without the outer strings
     *   either:
     *     anything that is not a quote nor a backslash - NOTE cannot use capture groups in [] or [^]
     *     anything after a backslash (including quotes b/c escaping them keeps them in the string)
     *     any number of newlines (since strings can span multiple lines)
     * ) - any number of repetitions (allows empty and filled strings)
     * the same quote that began the string
     *
     * @type {RegExp}
     */
    const quotedStringRegex = /(['"])(?:(?!\1|\\).|\\.|\n*)*\1/g; // change \1 to \2 if nesting this whole regex inside another group of parentheses

    return str.match(quotedStringRegex);
}

/**
 * Gets all the letters of the english alphabet.
 *
 * @param [options]
 * @param {boolean} [options.lowercase=true] - If lowercase letters should be included.
 * @param {boolean} [options.uppercase=true] - If uppercase letters should be included.
 * @returns {string[]}
 */
export function getEnglishAlphabet({
    lowercase = true,
    uppercase = true,
} = {}) {
    const getUpperOrLowerCaseAlphabetFromA = startCharCode => Array.from({ length: 26 })
        .map((nul, index) => index + startCharCode)
        .map(charCode => String.fromCharCode(charCode));
    const alphabetLowercase = getUpperOrLowerCaseAlphabetFromA('a'.charCodeAt(0));
    const alphabetUppercase = getUpperOrLowerCaseAlphabetFromA('A'.charCodeAt(0));

    if (lowercase && uppercase) {
        return [ ...alphabetLowercase, ...alphabetUppercase ];
    }

    if (lowercase) {
        return alphabetLowercase;
    }

    if (uppercase) {
        return alphabetUppercase;
    }
}
