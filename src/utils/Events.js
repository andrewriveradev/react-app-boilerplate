const importImageAsyncCache = {};

/**
 * Asynchronously imports the specified image from the 'assets/' folder.
 * Optionally returns the resolved image data encoded with Base64.
 * Since this uses dynamic imports, images are cached, so multiple calls
 * for the same asset don't need to be memoized.
 *
 * @param {string} image - Image file name under 'assets/'
 * @param {boolean} [base64=false] - Return base64-encoded image data instead of image src path
 * @returns {Promise<string>} - Path of the image (base64=false) or Base64-encoded image data (base64=true)
 */
export async function importImageAsync(image, base64 = false) {
    if (image != null && image !== '') {
        try {
            const cachedImageSrc = importImageAsyncCache[image];

            if (cachedImageSrc && (cachedImageSrc.base64 === base64)) {
                return importImageAsyncCache[image].imageSrc;
            }

            const module = await import(`@/assets/${image}`);
            const imageSrc = module.default;

            if (base64) {
                const imageSrcBase64 = await fetch(imageSrc).then(res => res.blob()).then(blob => new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        res(reader.result);
                    };
                    reader.onerror = () => {
                        rej(); // error handled below
                    };
                    reader.readAsDataURL(blob);
                }));

                importImageAsyncCache[image] = {
                    imageSrc: imageSrcBase64,
                    base64,
                };

                return imageSrcBase64;
            } else {
                importImageAsyncCache[image] = {
                    imageSrc,
                    base64,
                };
            }

            return imageSrc;
        } catch(error) {
            // default return below handles error case
        }
    }

    throw new Error(`${image} was not found`);
}

/**
 * Higher-order function that restricts `func` calls to only fire once per `delay` milliseconds.
 * Optionally, bind the value of `this` to its value when `debounce()` is called.
 * Optionally, call `func` when its first called instead of waiting `delay` milliseconds before its first call;
 * will still debounce subsequent calls.
 *
 * @param {function} func - Function to debounce
 * @param {number} delay - Milliseconds to wait before calling `func`
 * @param {Object} options - Options for debounced function
 * @param {boolean} [options.callOnFirstFuncCall=false] - Allow `func` to be called on first debounced function call
 * @param {boolean} [options.bindThis=false] - Binds the value of `this` to its value when `debounce()` is called
 * @returns {function(...[*]=)}
 */
export function debounce(func, delay, { callOnFirstFuncCall = false, bindThis = false } = {}) {
    let timeout;
    let self;

    if (bindThis) {
        self = this;
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
                func.call(self, ...args);
            }
        }, delay);

        if (isFirstCall) {
            func.call(self, ...args);
        }
    };
}

/**
 * Throttles a function to only be called once per time limit.
 *
 * @param {function} func - Function to throttle.
 * @param {number} timeLimit - Milliseconds to wait before allowing `func` to be called again.
 * @param {Object} options
 * @param {boolean} [options.bindThis=false] - Binds the value of `this` to its value when `throttle()` is called.
 * @returns {function} - Decorated, throttled function.
 */
export function throttle(func, timeLimit, { bindThis = false } = {}) {
    let wasCalled = false;
    let self;

    if (bindThis) {
        self = this;
    }

    return (...args) => {
        if (!wasCalled) {
            wasCalled = true;

            if (!bindThis) {
                self = this;
            }

            func.call(self, ...args);

            setTimeout(() => {
                wasCalled = false;
            }, timeLimit);
        }
    };
}

/**
 * Gets the path from the clicked element to the root.
 *
 * @param {Object} event - Click Event
 * @returns {[HTMLElement]} - Path from clicked element to the root, including `document` and `window`
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

    clickPath.push(document, window);

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

    for (let element of clickPath) {
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
    window.scrollTo(0, 0);
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

export function downloadDataAsFile(data, fileName, mimeType = 'text/plain;charset=utf-8') {
    const dataBlob = new Blob([ data ], { type: mimeType });

    // IE & Edge
    if (window.navigator && navigator.msSaveOrOpenBlob) {
        // Download prompt allows for saving or opening the file
        // navigator.msSaveBlob(dataBlob, fileName) only downloads it
        navigator.msSaveOrOpenBlob(dataBlob, fileName);

        return;
    }

    const dataBlobUrl = URL.createObjectURL(dataBlob);
    const anchor = document.createElement('a');

    anchor.style.display = 'none';
    anchor.download = fileName;
    anchor.href = dataBlobUrl;

    document.body.appendChild(anchor); // Required for Firefox
    anchor.click();
    document.body.removeChild(anchor);
}
