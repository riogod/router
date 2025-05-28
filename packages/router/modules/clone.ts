import { Router, DefaultDependencies } from './types/router'
import createRouter from './createRouter'

/**
 * Creates a deep clone of an existing router instance with optional new dependencies.
 * 
 * The cloned router will have:
 * - Same route tree structure
 * - Same configuration options
 * - Same middleware and plugins
 * - Same lifecycle handlers (canActivate/canDeactivate)
 * - Same configuration object
 * - Optionally different dependencies
 * 
 * This is useful for creating router instances with different dependency contexts
 * while maintaining the same routing configuration.
 * 
 * @template Dependencies - Type of dependencies to inject into the cloned router
 * @param router - The router instance to clone
 * @param dependencies - Optional new dependencies for the cloned router
 * @returns A new router instance that is a clone of the original
 * 
 * @example
 * ```typescript
 * const originalRouter = createRouter(routes, options, { api: apiV1 })
 * 
 * // Clone with different dependencies
 * const clonedRouter = cloneRouter(originalRouter, { api: apiV2 })
 * 
 * // Clone with same dependencies
 * const identicalRouter = cloneRouter(originalRouter)
 * ```
 */
export default function cloneRouter<
    Dependencies extends DefaultDependencies = DefaultDependencies
>(router: Router, dependencies?: Dependencies): Router<Dependencies> {
    const clonedRouter = createRouter<Dependencies>(
        router.rootNode.clone(),
        router.getOptions(),
        dependencies
    )

    clonedRouter.useMiddleware(...router.getMiddlewareFactories())
    clonedRouter.usePlugin(...router.getPlugins())
    clonedRouter.config = router.config

    const [
        canDeactivateFactories,
        canActivateFactories
    ] = router.getLifecycleFactories()

    Object.keys(canDeactivateFactories).forEach(name =>
        clonedRouter.canDeactivate(name, canDeactivateFactories[name])
    )
    Object.keys(canActivateFactories).forEach(name =>
        clonedRouter.canActivate(name, canActivateFactories[name])
    )

    return clonedRouter
}
