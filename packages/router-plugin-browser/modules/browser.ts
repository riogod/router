/**
 * @fileoverview Browser abstraction layer for router integration.
 * Provides a consistent API for browser history and location operations,
 * with fallbacks for non-browser environments (SSR, testing).
 * 
 */

import { Browser } from './types'

/**
 * Creates a function that always returns the same value.
 * Used for creating fallback implementations in non-browser environments.
 * 
 * @param {any} arg - The value to return
 * @returns {Function} A function that returns the provided value
 * @private
 */
const value = arg => () => arg

/**
 * No-operation function used as fallback in non-browser environments.
 * @private
 */
const noop = () => {}

/**
 * Detects if we're running in a browser environment with history support.
 * @private
 */
const isBrowser = typeof window !== 'undefined' && window.history

/**
 * Get the base pathname of the current page.
 * Used to determine the application's base URL.
 * 
 * @returns {string} The current pathname (e.g., '/myapp/page')
 * @private
 */
const getBase = () => window.location.pathname

/**
 * Check if the browser supports popstate events on hash changes.
 * Internet Explorer (Trident) requires separate hashchange listeners.
 * 
 * @returns {boolean} True if popstate works with hash changes
 * @private
 */
const supportsPopStateOnHashChange = () =>
    window.navigator.userAgent.indexOf('Trident') === -1

/**
 * Add a new entry to the browser history stack.
 * 
 * @param {any} state - The state object to store with this history entry
 * @param {string} title - The title for this history entry
 * @param {string} path - The URL path for this history entry
 * @private
 */
const pushState = (state, title, path) =>
    window.history.pushState(state, title, path)

/**
 * Replace the current history entry without adding a new one.
 * 
 * @param {any} state - The state object to store with this history entry
 * @param {string} title - The title for this history entry
 * @param {string} path - The URL path for this history entry
 * @private
 */
const replaceState = (state, title, path) =>
    window.history.replaceState(state, title, path)

/**
 * Add listeners for browser navigation events.
 * Handles both popstate and hashchange events based on browser capabilities.
 * 
 * @param {Function} fn - The event handler function
 * @param {Object} opts - Plugin options that determine listener behavior
 * @param {boolean} opts.useHash - Whether hash-based routing is enabled
 * @returns {Function} A function to remove all added listeners
 * @private
 */
const addPopstateListener = (fn, opts) => {
    const shouldAddHashChangeListener =
        opts.useHash && !supportsPopStateOnHashChange()

    window.addEventListener('popstate', fn)

    if (shouldAddHashChangeListener) {
        window.addEventListener('hashchange', fn)
    }

    return () => {
        window.removeEventListener('popstate', fn)

        if (shouldAddHashChangeListener) {
            window.removeEventListener('hashchange', fn)
        }
    }
}

/**
 * Extract the current location path based on plugin configuration.
 * Handles both hash-based and HTML5 history routing modes.
 * 
 * @param {Object} opts - Plugin options that determine how to extract the path
 * @param {boolean} opts.useHash - Whether to extract from hash or pathname
 * @param {string} opts.hashPrefix - Prefix to remove from hash
 * @param {string} opts.base - Base path to remove from pathname
 * @returns {string} The current path including search parameters
 * @private
 */
const getLocation = opts => {
    const path = opts.useHash
        ? window.location.hash.replace(new RegExp('^#' + opts.hashPrefix), '')
        : window.location.pathname.replace(new RegExp('^' + opts.base), '')

    // Fix issue with browsers that don't URL encode characters (Edge)
    const correctedPath = safelyEncodePath(path)

    return (correctedPath || '/') + window.location.search
}

/**
 * Safely encode a URL path, handling malformed URIs.
 * Fixes issues with browsers that don't properly encode special characters.
 * 
 * @param {string} path - The path to encode
 * @returns {string} The safely encoded path
 * @private
 */
const safelyEncodePath = path => {
    try {
        return encodeURI(decodeURI(path))
    } catch (_) {
        return path
    }
}

/**
 * Get the current browser history state.
 * 
 * @returns {any} The current history state object, or null if none
 * @private
 */
const getState = () => window.history.state

/**
 * Get the current URL hash.
 * 
 * @returns {string} The hash portion of the URL (including the # symbol)
 * @private
 */
const getHash = () => window.location.hash

/**
 * Browser abstraction object that provides a consistent API
 * for both browser and non-browser environments.
 * 
 * In browser environments, uses actual browser APIs.
 * In non-browser environments (SSR, testing), provides safe fallbacks.
 * 
 * @type {Browser}
 */
let browser = {}
if (isBrowser) {
    /**
     * Browser implementation using real browser APIs.
     * Used when running in a browser environment with history support.
     */
    browser = {
        getBase,
        pushState,
        replaceState,
        addPopstateListener,
        getLocation,
        getState,
        getHash
    }
} else {
    /**
     * Fallback implementation for non-browser environments.
     * Provides safe no-op functions and default values for SSR and testing.
     */
    browser = {
        getBase: value(''),
        pushState: noop,
        replaceState: noop,
        addPopstateListener: noop,
        getLocation: value(''),
        getState: value(null),
        getHash: value('')
    }
}

/**
 * Default browser abstraction instance.
 * Automatically detects the environment and provides appropriate implementation.
 * 
 * @example
 * ```typescript
 * import browser from '@riogz/router-plugin-browser/browser'
 * 
 * // Safe to use in any environment
 * const currentPath = browser.getLocation({ useHash: false, base: '' })
 * browser.pushState({ name: 'home' }, 'Home', '/home')
 * ```
 */
export default browser as Browser
