import { RouteNode } from '../lib/route-node'
import { constants } from '../constants'
import { Router, Route } from '../types/router'

/**
 * Enhances a router with route management capabilities.
 * 
 * This module provides functionality for:
 * - Route definition and management
 * - Route tree construction and navigation
 * - Path building and matching
 * - Route forwarding and redirection
 * - Active route checking
 * - Parameter encoding/decoding
 * - Default parameter handling
 * 
 * Routes are organized in a hierarchical tree structure where:
 * - Parent routes can have child routes (nested routing)
 * - Route names use dot notation (e.g., 'app.users.profile')
 * - Parameters can be passed between routes
 * - Guards and lifecycle hooks can be attached to routes
 * 
 * @template Dependencies - Type of dependencies available to route handlers
 * @param routes - Array of route definitions or RouteNode instance
 * @returns Function that enhances a router with route management
 * 
 * @example
 * ```typescript
 * const routes = [
 *   { name: 'home', path: '/' },
 *   { name: 'users', path: '/users', children: [
 *     { name: 'list', path: '' },
 *     { name: 'detail', path: '/:id' }
 *   ]},
 *   { name: 'about', path: '/about' }
 * ]
 * 
 * const router = createRouter(routes)
 * 
 * // Navigate to routes
 * router.navigate('users.detail', { id: '123' })
 * 
 * // Check if route is active
 * if (router.isActive('users')) {
 *   console.log('Users section is active')
 * }
 * ```
 */
export default function withRoutes<Dependencies>(
    routes: Array<Route<Dependencies>> | RouteNode
) {
    return (router: Router<Dependencies>): Router<Dependencies> => {
        /**
         * Set up route forwarding from one route to another.
         * 
         * @param fromRoute - Source route name
         * @param toRoute - Target route name
         * @returns Router instance for chaining
         * 
         * @example
         * ```typescript
         * // Redirect old route to new route
         * router.forward('old-users', 'users')
         * ```
         */
        router.forward = (fromRoute, toRoute) => {
            router.config.forwardMap[fromRoute] = toRoute

            return router
        }

        const rootNode =
            routes instanceof RouteNode
                ? routes
                : new RouteNode('', '', routes, { onAdd: onRouteAdded })

        /**
         * Callback function called when a route is added to the route tree.
         * 
         * This function automatically registers route-specific handlers:
         * - Route guards (canActivate, canDeactivate)
         * - Route forwarding
         * - Parameter encoding/decoding
         * - Default parameters
         * - Lifecycle hooks
         * - Browser title handlers
         * 
         * @param route - Route definition that was added
         */
        function onRouteAdded(route) {
            if (route.canActivate)
                router.canActivate(route.name, route.canActivate)

            if (route.canDeactivate)
                router.canDeactivate(route.name, route.canDeactivate)

            if (route.forwardTo) router.forward(route.name, route.forwardTo)

            if (route.decodeParams)
                router.config.decoders[route.name] = route.decodeParams

            if (route.encodeParams)
                router.config.encoders[route.name] = route.encodeParams

            if (route.defaultParams)
                router.config.defaultParams[route.name] = route.defaultParams

            // Register new lifecycle hooks
            if (route.onEnterRoute)
                router.registerOnEnterRoute(route.name, route.onEnterRoute)

            if (route.onExitRoute)
                router.registerOnExitRoute(route.name, route.onExitRoute)

            if (route.onRouteInActiveChain)
                router.registerOnRouteInActiveChain(route.name, route.onRouteInActiveChain)

            if (route.browserTitle)
                router.registerBrowserTitle(route.name, route.browserTitle)
        }

        router.rootNode = rootNode

        /**
         * Add routes to the router dynamically.
         * 
         * @param routesInput - Route definitions to add
         * @param finalSort - Whether to sort descendants after adding
         * @returns Router instance for chaining
         * 
         * @example
         * ```typescript
         * // Add new routes
         * router.add([
         *   { name: 'settings', path: '/settings' },
         *   { name: 'profile', path: '/profile' }
         * ])
         * 
         * // Add with final sort
         * router.add(newRoutes, true)
         * ```
         */
        router.add = (routesInput, finalSort?) => {
            if (routesInput) {
                rootNode.add(routesInput, onRouteAdded, !finalSort);
            }

            if (finalSort) {
                rootNode.sortDescendants();
            }
            return router;
        }

        /**
         * Add a single route node to the router.
         * 
         * @param name - Route name
         * @param path - Route path pattern
         * @param canActivateHandler - Optional activation guard
         * @returns Router instance for chaining
         * 
         * @example
         * ```typescript
         * router.addNode('admin', '/admin', (router, deps) => (toState, fromState, done) => {
         *   if (deps.auth.hasRole('admin')) {
         *     done()
         *   } else {
         *     done(new Error('Access denied'))
         *   }
         * })
         * ```
         */
        router.addNode = (name, path, canActivateHandler?) => {
            rootNode.addNode(name, path)
            if (canActivateHandler) router.canActivate(name, canActivateHandler)
            return router
        }

        /**
         * Check if a route is currently active.
         * 
         * This method supports multiple overloads for different use cases:
         * - isActive(name): Check if route or any descendant is active
         * - isActive(name, params): Check if route with specific params is active
         * - isActive(name, params, strictEquality): Exact match vs descendant match
         * - isActive(name, params, strictEquality, ignoreQueryParams): Control query param comparison
         * 
         * @param name - Route name to check
         * @param params - Optional route parameters
         * @param strictEquality - Whether to require exact route match
         * @param ignoreQueryParams - Whether to ignore query parameters in comparison
         * @returns True if the route is active
         * 
         * @example
         * ```typescript
         * // Check if users section is active (including children)
         * router.isActive('users') // true for 'users', 'users.list', 'users.detail'
         * 
         * // Check exact route match
         * router.isActive('users.detail', { id: '123' }, true)
         * 
         * // Check with parameters
         * router.isActive('users.detail', { id: '123' })
         * ```
         */
        // Перегрузки для isActive
        function isActiveOverload(name: string): boolean
        function isActiveOverload(name: string, params: any): boolean
        function isActiveOverload(name: string, params: any, strictEquality: boolean): boolean
        function isActiveOverload(name: string, params: any, strictEquality: boolean, ignoreQueryParams: boolean): boolean
        function isActiveOverload(
            name: string,
            params?: any,
            strictEquality: boolean = false,
            ignoreQueryParams: boolean = true
        ): boolean {
            const activeState = router.getState()

            if (!activeState) return false

            // Определяем, были ли параметры переданы явно
            const paramsProvided = arguments.length > 1

            if (!paramsProvided) {
                // Если параметры не указаны, проверяем только иерархию имен
                if (strictEquality) {
                    return activeState.name === name
                }
                
                const activeNameParts = activeState.name.split('.')
                const targetNameParts = name.split('.')
                
                // Проверяем, является ли активный маршрут потомком целевого
                if (targetNameParts.length <= activeNameParts.length) {
                    return targetNameParts.every((part, index) => 
                        activeNameParts[index] === part
                    )
                }
                return false
            }

            // Параметры переданы - используем стандартную логику
            const targetState = router.makeState(name, params)
            
            if (strictEquality || activeState.name === name) {
                return router.areStatesEqual(
                    targetState,
                    activeState,
                    ignoreQueryParams
                )
            }

            return router.areStatesDescendants(targetState, activeState)
        }
        
        router.isActive = isActiveOverload

        /**
         * Build a URL path for a route with given parameters.
         * 
         * @param route - Route name
         * @param params - Route parameters
         * @returns Generated URL path
         * 
         * @example
         * ```typescript
         * // Build path for user detail route
         * const path = router.buildPath('users.detail', { id: '123' })
         * // Returns: '/users/123'
         * 
         * // Build path with query parameters
         * const path = router.buildPath('users.list', { page: 2, sort: 'name' })
         * // Returns: '/users?page=2&sort=name'
         * ```
         */
        router.buildPath = (route, params) => {
            if (route === constants.UNKNOWN_ROUTE) {
                return params.path
            }

            const paramsWithDefault = {
                ...router.config.defaultParams[route],
                ...params
            }

            const {
                trailingSlashMode,
                queryParamsMode,
                queryParams
            } = router.getOptions()
            const encodedParams = router.config.encoders[route]
                ? router.config.encoders[route](paramsWithDefault)
                : paramsWithDefault

            return router.rootNode.buildPath(route, encodedParams, {
                trailingSlashMode,
                queryParamsMode,
                queryParams,
                urlParamsEncoding: router.getOptions().urlParamsEncoding
            })
        }

        /**
         * Match a URL path against the route tree and return the matching state.
         * 
         * @param path - URL path to match
         * @param source - Optional source identifier for the match
         * @returns Matching state object or null if no match
         * 
         * @example
         * ```typescript
         * // Match a path
         * const state = router.matchPath('/users/123')
         * // Returns: { name: 'users.detail', params: { id: '123' }, path: '/users/123' }
         * 
         * // No match
         * const state = router.matchPath('/invalid-path')
         * // Returns: null
         * ```
         */
        router.matchPath = (path, source) => {
            const options = router.getOptions()
            const match = router.rootNode.matchPath(path, options)

            if (match) {
                const { name, params, meta } = match
                const decodedParams = router.config.decoders[name]
                    ? router.config.decoders[name](params)
                    : params
                const {
                    name: routeName,
                    params: routeParams
                } = router.forwardState(name, decodedParams)
                const builtPath =
                    options.rewritePathOnMatch === false
                        ? path
                        : router.buildPath(routeName, routeParams)

                return router.makeState(routeName, routeParams, builtPath, {
                    params: meta,
                    source
                })
            }

            return null
        }

        /**
         * Set the root path for the router.
         * 
         * This is useful when the router is mounted at a specific base path.
         * 
         * @param rootPath - Base path for the router
         * 
         * @example
         * ```typescript
         * // Mount router at /app
         * router.setRootPath('/app')
         * 
         * // Now routes will be relative to /app
         * router.navigate('users') // navigates to /app/users
         * ```
         */
        router.setRootPath = rootPath => {
            router.rootNode.setPath(rootPath)
        }

        return router
    }
}
