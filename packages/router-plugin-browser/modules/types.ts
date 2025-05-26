/**
 * @fileoverview Type definitions for the router browser plugin.
 * Defines interfaces for browser integration, history state management,
 * and plugin configuration options.
 * 
 * @module @riogz/router-plugin-browser/types
 */

import { State } from '@riogz/router'

/**
 * Configuration options for the browser plugin.
 * Controls how the router integrates with browser history and URL handling.
 * 
 * @interface BrowserPluginOptions
 * 
 * @example
 * ```typescript
 * // Basic configuration
 * const options: BrowserPluginOptions = {
 *   useHash: false,
 *   base: '/app'
 * }
 * 
 * // Hash-based routing
 * const hashOptions: BrowserPluginOptions = {
 *   useHash: true,
 *   hashPrefix: '!',
 *   preserveHash: true
 * }
 * ```
 */
export interface BrowserPluginOptions {
    /**
     * Whether to force deactivation of routes during transitions.
     * When true, routes will be deactivated even if they normally wouldn't be.
     * 
     * @default true
     * 
     * @example
     * ```typescript
     * // Force all routes to deactivate during transitions
     * { forceDeactivate: true }
     * 
     * // Allow routes to stay active when possible
     * { forceDeactivate: false }
     * ```
     */
    forceDeactivate?: boolean

    /**
     * Whether to use hash-based routing instead of HTML5 history API.
     * When true, routes will be stored in the URL hash (e.g., #/users/123).
     * 
     * @default false
     * 
     * @example
     * ```typescript
     * // HTML5 history: /users/123
     * { useHash: false }
     * 
     * // Hash routing: #/users/123
     * { useHash: true }
     * ```
     */
    useHash?: boolean

    /**
     * Prefix to add after the hash symbol when using hash-based routing.
     * Only used when `useHash` is true.
     * 
     * @default ''
     * 
     * @example
     * ```typescript
     * // URL: #/users/123
     * { useHash: true, hashPrefix: '' }
     * 
     * // URL: #!/users/123
     * { useHash: true, hashPrefix: '!' }
     * ```
     */
    hashPrefix?: string

    /**
     * Base path for the application. All routes will be relative to this base.
     * Useful when the app is deployed in a subdirectory.
     * 
     * @default ''
     * 
     * @example
     * ```typescript
     * // App at root: /users/123
     * { base: '' }
     * 
     * // App in subdirectory: /myapp/users/123
     * { base: '/myapp' }
     * ```
     */
    base?: string | null

    /**
     * Whether to merge router state with existing browser history state.
     * When true, preserves additional properties in history.state.
     * 
     * @default false
     * 
     * @example
     * ```typescript
     * // Replace entire state
     * { mergeState: false }
     * 
     * // Merge with existing state
     * { mergeState: true }
     * ```
     */
    mergeState?: boolean

    /**
     * Whether to preserve the URL hash when transitioning between routes.
     * Only applies when `useHash` is false.
     * 
     * @default true
     * 
     * @example
     * ```typescript
     * // Preserve hash: /users/123#section1 -> /profile/456#section1
     * { preserveHash: true }
     * 
     * // Remove hash: /users/123#section1 -> /profile/456
     * { preserveHash: false }
     * ```
     */
    preserveHash?: boolean
}

/**
 * Interface for browser abstraction layer.
 * Provides a consistent API for browser history and location operations,
 * with support for both real browser environments and testing/SSR scenarios.
 * 
 * @interface Browser
 * 
 * @example
 * ```typescript
 * // Custom browser implementation for testing
 * const mockBrowser: Browser = {
 *   getBase: () => '/test',
 *   pushState: (state, title, path) => console.log('Push:', path),
 *   replaceState: (state, title, path) => console.log('Replace:', path),
 *   addPopstateListener: (fn, opts) => () => {},
 *   getLocation: (opts) => '/current/path',
 *   getState: () => null,
 *   getHash: () => ''
 * }
 * ```
 */
export interface Browser {
    /**
     * Get the base path of the current page.
     * Used to determine the application's base URL.
     * 
     * @returns {string} The base path (e.g., '/myapp')
     */
    getBase(): string

    /**
     * Add a new entry to the browser history stack.
     * 
     * @param {HistoryState} state - The state object to store with this history entry
     * @param {string | null} title - The title for this history entry (often ignored by browsers)
     * @param {string} path - The URL path for this history entry
     * 
     * @example
     * ```typescript
     * browser.pushState(
     *   { name: 'users.view', params: { id: '123' } },
     *   'User Profile',
     *   '/users/123'
     * )
     * ```
     */
    pushState(state: HistoryState, title: string | null, path: string): void

    /**
     * Replace the current history entry without adding a new one.
     * 
     * @param {HistoryState} state - The state object to store with this history entry
     * @param {string | null} title - The title for this history entry (often ignored by browsers)
     * @param {string} path - The URL path for this history entry
     * 
     * @example
     * ```typescript
     * browser.replaceState(
     *   { name: 'home', params: {} },
     *   'Home',
     *   '/home'
     * )
     * ```
     */
    replaceState(state: HistoryState, title: string | null, path: string): void

    /**
     * Add a listener for browser navigation events (popstate/hashchange).
     * 
     * @param {Function} fn - The event handler function
     * @param {BrowserPluginOptions} opts - Plugin options that may affect listener behavior
     * @returns {Function} A function to remove the listener
     * 
     * @example
     * ```typescript
     * const removeListener = browser.addPopstateListener(
     *   (event) => console.log('Navigation:', event),
     *   { useHash: false }
     * )
     * 
     * // Later, remove the listener
     * removeListener()
     * ```
     */
    addPopstateListener(fn: Function, opts: BrowserPluginOptions): Function

    /**
     * Get the current location path based on plugin options.
     * 
     * @param {BrowserPluginOptions} opts - Options that determine how to extract the path
     * @returns {string} The current path (e.g., '/users/123?tab=profile')
     * 
     * @example
     * ```typescript
     * // HTML5 mode: returns pathname + search
     * const path1 = browser.getLocation({ useHash: false, base: '' })
     * 
     * // Hash mode: returns hash content
     * const path2 = browser.getLocation({ useHash: true, hashPrefix: '!' })
     * ```
     */
    getLocation(opts: BrowserPluginOptions): string

    /**
     * Get the current browser history state.
     * 
     * @returns {HistoryState} The current history state object, or null if none
     * 
     * @example
     * ```typescript
     * const state = browser.getState()
     * if (state) {
     *   console.log('Current route:', state.name)
     *   console.log('Route params:', state.params)
     * }
     * ```
     */
    getState(): HistoryState

    /**
     * Get the current URL hash.
     * 
     * @returns {string} The hash portion of the URL (including the # symbol)
     * 
     * @example
     * ```typescript
     * // URL: /users/123#section1
     * const hash = browser.getHash() // Returns: '#section1'
     * ```
     */
    getHash(): string
}

/**
 * Type representing the state stored in browser history.
 * Extends the router's State interface with additional properties
 * that may be stored in the browser's history.state.
 * 
 * @typedef {(State & { [key: string]: any }) | null} HistoryState
 * 
 * @example
 * ```typescript
 * // Basic router state
 * const state: HistoryState = {
 *   name: 'users.view',
 *   params: { id: '123' },
 *   path: '/users/123',
 *   meta: { timestamp: Date.now() }
 * }
 * 
 * // Extended with custom properties
 * const extendedState: HistoryState = {
 *   name: 'users.view',
 *   params: { id: '123' },
 *   path: '/users/123',
 *   meta: { timestamp: Date.now() },
 *   customData: { scrollPosition: 100 }
 * }
 * ```
 */
export type HistoryState = (State & { [key: string]: any }) | null
