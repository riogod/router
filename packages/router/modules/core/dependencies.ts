import { Router } from '../types/router'

/**
 * Enhances a router with dependency injection capabilities.
 * 
 * This module provides functionality to:
 * - Set individual dependencies by name
 * - Set multiple dependencies at once
 * - Retrieve all dependencies
 * - Get injectable parameters for factory functions
 * - Execute factory functions with proper dependency injection
 * 
 * Dependencies are used throughout the router for:
 * - Route guards (canActivate/canDeactivate)
 * - Middleware functions
 * - Plugin factories
 * - Route lifecycle hooks
 * 
 * @template Dependencies - Type of dependencies object
 * @param dependencies - Initial dependencies to inject into the router
 * @returns Function that enhances a router with dependency injection
 * 
 * @example
 * ```typescript
 * const dependencies = {
 *   api: new ApiService(),
 *   auth: new AuthService(),
 *   logger: new Logger()
 * }
 * 
 * const router = createRouter(routes, options, dependencies)
 * 
 * // Dependencies are available in route guards
 * const canActivate = (router, deps) => (toState, fromState, done) => {
 *   if (deps.auth.isAuthenticated()) {
 *     done()
 *   } else {
 *     done(new Error('Not authenticated'))
 *   }
 * }
 * ```
 */
export default function withDependencies<Dependencies>(
    dependencies: Dependencies
) {
    return (router: Router<Dependencies>): Router<Dependencies> => {
        const routerDependencies: Dependencies = dependencies

        /**
         * Set a single dependency by name
         * @param dependencyName - Name of the dependency
         * @param dependency - The dependency value
         * @returns Router instance for chaining
         */
        router.setDependency = (dependencyName, dependency) => {
            routerDependencies[dependencyName] = dependency
            return router
        }

        /**
         * Set multiple dependencies at once
         * @param deps - Object containing dependencies to set
         * @returns Router instance for chaining
         */
        router.setDependencies = deps => {
            Object.keys(deps).forEach(name =>
                router.setDependency(name, deps[name])
            )
            return router
        }

        /**
         * Get all current dependencies
         * @returns Current dependencies object
         */
        router.getDependencies = () => routerDependencies

        /**
         * Get injectable parameters for factory functions
         * @returns Tuple of [router, dependencies] for injection
         */
        router.getInjectables = () => [router, router.getDependencies()]

        /**
         * Execute a factory function with proper dependency injection
         * @param factoryFunction - Factory function that accepts (router, dependencies)
         * @returns Result of the factory function execution
         */
        router.executeFactory = factoryFunction =>
            factoryFunction(...router.getInjectables())

        return router
    }
}
