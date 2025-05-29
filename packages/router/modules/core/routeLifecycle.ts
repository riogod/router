import { Router } from '../types/router'

/** Utility function to convert values to factory functions */
const toFunction = val => (typeof val === 'function' ? val : () => () => val)

/**
 * Enhances a router with route lifecycle management capabilities.
 * 
 * This module provides functionality for:
 * - Route activation guards (canActivate)
 * - Route deactivation guards (canDeactivate)
 * - Route lifecycle hooks (onEnterRoute, onExitRoute, onRouteInActiveChain)
 * - Browser title management
 * - Factory and function storage for lifecycle handlers
 * 
 * Route guards control whether navigation can proceed:
 * - canActivate: Called before entering a route
 * - canDeactivate: Called before leaving a route
 * 
 * Lifecycle hooks provide notification points:
 * - onEnterRoute: Called when entering a route
 * - onExitRoute: Called when leaving a route
 * - onRouteInActiveChain: Called for routes that remain active during navigation
 * 
 * @template Dependencies - Type of dependencies available to lifecycle handlers
 * @param router - Router instance to enhance with lifecycle capabilities
 * @returns Enhanced router with route lifecycle functionality
 * 
 * @example
 * ```typescript
 * // Route guard
 * router.canActivate('admin', (router, deps) => (toState, fromState, done) => {
 *   if (deps.auth.hasRole('admin')) {
 *     done() // Allow navigation
 *   } else {
 *     done(new Error('Access denied')) // Block navigation
 *   }
 * })
 * 
 * // Lifecycle hook
 * router.registerOnEnterRoute('user', (toState, fromState) => {
 *   console.log(`Entering user route with ID: ${toState.params.id}`)
 * })
 * ```
 */
export default function withRouteLifecycle<Dependencies>(
    router: Router<Dependencies>
): Router<Dependencies> {
    const canDeactivateFactories = {}
    const canActivateFactories = {}
    const canDeactivateFunctions = {}
    const canActivateFunctions = {}
    
    // New lifecycle hooks storage
    const onEnterNodeFactories = {}
    const onExitNodeFactories = {}
    const onNodeInActiveChainFactories = {}
    const onEnterNodeFunctions = {}
    const onExitNodeFunctions = {}
    const onNodeInActiveChainFunctions = {}
    const browserTitleFactories = {}
    const browserTitleFunctions = {}

    /**
     * Get route guard factory functions for canDeactivate and canActivate.
     * 
     * @returns Tuple of [canDeactivateFactories, canActivateFactories]
     */
    router.getLifecycleFactories = () => {
        return [canDeactivateFactories, canActivateFactories]
    }

    /**
     * Get instantiated route guard functions for canDeactivate and canActivate.
     * 
     * @returns Tuple of [canDeactivateFunctions, canActivateFunctions]
     */
    router.getLifecycleFunctions = () => {
        return [canDeactivateFunctions, canActivateFunctions]
    }

    /**
     * Get route lifecycle hook factory functions.
     * 
     * @returns Object containing lifecycle hook factories
     */
    router.getRouteLifecycleFactories = () => {
        return {
            onEnterNode: onEnterNodeFactories,
            onExitNode: onExitNodeFactories,
            onNodeInActiveChain: onNodeInActiveChainFactories
        }
    }

    /**
     * Get instantiated route lifecycle hook functions.
     * 
     * @returns Object containing lifecycle hook functions
     */
    router.getRouteLifecycleFunctions = () => {
        return {
            onEnterNode: onEnterNodeFunctions,
            onExitNode: onExitNodeFunctions,
            onNodeInActiveChain: onNodeInActiveChainFunctions
        }
    }

    /**
     * Get browser title functions for all routes.
     * 
     * @returns Object mapping route names to title functions
     */
    router.getBrowserTitleFunctions = () => {
        return browserTitleFunctions
    }

    /**
     * Register a deactivation guard for a specific route.
     * 
     * The guard is called before leaving the route and can prevent navigation
     * by calling the done callback with an error.
     * 
     * @param name - Route name to guard
     * @param canDeactivateHandler - Guard function or factory
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * router.canDeactivate('form', (router, deps) => (toState, fromState, done) => {
     *   if (deps.form.hasUnsavedChanges()) {
     *     if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
     *       done()
     *     } else {
     *       done(new Error('Navigation cancelled'))
     *     }
     *   } else {
     *     done()
     *   }
     * })
     * ```
     */
    router.canDeactivate = (name, canDeactivateHandler) => {
        const factory = toFunction(canDeactivateHandler)

        canDeactivateFactories[name] = factory
        canDeactivateFunctions[name] = router.executeFactory(factory)

        return router
    }

    /**
     * Clear the deactivation guard for a specific route.
     * 
     * @param name - Route name to clear guard for
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * router.clearCanDeactivate('form')
     * ```
     */
    router.clearCanDeactivate = name => {
        canDeactivateFactories[name] = undefined
        canDeactivateFunctions[name] = undefined

        return router
    }

    /**
     * Register an activation guard for a specific route.
     * 
     * The guard is called before entering the route and can prevent navigation
     * by calling the done callback with an error.
     * 
     * @param name - Route name to guard
     * @param canActivateHandler - Guard function or factory
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * router.canActivate('admin', (router, deps) => (toState, fromState, done) => {
     *   if (deps.auth.isAuthenticated() && deps.auth.hasRole('admin')) {
     *     done()
     *   } else {
     *     done({ redirect: { name: 'login' } })
     *   }
     * })
     * ```
     */
    router.canActivate = (name, canActivateHandler) => {
        const factory = toFunction(canActivateHandler)

        canActivateFactories[name] = factory
        canActivateFunctions[name] = router.executeFactory(factory)

        return router
    }

    /**
     * Register an onEnterRoute lifecycle hook for a specific route.
     * 
     * This hook is called when entering the route, after guards have passed.
     * 
     * @param name - Route name
     * @param handler - Lifecycle hook function
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * router.registerOnEnterRoute('user', (toState, fromState) => {
     *   console.log(`Entering user ${toState.params.id}`)
     * })
     * ```
     */
    router.registerOnEnterNode = (name, handler) => {
        onEnterNodeFactories[name] = handler
        onEnterNodeFunctions[name] = handler
        return router
    }

    /**
     * Register an onExitRoute lifecycle hook for a specific route.
     * 
     * This hook is called when leaving the route, before guards are checked.
     * 
     * @param name - Route name
     * @param handler - Lifecycle hook function
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * router.registerOnExitRoute('user', (toState, fromState) => {
     *   console.log(`Leaving user ${fromState.params.id}`)
     * })
     * ```
     */
    router.registerOnExitNode = (name, handler) => {
        onExitNodeFactories[name] = handler
        onExitNodeFunctions[name] = handler
        return router
    }

    /**
     * Register an onRouteInActiveChain lifecycle hook for a specific route.
     * 
     * This hook is called for routes that remain active during navigation
     * (parent routes when navigating between child routes).
     * 
     * @param name - Route name
     * @param handler - Lifecycle hook function
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * router.registerOnRouteInActiveChain('app', (toState, fromState) => {
     *   console.log('App route remains active during navigation')
     * })
     * ```
     */
    router.registerOnNodeInActiveChain = (name, handler) => {
        onNodeInActiveChainFactories[name] = handler
        onNodeInActiveChainFunctions[name] = handler
        return router
    }

    /**
     * Register a browser title handler for a specific route.
     * 
     * The handler can be a string or function that returns the page title.
     * 
     * @param name - Route name
     * @param handler - Title string or function that returns title
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * // Static title
     * router.registerBrowserTitle('home', 'Home Page')
     * 
     * // Dynamic title
     * router.registerBrowserTitle('user', (state) => `User: ${state.params.name}`)
     * ```
     */
    router.registerBrowserTitle = (name, handler) => {
        browserTitleFactories[name] = handler
        browserTitleFunctions[name] = handler
        return router
    }

    return router
}
