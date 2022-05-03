import { fetchAsBase64 } from '@/utils/Network';
import { MimeTypes } from '@/utils/Constants';
import { getMimeTypeFromDataUrl } from '@/utils/Text';


/**
 * Asynchronously imports the specified binary asset from the 'assets/' folder.
 * Could be images, PDFs, videos, etc.
 *
 * Optionally returns the resolved asset data encoded with Base64.
 * Since this uses dynamic imports, results are cached, so multiple calls
 * for the same asset don't need to be memoized.
 *
 * @param {string} assetRelPath - Relative path to the asset file under 'assets/'.
 * @param {boolean} [base64=false] - Return Base64-encoded data instead of the `src` url.
 * @returns {Promise<string>} - Path of the asset (base64=false) or Base64-encoded asset data (base64=true)
 */
export async function importAssetAsync(assetRelPath, base64 = false) {
    if (assetRelPath != null && assetRelPath !== '') {
        // const pathIsFromAssetsDirRegex = new RegExp(`^${location.origin}/.*/?${process.env.PUBLIC_URL}/assets/`, 'i');
        try {
            // Alternative: // const module = await import(/* webpackMode: 'lazy-once' */ `@/assets/${assetRelPath}`);
            // See:
            // - https://stackoverflow.com/questions/49121053/how-to-use-a-webpack-dynamic-import-with-a-variable-query-string/65298694#65298694
            // - https://webpack.js.org/api/module-methods/#magic-comments
            // - https://stackoverflow.com/questions/42908116/webpack-critical-dependency-the-request-of-a-dependency-is-an-expression
            // - Actual solution: https://webpack.js.org/plugins/context-replacement-plugin/
            const module = await import(`@/assets/${assetRelPath}`);
            const assetSrc = module.default;

            if (base64) {
                return await fetchAsBase64(assetSrc);
            }

            return assetSrc;
        } catch (error) {
            // default return below handles error case
        }
    }

    throw new Error(`${assetRelPath} was not found`);
}


/**
 * Higher-order function that restricts `func` calls to only fire once per `delay` milliseconds.
 * Optionally, bind the value of `this` to its value when `debounce()` is called.
 * Optionally, call `func` when its first called instead of waiting `delay` milliseconds before its first call;
 * will still debounce subsequent calls.
 *
 * @param {function} func - Function to debounce
 * @param {number} delay - Milliseconds to wait before calling `func`
 * @param {Object} [options] - Options for debounced function
 * @param {boolean} [options.callOnFirstFuncCall=false] - Allow `func` to be called on first debounced function call
 * @param {Object} [options.bindThis] - Binds the value of `this` to the specified value
 * @returns {function(...[*]=)}
 */
export function debounce(func, delay, { callOnFirstFuncCall = false, bindThis } = {}) {
    let timeout;
    let self;

    if (bindThis) {
        self = bindThis;
    }

    return (...args) => {
        if (!bindThis) {
            self = this;
        }

        // timeout == null only when the func is called (either first call or when setTimeout fires)
        // so this is false on subsequent calls
        const isFirstCall = callOnFirstFuncCall && timeout == null;

        clearTimeout(timeout);

        timeout = setTimeout(() => {
            timeout = null;

            if (!isFirstCall) { // don't call func again if it was called on first run, only on subsequent runs
                return func.call(self, ...args);
            }
        }, delay);

        if (isFirstCall) {
            return func.call(self, ...args);
        }
    };
}


/**
 * Throttles a function to only be called once per time limit.
 *
 * @param {function} func - Function to throttle.
 * @param {number} timeLimit - Milliseconds to wait before allowing `func` to be called again.
 * @param {Object} [options]
 * @param {Object} [options.bindThis] - Binds the value of `this` to the specified value.
 * @returns {function} - Decorated, throttled function.
 */
export function throttle(func, timeLimit, { bindThis } = {}) {
    let wasCalled = false;
    let self;

    if (bindThis) {
        self = bindThis;
    }

    return (...args) => {
        if (!wasCalled) {
            wasCalled = true;

            if (!bindThis) {
                self = this;
            }

            const retVal = func.call(self, ...args);

            setTimeout(() => {
                wasCalled = false;
            }, timeLimit);

            return retVal;
        }
    };
}


/**
 * Gets the path from the clicked element to the root.
 *
 * @param {Object} event - Click Event
 * @returns {[HTMLElement]} - Path from clicked element to the root, including `document` and `window`/`self`
 */
export function getClickPath(event) {
    if (!event || (Array.isArray(event) && event.length === 0)) {
        return [];
    }

    if (event.path) {
        return event.path;
    }

    // support for browsers without clickEvent.path
    const clickPath = [];
    let element = event.target;

    while (element) {
        clickPath.push(element);
        element = element.parentElement;
    }

    clickPath.push(document, self);

    return clickPath;
}


/**
 * HTML element properties object used in searching for an element
 *
 * @global
 * @typedef {Object} ElementProps
 * @property {string} attribute - Attribute of HTML element to compare the value to
 * @property {string} value - Value of the desired HTML element to search for
 */

/**
 * Determines if a click-path generated by an onClick event contains a given element.
 *
 * @param {string} attribute - Attribute of HTML element to compare the value to
 * @param {string} value - Value of the desired HTML element to search for
 * @param {[HTMLElement]} clickPath - onClick event's `path` value
 * @returns {boolean} - If the element described by `attribute` and `value` exists in the click-path
 */
export function elementIsInClickPath({ attribute, value }, clickPath) {
    let elementIsInPath = false;

    for (const element of clickPath) {
        if (element instanceof HTMLElement) {
            const elemAttr = element.getAttribute(attribute);

            if (elemAttr && elemAttr.includes(value)) {
                elementIsInPath = true;
                break;
            }
        }
    }

    return elementIsInPath;
}


/**
 * Resets the window scroll location to the top of the screen
 */
export function scrollWindowToTop() {
    // scrollTo() is supported on all browsers
    self.scrollTo(0, 0);
}


/**
 * Sets the scrolling ability of the whole `document.body`.
 * Useful for controlling the app's ability to scroll from any
 * component.
 *
 * Since `document.body` is outside of the control of React,
 * set the style manually. Default value is ''.
 *
 * @param allowScrolling
 */
export function setDocumentScrolling(allowScrolling = true) {
    document.body.style.overflow = allowScrolling ? 'auto' : 'hidden';
}


/**
 * Downloads the specified data with the desired filename and MIME type.
 *
 * @param {(string | Blob)} data - Data to download.
 * @param {string} [fileName] - Filename for the download.
 * @param {string} [mimeType] - MIME type of the download content.
 */
export function downloadDataAsFile(data, {
    fileName = 'download',
    mimeType = getMimeTypeFromDataUrl(data) || MimeTypes.TEXT,
} = {}) {
    let downloadData = data;
    const isBase64Data = data?.match?.(/^data(:[^;]*);base64/i);

    if (!isBase64Data) {
        const dataBlob = new Blob([ data ], { type: mimeType });
        const dataBlobUrl = URL?.createObjectURL?.(dataBlob);

        downloadData = dataBlobUrl;
    }

    // IE & Edge
    if (self.navigator && navigator.msSaveOrOpenBlob) {
        // Download prompt allows for saving or opening the file
        // navigator.msSaveBlob(dataBlob, fileName) only downloads it
        navigator.msSaveOrOpenBlob(downloadData, fileName);

        return;
    }

    const anchor = document.createElement('a');

    anchor.style.display = 'none';
    anchor.download = fileName;
    anchor.href = downloadData;

    document.body.appendChild(anchor); // Required for Firefox
    anchor.click();
    document.body.removeChild(anchor);
}
