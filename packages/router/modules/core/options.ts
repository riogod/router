import { Options, Router } from '../types/router'

/**
 * Default router configuration options.
 * 
 * These defaults provide sensible behavior for most use cases:
 * - Standard trailing slash handling
 * - Default query parameter processing
 * - Automatic cleanup of unused route guards
 * - Strong route matching for better performance
 * - Path rewriting on successful matches
 * - Case-sensitive route matching disabled
 * - Default URL parameter encoding
 */
const defaultOptions: Options = {
    trailingSlashMode: 'default',
    queryParamsMode: 'default',
    strictTrailingSlash: false,
    autoCleanUp: true,
    allowNotFound: false,
    strongMatching: true,
    rewritePathOnMatch: true,
    caseSensitive: false,
    urlParamsEncoding: 'default'
}

/**
 * Enhances a router with configuration options management.
 * 
 * This module provides functionality to:
 * - Set default router options
 * - Override specific options
 * - Retrieve current configuration
 * - Update options at runtime
 * 
 * Options control various aspects of router behavior including:
 * - URL parsing and generation
 * - Route matching behavior
 * - Query parameter handling
 * - Trailing slash processing
 * - Case sensitivity
 * - Cleanup behavior
 * 
 * @template Dependencies - Type of dependencies available in the router
 * @param options - Partial options object to override defaults
 * @returns Function that enhances a router with options management
 * 
 * @example
 * ```typescript
 * const router = createRouter(routes, {
 *   trailingSlashMode: 'never',
 *   caseSensitive: true,
 *   defaultRoute: 'home',
 *   defaultParams: { lang: 'en' }
 * })
 * 
 * // Update options at runtime
 * router.setOption('allowNotFound', true)
 * 
 * // Get current options
 * const currentOptions = router.getOptions()
 * ```
 */
export default function withOptions<Dependencies>(options: Partial<Options>) {
    return (router: Router<Dependencies>): Router<Dependencies> => {
        const routerOptions = {
            ...defaultOptions,
            ...options
        } as Options

        /**
         * Get the current router options configuration.
         * 
         * @returns Complete options object with all settings
         * 
         * @example
         * ```typescript
         * const options = router.getOptions()
         * console.log('Trailing slash mode:', options.trailingSlashMode)
         * console.log('Default route:', options.defaultRoute)
         * ```
         */
        router.getOptions = () => routerOptions

        /**
         * Set a specific router option value.
         * 
         * @param option - Name of the option to set
         * @param value - New value for the option
         * @returns Router instance for chaining
         * 
         * @example
         * ```typescript
         * router
         *   .setOption('caseSensitive', true)
         *   .setOption('allowNotFound', true)
         *   .setOption('defaultRoute', 'dashboard')
         * ```
         */
        router.setOption = (option, value) => {
            routerOptions[option] = value

            return router
        }

        return router
    }
}
