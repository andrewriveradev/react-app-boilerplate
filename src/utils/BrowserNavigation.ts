import type {
    Indexable,
} from '@/types';


/**
 * Gets URL query parameter entries as either key-value pairs in an object
 * or as a string formatted how they would appear in the URL bar (e.g. `?a=b&c=d`).
 *
 * Defaults to getting the query parameters from the current page's URL as an object.
 *
 * An attempt will be made to parse/stringify query values to handle objects, arrays, etc.
 *
 * @param [input=location.search+location.hash] - URL search/hash string or 2D matrix to convert to an object,
 *                                                or an object to convert to a search+hash string.
 * @param [options]
 * @param [options.delimiter] - Delimiter to use for multi-value query param keys; if unspecified, multiple keys will be used (e.g. '?a=A&a=B').
 * @returns All query param key-value pairs, including the hash entry (if input is a string or array) or URL search+hash string (if input is an object).
 */
export function getQueryParams<Input extends string | Indexable | Array<Array<string>> = string>(
    input?: Input,
    options?: {
        delimiter?: string;
    },
): Input extends string | null | undefined | never
    ? Indexable
    : string;
export function getQueryParams(
    input: Parameters<typeof getQueryParams>[0] = self.location.search + self.location.hash,
    {
        delimiter,
    }: Parameters<typeof getQueryParams>[1] = {},
) {
    let fromString!: string;
    let fromObj!: Indexable;
    let from2dMatrix!: Array<Array<string>>;

    if (typeof input === typeof '') {
        fromString = input as string;
    } else if (Array.isArray(input)) {
        from2dMatrix = input;
    } else if (typeof input === typeof {}) {
        fromObj = input as Indexable;
    } else {
        throw new TypeError(`Type "${typeof input}" is not supported. Please use a string or object.`);
    }

    if (fromObj) {
        fromObj = { ...fromObj };

        const hash = fromObj['#'] || '';

        delete fromObj['#'];

        const getEncodedKeyValStr = (key: string, val: string) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;

        const queryParamEntries = Object.entries(fromObj);
        const queryString = queryParamEntries.length > 0
            ? `?${
                queryParamEntries
                    .map(([ queryKey, queryValue ]) => {
                        if (Array.isArray(queryValue)) {
                            if (delimiter) {
                                return getEncodedKeyValStr(queryKey, queryValue.join(delimiter));
                            }

                            return queryValue
                                .map(val => getEncodedKeyValStr(queryKey, val))
                                .join('&');
                        }

                        if (queryValue == null) {
                            // Convert null/undefined to empty string
                            queryValue = '';
                        } else if (typeof queryValue === typeof {}) {
                            // Stringify objects, arrays, etc.
                            return getEncodedKeyValStr(queryKey, JSON.stringify(queryValue));
                        }

                        return getEncodedKeyValStr(queryKey, queryValue as string);
                    })
                    .join('&')
            }`
            : '';

        return queryString + (hash ? `#${hash}` : '');
    }

    const queryParamsObj: Indexable = {};
    let urlSearchParamsEntries;

    if (from2dMatrix) {
        const stringifiedMatrixValues = from2dMatrix.map(([ key, value ]) => {
            if (value && (typeof value === typeof {})) {
                // Arrays are objects so only one `typeof` check is needed
                value = JSON.stringify(value);
            }

            return [ key, value ];
        });

        urlSearchParamsEntries = [ ...new URLSearchParams(stringifiedMatrixValues).entries() ];
    } else {
        const queryParamHashString = fromString.match(/([?#].*$)/i)?.[0] ?? '';
        const [ urlSearchQuery, hash ] = queryParamHashString.split('#');

        if (hash) {
            queryParamsObj['#'] = hash;
        }

        urlSearchParamsEntries = [ ...new URLSearchParams(urlSearchQuery).entries() ];
    }

    const attemptParseJson = (str: string) => {
        try {
            return JSON.parse(str);
        } catch (e) {}

        return str;
    };

    return urlSearchParamsEntries
        .reduce((queryParams, nextQueryParam) => {
            let [ key, value ]: [ string, string | string[] ] = nextQueryParam;

            if (delimiter != null) {
                value = value.split(delimiter);

                if (value.length === 0) {
                    value = '';
                } else if (value.length === 1) {
                    value = value[0];
                }
            }

            if (Array.isArray(value)) {
                value = value.map(val => attemptParseJson(val)) as string[];
            } else {
                value = attemptParseJson(value) as string;
            }

            if (key in queryParams) {
                if (!Array.isArray(value)) {
                    value = [ value ]; // cast to array for easier boolean logic below
                }

                // Remove duplicate entries using a Set, which maintains insertion order in JS
                let newValuesSet;

                if (Array.isArray(queryParams[key])) {
                    newValuesSet = new Set([
                        ...(queryParams[key] as unknown[]),
                        ...value,
                    ]);
                } else {
                    newValuesSet = new Set([
                        queryParams[key],
                        ...value,
                    ]);
                }

                queryParams[key] = [ ...newValuesSet ]; // Cast back to an array
            } else {
                queryParams[key] = value;
            }

            return queryParams;
        }, queryParamsObj);
}


/**
 * Extracts the different segments from a URL segments and adds automatic parsing of query parameters/hash
 * into an object. Also normalizes resulting strings to never contain a trailing slash.
 *
 * @param url - URL to parse for query parameters
 * @returns URL segments.
 */
export function getUrlSegments(url: string = self.location.href) {
    let fullUrl = url;
    let protocol = '';
    let domain = '';
    let port = '';
    let origin = '';
    let pathname = '';
    let queryString = '';
    let queryParamHashString = '';
    let hash = '';

    try {
        // Variables are already declared above. Setting the spread in parentheses like
        // this sets them just like `const { a, b } = obj` would without requiring `const`
        ({
            href: fullUrl, // full URL, normalized to resolve `/path/../path/` => `/path/` and adds a '/' at the end of the pathname
            origin, // protocol + '//' + hostname + ':' + port
            protocol, // protocol + ':'
            // host, // hostname + ':' + port
            hostname: domain, // i.e. domain
            port, // port (without ':')
            pathname, // includes '/' even if not specified, unless query params/hash present
            search: queryString, // empty string or '?...' excluding the hash portion at the end
            // searchParams, // new URLSearchParams(`search`)
            hash, // empty string or '#...'
            // username, // empty string or <something>
            // password, // empty string or <something>
        } = new URL(url));
    } catch (e) {
        /*
         * Either `URL` isn't defined or some other error, so try to parse it manually.
         *
         * All regex strings use `*` to mark them as optional when capturing so that
         * they're always the same location in the resulting array, regardless of whether
         * or not they exist.
         *
         * URL segment markers must each ignore all special characters used by
         * those after it to avoid capturing the next segment's content.
         */
        const protocolRegex = '([^:/?#]*://)?'; // include `://` for `origin` creation below
        const domainRegex = '([^:/?#]*)'; // capture everything after the protocol but before the port, pathname, query-params, or hash
        const portRegex = '(?::)?(\\d*)'; // colon followed by digits; non-capture must be outside capture group so it isn't included in output
        const pathnameRegex = '([^?#]*)'; // everything after the origin (starts with `/`) but before query-params or hash
        const queryParamRegex = '([^#]*)'; // everything before the hash (starts with `?`)
        const hashRegex = '(.*)'; // anything leftover after the above capture groups have done their job (starts with `#`)
        const urlPiecesRegex = new RegExp(`^${protocolRegex}${domainRegex}${portRegex}${pathnameRegex}${queryParamRegex}${hashRegex}$`);

        [
            fullUrl,
            protocol,
            domain,
            port,
            pathname,
            queryString,
            hash,
        ] = (urlPiecesRegex.exec(url) as string[]);
        origin = protocol + domain + (port ? `:${port}` : '');
    }

    queryParamHashString = queryString + hash;
    // protocol can be `undefined` due to having to nest the entire thing in `()?`
    protocol = (protocol || '').replace(/:\/?\/?/, '');

    // normalize strings: remove trailing slashes and leading ? or #
    fullUrl = fullUrl.replace(/\/+(?=\?|#|$)/, ''); // fullUrl could have `/` followed by query params, hash, or end of string
    origin = origin.replace(/\/+$/, '');
    pathname = pathname.replace(/\/+$/, '');
    queryString = queryString.substring(1);
    hash = hash.substring(1);

    const queryParamMap = getQueryParams(queryParamHashString);

    return {
        fullUrl,
        protocol,
        domain,
        port,
        origin,
        pathname,
        queryParamHashString,
        queryParamMap,
        queryString,
        hash,
    };
}


/**
 * Modifies the URL's query parameter(s), optionally changing the current page's location.
 * Changing the location doesn't refresh the page, rather it pushes the new URL to the {@link history}.
 *
 * If only a key (as a string) is specified without a value, then it deletes that query param.
 *
 * @param key - Query param key, or object of query parameter key-value pairs.
 * @param [value] - Query param value to be assigned to the key (if key is a string).
 * @param [options]
 * @param [options.url] - URL to modify instead of the current page's URL.
 * @param [options.overwriteQueryParams] - Overwrites all query params with those specified
 * @returns - All resulting query param key-value pairs, including the URL hash entry (if present).
 */
export function modifyQueryParams<ReturnUrl extends boolean = false>(
    key: string | Indexable,
    value?: unknown,
    options?: {
        url?: string;
        overwriteQueryParams?: boolean;
        pushOnHistory?: boolean;
        returnUrl?: ReturnUrl;
    },
): ReturnUrl extends true
    ? string
    : Indexable;
export function modifyQueryParams(key: string | Indexable, value?: unknown, {
    url,
    overwriteQueryParams,
    pushOnHistory,
    returnUrl,
}: Parameters<typeof modifyQueryParams>[2] = {}) {
    const { origin, pathname } = getUrlSegments(url);
    let queryParams = getQueryParams();

    if (typeof key === typeof {}) {
        const newQueryParamsObj = key as Indexable;

        if (overwriteQueryParams) {
            queryParams = newQueryParamsObj;
        } else {
            queryParams = {
                ...queryParams,
                ...newQueryParamsObj,
            };
        }
    } else if (typeof key === typeof '') {
        const queryParamKey = key as string;

        if (value) {
            if (overwriteQueryParams) {
                queryParams = {
                    [queryParamKey]: value,
                };
            } else {
                queryParams[queryParamKey] = value;
            }
        } else {
            delete queryParams[queryParamKey];
        }
    }

    // Convert any URL-unsafe characters to safe ones
    const queryParamsString = getQueryParams(queryParams);
    // Resulting URL with the same origin/pathname and new query params
    const newUrl = origin + pathname + queryParamsString;

    if (pushOnHistory) {
        history.pushState(
            null,
            '',
            newUrl,
        );
    }

    return returnUrl ? newUrl : getQueryParams();
}


/**
 * Determines if a URL is an IP address vs a domain name.
 *
 * Optionally, determines whether or not the IP address in the URL is associated with `localhost`.
 *
 * @param url - URL to test.
 * @param [options]
 * @param [options.onlyLocalhost=false] - If only localhost IP addresses should be checked.
 * @param [options.includeLocalhostDomain=true] - If `https?://localhost` should be included in `onlyLocalhost` check.
 * @returns - If the URL is an IP address (and if it's an IP address for localhost if desired).
 */
export function isIpAddress(url: string, {
    onlyLocalhost = false,
    includeLocalhostDomain = true,
} = {}) {
    if (onlyLocalhost) {
        const { domain } = getUrlSegments(url);

        // TODO IPv6
        // see: https://en.wikipedia.org/wiki/Reserved_IP_addresses
        return !!(
            domain.match(/^((127|19[28]|1?0)\.)|(172\.(1[6-9]|2|31))/)
            || (
                includeLocalhostDomain &&
                domain.match(/localhost/)
            )
        );
    }

    return !!url.match(/^([^/]*:\/\/)?(\d{1,3}\.){3}(\d{1,3}(?!\.))/);
}


/**
 * Determines if the passed URL string is a valid URL.
 *
 * @param url - URL to test.
 * @param [options]
 * @param [options.allowOnlyPathname=true] - If a relative pathname-based URL will be considered as valid.
 * @returns - If the URL is valid.
 */
export function isUrl(url: string, {
    allowOnlyPathname = true,
} = {}) {
    try {
        new URL(url);
        return true;
    } catch (notValidUrl) {
        if (allowOnlyPathname) {
            return !!url.match(/^\.*\/.+/);
        }
    }

    return false;
}


/**
 * Extracts the final pathname segment from a URL, indicated by everything between
 * the last slash and query params/hash entry.
 *
 * Useful for getting file names, last REST argument, or API endpoint name.
 *
 * Will return an empty string if the URL ends with a slash
 *
 * @param url - URL string from which to extract the final pathname segment.
 * @returns - The final pathname segment or empty string.
 */
export function extractFinalPathnameSegmentFromUrl(url = '') {
    return url.replace(/.*\/([^/?#]*)(?:$|\?|#).*/, '$1');
}
