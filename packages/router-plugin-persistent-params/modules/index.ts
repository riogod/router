/**
 * @fileoverview Router plugin for maintaining persistent parameters across route transitions.
 * This plugin ensures that specified parameters are automatically included in all route transitions,
 * making them "sticky" throughout the navigation session.
 * 
 * @module @riogz/router-plugin-persistent-params
 */

import { PluginFactory } from '@riogz/router'

/**
 * Configuration for persistent parameters. Can be either an array of parameter names
 * or an object with parameter names as keys and default values.
 * 
 * @typedef {string[] | Record<string, any>} PersistentParamsConfig
 * 
 * @example
 * // Array format - parameters will be undefined initially
 * ['theme', 'locale', 'debug']
 * 
 * @example
 * // Object format - parameters have default values
 * { theme: 'light', locale: 'en', debug: false }
 */
type PersistentParamsConfig = string[] | Record<string, any>

/**
 * Filters an object to include only properties with defined values (not undefined).
 * Used internally to clean up parameter objects before merging.
 * 
 * @internal
 * @param {Record<string, any>} params - The parameters object to filter
 * @returns {Record<string, any>} A new object containing only defined parameters
 * 
 * @example
 * ```typescript
 * const params = { id: '123', theme: 'dark', locale: undefined }
 * const filtered = getDefinedParams(params)
 * // Result: { id: '123', theme: 'dark' }
 * ```
 */
const getDefinedParams = (params: Record<string, any>): Record<string, any> =>
    Object.keys(params)
        .filter(param => params[param] !== undefined)
        .reduce((acc, param) => ({ ...acc, [param]: params[param] }), {})

/**
 * Creates a persistent parameters plugin factory for the router.
 * This plugin maintains specified parameters across all route transitions,
 * automatically including them in navigation calls and updating their values
 * when they change during transitions.
 * 
 * The plugin works by:
 * 1. Modifying the router's root path to include persistent parameters as query parameters
 * 2. Decorating `buildPath` and `buildState` methods to automatically merge persistent parameters
 * 3. Listening to successful transitions to update persistent parameter values
 * 
 * @param {PersistentParamsConfig} [params={}] - Configuration for persistent parameters.
 *   Can be an array of parameter names or an object with default values.
 * @returns {PluginFactory} A plugin factory function that can be used with `router.usePlugin()`
 * 
 * @example
 * ```typescript
 * import { createRouter } from '@riogz/router'
 * import persistentParamsPlugin from '@riogz/router-plugin-persistent-params'
 * 
 * const router = createRouter([
 *   { name: 'home', path: '/' },
 *   { name: 'profile', path: '/profile/:userId' }
 * ])
 * 
 * // Using array format - parameters start as undefined
 * router.usePlugin(persistentParamsPlugin(['theme', 'locale']))
 * 
 * // Navigate with persistent parameters
 * router.navigate('profile', { userId: '123', theme: 'dark' })
 * // URL: /profile/123?theme=dark
 * 
 * // Later navigation automatically includes theme
 * router.navigate('home')
 * // URL: /?theme=dark
 * ```
 * 
 * @example
 * ```typescript
 * // Using object format with default values
 * router.usePlugin(persistentParamsPlugin({
 *   theme: 'light',
 *   locale: 'en',
 *   debug: false
 * }))
 * 
 * // All routes will include these parameters by default
 * router.navigate('home')
 * // URL: /?theme=light&locale=en&debug=false
 * 
 * // Override specific parameters
 * router.navigate('profile', { userId: '123', theme: 'dark' })
 * // URL: /profile/123?theme=dark&locale=en&debug=false
 * ```
 * 
 * @example
 * ```typescript
 * // Common use cases for persistent parameters:
 * 
 * // 1. Theme persistence
 * router.usePlugin(persistentParamsPlugin({ theme: 'auto' }))
 * 
 * // 2. Locale/language persistence
 * router.usePlugin(persistentParamsPlugin(['locale']))
 * 
 * // 3. Debug/development flags
 * router.usePlugin(persistentParamsPlugin({ 
 *   debug: false, 
 *   verbose: false 
 * }))
 * 
 * // 4. User preferences
 * router.usePlugin(persistentParamsPlugin([
 *   'sortBy', 
 *   'filterBy', 
 *   'viewMode'
 * ]))
 * ```
 */
function persistentParamsPluginFactory(params: PersistentParamsConfig = {}): PluginFactory {
    return function persistentParamsPlugin(router) {
        // Persistent parameters
        const persistentParams: Record<string, any> = Array.isArray(params)
            ? (params as string[]).reduce(
                  (acc: Record<string, any>, param: string) => ({ ...acc, [param]: undefined }),
                  {} as Record<string, any>
              )
            : (params as Record<string, any>)

        const paramNames = Object.keys(persistentParams)
        const hasQueryParams = router.rootNode.path.indexOf('?') !== -1
        const queryParams = paramNames.join('&')
        const search = queryParams
            ? `${hasQueryParams ? '&' : '?'}${queryParams}`
            : ''

        // Root node path
        const path = router.rootNode.path.split('?')[0] + search
        router.setRootPath(path)

        const { buildPath, buildState } = router

        // Decorators
        router.buildPath = function(route, params) {
            const routeParams = {
                ...getDefinedParams(persistentParams),
                ...(params || {})
            }
            return buildPath.call(router, route, routeParams)
        }

        router.buildState = function(route, params) {
            const routeParams = {
                ...getDefinedParams(persistentParams),
                ...(params || {})
            }
            return buildState.call(router, route, routeParams)
        }

        return {
            /**
             * Lifecycle hook called when a route transition completes successfully.
             * Updates the persistent parameters with values from the new route state.
             * 
             * @param {Object} toState - The destination route state after successful transition
             * @param {Record<string, any>} toState.params - Parameters from the destination route
             */
            onTransitionSuccess(toState) {
                Object.keys(toState.params)
                    .filter(p => paramNames.indexOf(p) !== -1)
                    .forEach(p => (persistentParams[p] = toState.params[p]))
            }
        }
    }
}

export default persistentParamsPluginFactory

/**
 * Re-export the main plugin factory as a named export for convenience
 */
export { persistentParamsPluginFactory }

/**
 * Re-export the configuration type for TypeScript users
 */
export type { PersistentParamsConfig }
