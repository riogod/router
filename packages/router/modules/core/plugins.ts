import { constants } from '../constants'
import { Router, PluginFactory } from '../types/router'

/**
 * Maps plugin lifecycle method names to router event constants.
 * 
 * This mapping allows plugins to define lifecycle methods that automatically
 * get registered as event listeners for corresponding router events.
 */
const eventsMap = {
    onStart: constants.ROUTER_START,
    onStop: constants.ROUTER_STOP,
    onTransitionSuccess: constants.TRANSITION_SUCCESS,
    onTransitionStart: constants.TRANSITION_START,
    onTransitionError: constants.TRANSITION_ERROR,
    onTransitionCancel: constants.TRANSITION_CANCEL
}

/**
 * Enhances a router with plugin management capabilities.
 * 
 * This module provides functionality to:
 * - Register and manage plugins
 * - Automatically bind plugin lifecycle methods to router events
 * - Handle plugin teardown and cleanup
 * - Support dependency injection for plugins
 * 
 * Plugins can define lifecycle methods that automatically get called:
 * - onStart: When router starts
 * - onStop: When router stops
 * - onTransitionStart: When navigation begins
 * - onTransitionSuccess: When navigation succeeds
 * - onTransitionError: When navigation fails
 * - onTransitionCancel: When navigation is cancelled
 * - teardown: For plugin cleanup
 * 
 * @template Dependencies - Type of dependencies available to plugins
 * @param router - Router instance to enhance with plugin capabilities
 * @returns Enhanced router with plugin functionality
 * 
 * @example
 * ```typescript
 * // Logger plugin
 * const loggerPlugin = (router, deps) => ({
 *   onTransitionStart: (toState, fromState) => {
 *     console.log(`Starting navigation to ${toState.name}`)
 *   },
 *   onTransitionSuccess: (toState, fromState) => {
 *     console.log(`Successfully navigated to ${toState.name}`)
 *   },
 *   teardown: () => {
 *     console.log('Logger plugin cleaned up')
 *   }
 * })
 * 
 * // Analytics plugin
 * const analyticsPlugin = (router, deps) => ({
 *   onTransitionSuccess: (toState) => {
 *     deps.analytics.track('page_view', { page: toState.name })
 *   }
 * })
 * 
 * const unregister = router.usePlugin(loggerPlugin, analyticsPlugin)
 * 
 * // Later, remove plugins
 * unregister()
 * ```
 */
export default function withPlugins<Dependencies>(
    router: Router<Dependencies>
): Router<Dependencies> {
    let routerPlugins: PluginFactory[] = []

    /**
     * Get all currently registered plugin factories.
     * 
     * @returns Array of plugin factory functions
     */
    router.getPlugins = () => routerPlugins

    /**
     * Register one or more plugins with the router.
     * 
     * Each plugin factory function receives the router and dependencies as arguments
     * and should return an object with lifecycle methods and/or teardown function.
     * 
     * @param plugins - Plugin factory functions to register
     * @returns Function to unregister all the added plugins
     * 
     * @example
     * ```typescript
     * const unregister = router.usePlugin(
     *   loggerPlugin,
     *   analyticsPlugin,
     *   authPlugin
     * )
     * 
     * // Remove all plugins when no longer needed
     * unregister()
     * ```
     */
    router.usePlugin = (...plugins) => {
        const removePluginFns = plugins.map(plugin => {
            routerPlugins.push(plugin)
            return startPlugin(plugin)
        })

        return () => {
            routerPlugins = routerPlugins.filter(
                plugin => plugins.indexOf(plugin) === -1
            )
            removePluginFns.forEach(removePlugin => removePlugin())
        }
    }

    /**
     * Initialize and start a single plugin.
     * 
     * This function:
     * 1. Executes the plugin factory with dependency injection
     * 2. Registers plugin lifecycle methods as event listeners
     * 3. Returns a cleanup function for the plugin
     * 
     * @param plugin - Plugin factory function to start
     * @returns Function to stop and clean up the plugin
     */
    function startPlugin(plugin) {
        const appliedPlugin = router.executeFactory(plugin)

        const removeEventListeners = Object.keys(eventsMap)
            .map(methodName => {
                if (appliedPlugin[methodName]) {
                    return router.addEventListener(
                        eventsMap[methodName],
                        appliedPlugin[methodName]
                    )
                }
            })
            .filter(Boolean)

        return () => {
            removeEventListeners.forEach(removeListener => removeListener())
            if (appliedPlugin.teardown) {
                appliedPlugin.teardown()
            }
        }
    }

    return router
}
