/**
 * @fileoverview Browser plugin for router integration with browser history.
 * Provides seamless integration between the router and browser navigation,
 * supporting both HTML5 history API and hash-based routing.
 * 
 * @module @riogz/router-plugin-browser
 */

import { PluginFactory, errorCodes, constants, Router, State } from '@riogz/router'
import safeBrowser from './browser'
import { BrowserPluginOptions } from './types'

/**
 * Extends the Router interface with browser-specific methods.
 * These methods are added to the router instance when the browser plugin is used.
 */
declare module '@riogz/router' {
    interface Router {
        /**
         * Build a complete URL for a route with parameters.
         * Includes base path and hash prefix based on plugin configuration.
         * 
         * @param {string} name - The route name
         * @param {Object} [params] - Route parameters
         * @returns {string} The complete URL
         */
        buildUrl(name: string, params?: { [key: string]: any }): string
        
        /**
         * Match a complete URL against the router's routes.
         * Extracts the path from the URL and matches it against defined routes.
         * 
         * @param {string} url - The complete URL to match
         * @returns {State | null} The matched state or null if no match
         */
        matchUrl(url: string): State | null
        
        /**
         * Replace the current browser history state without navigation.
         * Updates the browser's history.state and URL without triggering route changes.
         * 
         * @param {string} name - The route name
         * @param {Object} [params] - Route parameters
         * @param {string} [title] - The page title
         */
        replaceHistoryState(
            name: string,
            params?: { [key: string]: any },
            title?: string
        ): void
        
        /**
         * The last known router state.
         * Used internally to track state changes and prevent unnecessary updates.
         */
        lastKnownState: State
    }
}

/**
 * Default configuration options for the browser plugin.
 * These values are used when options are not explicitly provided.
 * 
 * @constant {BrowserPluginOptions}
 */
const defaultOptions: BrowserPluginOptions = {
    forceDeactivate: true,
    useHash: false,
    hashPrefix: '',
    base: '',
    mergeState: false,
    preserveHash: true
}

/**
 * Source identifier for browser-initiated navigation events.
 * Used to distinguish browser navigation from programmatic navigation.
 * 
 * @constant {string}
 */
const source = 'popstate'

/**
 * Creates a browser plugin factory for router integration.
 * The factory function allows customization of browser behavior and dependency injection.
 * 
 * @param {BrowserPluginOptions} [opts] - Configuration options for the plugin
 * @param {Browser} [browser=safeBrowser] - Browser abstraction layer (for testing/SSR)
 * @returns {PluginFactory} A plugin factory function
 * 
 * @example
 * ```typescript
 * import { createRouter } from '@riogz/router'
 * import browserPlugin from '@riogz/router-plugin-browser'
 * 
 * // Basic usage with HTML5 history
 * const router = createRouter(routes)
 * router.usePlugin(browserPlugin())
 * 
 * // Hash-based routing
 * router.usePlugin(browserPlugin({
 *   useHash: true,
 *   hashPrefix: '!'
 * }))
 * 
 * // App in subdirectory
 * router.usePlugin(browserPlugin({
 *   base: '/myapp'
 * }))
 * ```
 */
function browserPluginFactory(
    opts?: BrowserPluginOptions,
    browser = safeBrowser
): PluginFactory {
    const options: BrowserPluginOptions = { ...defaultOptions, ...opts }
    const transitionOptions = {
        forceDeactivate: options.forceDeactivate,
        source
    }
    let removePopStateListener

    /**
     * The actual browser plugin function that extends router functionality.
     * This function is returned by the factory and called by the router.
     * 
     * @param {Router} router - The router instance to extend
     * @returns {Object} Plugin lifecycle methods
     */
    return function browserPlugin(router: Router) {
        const routerOptions = router.getOptions()
        const routerStart = router.start

        /**
         * Build a complete URL for a route with parameters.
         * Handles base paths and hash prefixes based on plugin configuration.
         * 
         * @param {string} route - The route name
         * @param {Object} [params] - Route parameters
         * @returns {string} The complete URL
         */
        router.buildUrl = (route, params) => {
            const base = options.base || ''
            const prefix = options.useHash ? `#${options.hashPrefix}` : ''
            const path = router.buildPath(route, params)

            if (path === null) {
                return null // Return null if the base path generation failed
            }

            if (options.useHash) {
                if (base === '/') {
                    return prefix + path
                }
                return base + prefix + path
            }
            return base + prefix + path
        }

        /**
         * Convert a complete URL to a path that can be matched by the router.
         * Extracts the relevant path portion based on plugin configuration.
         * 
         * @param {string} url - The complete URL to convert
         * @returns {string} The extracted path
         * @throws {Error} If the URL cannot be parsed
         * @private
         */
        const urlToPath = (url: string) => {
            const match = url.match(
                /^(?:http|https):\/\/(?:[0-9a-z_\-.:]+?)(?=\/)(.*)$/
            )
            const path = match ? match[1] : url

            const pathParts = path.match(/^(.+?)(#.+?)?(\?.+)?$/)

            if (!pathParts)
                throw new Error(`[router] Could not parse url ${url}`)

            const pathname = pathParts[1]
            const hash = pathParts[2] || ''
            const search = pathParts[3] || ''

            return (
                (options.useHash
                    ? hash.replace(new RegExp('^#' + options.hashPrefix), '')
                    : options.base
                    ? pathname.replace(new RegExp('^' + options.base), '')
                    : pathname) + search
            )
        }

        /**
         * Match a complete URL against the router's routes.
         * Converts the URL to a path and delegates to router.matchPath.
         * 
         * @param {string} url - The complete URL to match
         * @returns {State | null} The matched state or null if no match
         */
        router.matchUrl = url => router.matchPath(urlToPath(url))

        /**
         * Enhanced start method that automatically detects the current location.
         * If no starting path is provided, uses the current browser location.
         * 
         * @param {...any} args - Arguments passed to the original start method
         * @returns {Router} The router instance for chaining
         */
        router.start = function(...args) {
            if (args.length === 0 || typeof args[0] === 'function') {
                routerStart(browser.getLocation(options), ...args)
            } else {
                routerStart(...args)
            }

            return router
        }

        /**
         * Replace the current browser history state without triggering navigation.
         * Updates both the router state and browser history.
         * 
         * @param {string} name - The route name
         * @param {Object} [params={}] - Route parameters
         * @param {string} [title=''] - The page title
         */
        router.replaceHistoryState = function(name, params = {}, title = '') {
            const route = router.buildState(name, params)
            const state = router.makeState(
                route.name,
                route.params,
                router.buildPath(route.name, route.params),
                { params: route.meta }
            )
            const url = router.buildUrl(name, params)
            router.lastKnownState = state
            browser.replaceState(state, title, url)
        }

        /**
         * Update the browser's history state with router state information.
         * Handles state merging and chooses between push/replace operations.
         * 
         * @param {State} state - The router state to store
         * @param {string} url - The URL to associate with the state
         * @param {boolean} replace - Whether to replace current entry or add new one
         * @private
         */
        function updateBrowserState(state, url, replace) {
            const trimmedState = state
                ? {
                      meta: state.meta,
                      name: state.name,
                      params: state.params,
                      path: state.path
                  }
                : state
            const finalState =
                options.mergeState === true
                    ? { ...browser.getState(), ...trimmedState }
                    : trimmedState

            if (replace) browser.replaceState(finalState, '', url)
            else browser.pushState(finalState, '', url)
        }

        /**
         * Handle browser popstate events (back/forward navigation).
         * Synchronizes router state with browser navigation and handles errors.
         * 
         * @param {PopStateEvent} evt - The browser popstate event
         * @private
         */
        function onPopState(evt: PopStateEvent) {
            const routerState = router.getState()
            // Do nothing if no state or if last know state is poped state (it should never happen)
            const newState = !evt.state || !evt.state.name
            const state = newState
                ? router.matchPath(browser.getLocation(options), source)
                : router.makeState(
                      evt.state.name,
                      evt.state.params,
                      evt.state.path,
                      { ...evt.state.meta, source },
                      evt.state.meta.id
                  )
            const { defaultRoute, defaultParams } = routerOptions

            if (!state) {
                // If current state is already the default route, we will have a double entry
                // Navigating back and forth will emit SAME_STATES error
                defaultRoute &&
                    router.navigateToDefault({
                        ...transitionOptions,
                        reload: true,
                        replace: true
                    })
                return
            }
            if (
                routerState &&
                router.areStatesEqual(state, routerState, false)
            ) {
                return
            }

            router.transitionToState(
                state,
                routerState,
                transitionOptions,
                (err, toState) => {
                    if (err) {
                        if (err.redirect) {
                            const { name, params } = err.redirect

                            router.navigate(name, params, {
                                ...transitionOptions,
                                replace: true,
                                force: true,
                                redirected: true
                            })
                        } else if (err.code === errorCodes.CANNOT_DEACTIVATE) {
                            const url = router.buildUrl(
                                routerState.name,
                                routerState.params
                            )
                            if (!newState) {
                                // Keep history state unchanged but use current URL
                                updateBrowserState(state, url, true)
                            }
                            // else do nothing or history will be messed up
                            // TODO: history.back()?
                        } else {
                            // Force navigation to default state
                            defaultRoute &&
                                router.navigate(defaultRoute, defaultParams, {
                                    ...transitionOptions,
                                    reload: true,
                                    replace: true
                                })
                        }
                    } else {
                        router.invokeEventListeners(
                            constants.TRANSITION_SUCCESS,
                            toState,
                            routerState,
                            { replace: true }
                        )
                    }
                }
            )
        }

        /**
         * Initialize the plugin when the router starts.
         * Sets up browser event listeners and auto-detects base path if needed.
         * 
         * @private
         */
        function onStart() {
            if (options.useHash && !options.base) {
                // Guess base
                options.base = browser.getBase()
            }

            removePopStateListener = browser.addPopstateListener(
                onPopState,
                options
            )
        }

        /**
         * Clean up plugin resources when the router stops.
         * Removes browser event listeners to prevent memory leaks.
         * 
         * @private
         */
        function teardown() {
            if (removePopStateListener) {
                removePopStateListener()
                removePopStateListener = undefined
            }
        }

        /**
         * Handle successful route transitions by updating browser state.
         * Determines whether to push or replace history entries and preserves hash if needed.
         * 
         * @param {State} toState - The destination state
         * @param {State} fromState - The source state
         * @param {Object} opts - Transition options
         * @param {boolean} opts.replace - Whether this is a replace operation
         * @private
         */
        function onTransitionSuccess(toState, fromState, opts) {
            const historyState = browser.getState()
            const hasState =
                historyState &&
                historyState.meta &&
                historyState.name &&
                historyState.params
            const statesAreEqual =
                fromState && router.areStatesEqual(fromState, toState, false)
            const replace = opts.replace || !hasState || statesAreEqual
            let url = router.buildUrl(toState.name, toState.params)
            if (
                fromState === null &&
                options.useHash === false &&
                options.preserveHash === true
            ) {
                url += browser.getHash()
            }
            updateBrowserState(toState, url, replace)
        }

        /**
         * Plugin lifecycle methods exposed to the router.
         * These methods are called by the router at appropriate times.
         * 
         * @returns {Object} Plugin lifecycle methods
         */
        return {
            /**
             * Called when the router starts.
             * Sets up browser integration and event listeners.
             */
            onStart,
            
            /**
             * Called when the router stops.
             * Cleans up browser event listeners.
             */
            onStop: teardown,
            
            /**
             * Legacy teardown method for compatibility.
             * @deprecated Use onStop instead
             */
            teardown,
            
            /**
             * Called after successful route transitions.
             * Updates browser history with new state.
             */
            onTransitionSuccess,
            
            /**
             * Browser popstate event handler.
             * Exposed for testing and advanced use cases.
             */
            onPopState
        }
    }
}

/**
 * Default export of the browser plugin factory.
 * 
 * @example
 * ```typescript
 * import browserPlugin from '@riogz/router-plugin-browser'
 * 
 * const router = createRouter(routes)
 * router.usePlugin(browserPlugin({
 *   useHash: false,
 *   base: '/app'
 * }))
 * ```
 */
export default browserPluginFactory

/**
 * Re-export types for convenience.
 * Allows importing types directly from the main module.
 * 
 * @example
 * ```typescript
 * import browserPlugin, { BrowserPluginOptions, Browser, HistoryState } from '@riogz/router-plugin-browser'
 * ```
 */
export type { BrowserPluginOptions, Browser, HistoryState } from './types'
