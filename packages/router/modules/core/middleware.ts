import { Router } from '../types/router'

/**
 * Enhances a router with middleware management capabilities.
 * 
 * Middleware functions are executed during route transitions and can:
 * - Intercept and modify navigation
 * - Perform authentication checks
 * - Log navigation events
 * - Transform state data
 * - Cancel navigation by throwing errors
 * 
 * Middleware is executed after route guards but before the final state is set.
 * Multiple middleware can be registered and they execute in the order they were added.
 * 
 * @template Dependencies - Type of dependencies available to middleware
 * @param router - Router instance to enhance with middleware capabilities
 * @returns Enhanced router with middleware functionality
 * 
 * @example
 * ```typescript
 * // Authentication middleware
 * const authMiddleware = (router, deps) => (toState, fromState, done) => {
 *   if (toState.name.startsWith('admin') && !deps.auth.isAuthenticated()) {
 *     done(new Error('Authentication required'))
 *   } else {
 *     done()
 *   }
 * }
 * 
 * // Logging middleware
 * const loggerMiddleware = (router, deps) => (toState, fromState, done) => {
 *   deps.logger.log(`Navigating from ${fromState?.name} to ${toState.name}`)
 *   done()
 * }
 * 
 * router.useMiddleware(authMiddleware, loggerMiddleware)
 * ```
 */
export default function withMiddleware<Dependencies>(
    router: Router<Dependencies>
): Router<Dependencies> {
    let middlewareFactories = []
    let middlewareFunctions = []

    /**
     * Register one or more middleware functions with the router.
     * 
     * @param middlewares - Middleware factory functions to register
     * @returns Function to unregister all the added middleware
     * 
     * @example
     * ```typescript
     * const unregister = router.useMiddleware(
     *   authMiddleware,
     *   loggerMiddleware,
     *   analyticsMiddleware
     * )
     * 
     * // Later, remove all middleware
     * unregister()
     * ```
     */
    router.useMiddleware = (...middlewares) => {
        const removePluginFns: Array<() => void> = middlewares.map(
            middleware => {
                const middlewareFunction = router.executeFactory(middleware)

                middlewareFactories.push(middleware)
                middlewareFunctions.push(middlewareFunction)

                return () => {
                    middlewareFactories = middlewareFactories.filter(
                        m => m !== middleware
                    )
                    middlewareFunctions = middlewareFunctions.filter(
                        m => m !== middlewareFunction
                    )
                }
            }
        )

        return () => removePluginFns.forEach(fn => fn())
    }

    /**
     * Remove all registered middleware from the router.
     * 
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * router.clearMiddleware()
     * ```
     */
    router.clearMiddleware = () => {
        middlewareFactories = []
        middlewareFunctions = []

        return router
    }

    /**
     * Get all registered middleware factory functions.
     * 
     * @returns Array of middleware factory functions
     */
    router.getMiddlewareFactories = () => middlewareFactories

    /**
     * Get all instantiated middleware functions ready for execution.
     * 
     * @returns Array of middleware functions
     */
    router.getMiddlewareFunctions = () => middlewareFunctions

    return router
}
