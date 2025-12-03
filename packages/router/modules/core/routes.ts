import { RouteNode } from '../lib/route-node'
import { constants } from '../constants'
import { Router, Route, ActivationFnFactory } from '../types/router'
import { Params } from '../types/base'

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
                : new RouteNode('', '', routes, { onAdd: onRouteAddedInternal })

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
        function onRouteAddedInternal(route: Route<Dependencies>) {
            if (route.canActivate)
                router.canActivate(route.name, route.canActivate)

            if (route.canDeactivate)
                router.canDeactivate(route.name, route.canDeactivate)

            if (route.forwardTo) router.forward(route.name, route.forwardTo)

            // Handle redirectToFirstAllowNode
            if (route.redirectToFirstAllowNode) {
                router.config.redirectToFirstAllowNodeMap = router.config.redirectToFirstAllowNodeMap || {}
                router.config.redirectToFirstAllowNodeMap[route.name] = true
            }

            if (route.decodeParams)
                router.config.decoders[route.name] = route.decodeParams

            if (route.encodeParams)
                router.config.encoders[route.name] = route.encodeParams

            if (route.defaultParams)
                router.config.defaultParams[route.name] = route.defaultParams

            // Register new lifecycle hooks
            if (route.onEnterNode)
                router.registerOnEnterNode(route.name, route.onEnterNode)

            if (route.onExitNode)
                router.registerOnExitNode(route.name, route.onExitNode)

            if (route.onNodeInActiveChain)
                router.registerOnNodeInActiveChain(route.name, route.onNodeInActiveChain)

            if (route.browserTitle)
                router.registerBrowserTitle(route.name, route.browserTitle)
        }

        /**
         * Helper function to recursively clear handlers associated with a route name.
         */
        function _recursiveClearHandlers<Dependencies>(router: Router<Dependencies>, routeName: string) {
            // Clear from canActivate and canDeactivate maps (assuming they are accessible, e.g., via router.clearCanActivate() or direct map manipulation if exposed)
            // This part depends on how these are stored and cleared. Let's assume direct access or specific clearers per route aren't public
            // router.clearCanActivate(routeName); // Hypothetical direct method
            // router.clearCanDeactivate(routeName);

            // Accessing internal maps for guards - this is a common pattern if specific clearers per route aren't public
            if (router.getLifecycleFunctions) { // Check if method exists, adjust based on actual API
                const [canActivateFunctions, canDeactivateFunctions] = router.getLifecycleFunctions();
                delete canActivateFunctions[routeName];
                delete canDeactivateFunctions[routeName];
                // Also clear from factory maps if they are separate
                const [canActivateFactories, canDeactivateFactories] = router.getLifecycleFactories();
                delete canActivateFactories[routeName];
                delete canDeactivateFactories[routeName];
            }

            // Clear route lifecycle hooks
            if (router.getRouteLifecycleFunctions) { // Check if method exists
                const routeLifecycle = router.getRouteLifecycleFunctions();
                if (routeLifecycle.onEnterNode) delete routeLifecycle.onEnterNode[routeName];
                if (routeLifecycle.onExitNode) delete routeLifecycle.onExitNode[routeName];
                if (routeLifecycle.onNodeInActiveChain) delete routeLifecycle.onNodeInActiveChain[routeName];
                // Also clear from factory maps if they are separate
                const routeLifecycleFactories = router.getRouteLifecycleFactories();
                if (routeLifecycleFactories.onEnterNode) delete routeLifecycleFactories.onEnterNode[routeName];
                if (routeLifecycleFactories.onExitNode) delete routeLifecycleFactories.onExitNode[routeName];
                if (routeLifecycleFactories.onNodeInActiveChain) delete routeLifecycleFactories.onNodeInActiveChain[routeName];
            }

            // Clear browser title functions
            if (router.getBrowserTitleFunctions) { // Check if method exists
                const browserTitleFunctions = router.getBrowserTitleFunctions();
                delete browserTitleFunctions[routeName];
            }

            // Clear forward mapping
            if (router.config.forwardMap) {
                delete router.config.forwardMap[routeName];
                // Also check if any route forwards TO this routeName and clear that too, if desired
                for (const key in router.config.forwardMap) {
                    if (router.config.forwardMap[key] === routeName) {
                        delete router.config.forwardMap[key];
                    }
                }
            }
            
            // Clear redirectToFirstAllowNode mapping
            if (router.config.redirectToFirstAllowNodeMap) {
                delete router.config.redirectToFirstAllowNodeMap[routeName];
            }

            // Clear decoders and encoders
            if (router.config.decoders) {
                delete router.config.decoders[routeName];
            }
            if (router.config.encoders) {
                delete router.config.encoders[routeName];
            }

            // Clear default params
            if (router.config.defaultParams) {
                delete router.config.defaultParams[routeName];
            }
            
            // Potentially clear other route-specific configurations if any are stored elsewhere
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
                rootNode.add(routesInput, onRouteAddedInternal, !finalSort);
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
         * Removes a route node and all its children from the router.
         * This includes cleaning up associated route guards, lifecycle hooks, and other configurations.
         *
         * @param name - The full name of the route node to remove (e.g., 'users.profile').
         * @returns The router instance for chaining.
         */
        router.removeNode = (name: string): Router<Dependencies> => {
            const segments = name.split('.');
            let currentNode = router.rootNode;
            let parentNode = null;

            // Helper function to recursively collect descendant names
            // Moved to the root of removeNode function body to satisfy no-inner-declarations
            function collectDescendantNames(node: RouteNode, baseName: string, targetFullName: string, pathSegmentsForTarget: string[]): string[] {
                const collectedNames: string[] = [];
                const currentSegmentName = node.name;
                let correctedFullName = baseName ? `${baseName}.${currentSegmentName}` : currentSegmentName;

                // Correction logic for full name based on whether it's a direct child or deeper descendant
                // This aims to match the structure used when handlers were initially registered.
                if (!parentNode || parentNode === router.rootNode) { // Handling direct children of root or the root itself if it's the target
                    if (pathSegmentsForTarget.length === 1 && currentSegmentName === pathSegmentsForTarget[0]) {
                        correctedFullName = currentSegmentName; // Top-level node being removed
                    } else if (pathSegmentsForTarget.length > 1 && currentSegmentName !== pathSegmentsForTarget[pathSegmentsForTarget.length - 1]){
                         // This is a child of the originally targeted node for removal
                        correctedFullName = targetFullName + '.' + node.name.split('.').slice(pathSegmentsForTarget.length -1).join('.');
                    } else if (pathSegmentsForTarget.length > 1 && currentSegmentName === pathSegmentsForTarget[pathSegmentsForTarget.length -1]) {
                        correctedFullName = targetFullName; // This is the originally targeted node itself
                    }
                }
                
                collectedNames.push(correctedFullName);
                node.children.forEach(child => {
                    collectedNames.push(...collectDescendantNames(child, correctedFullName, targetFullName, pathSegmentsForTarget));
                });
                return collectedNames;
            }

            // Find the parent of the node to be removed
            for (let i = 0; i < segments.length - 1; i++) {
                const segmentName = segments[i];
                const foundNode = currentNode.children.find(child => child.name === segmentName);
                if (foundNode) {
                    parentNode = foundNode;
                    currentNode = foundNode;
                } else {
                    return router; // Parent segment not found
                }
            }

            const nodeNameToRemove = segments[segments.length - 1];
            const targetNode = (parentNode || router.rootNode).children.find(child => child.name === nodeNameToRemove);

            if (targetNode) {
                const initialBaseName = parentNode ? segments.slice(0, -1).join('.') : '';
                const allRemovedNodeNames = collectDescendantNames(targetNode, initialBaseName, name, segments);
                
                const removed = (parentNode || router.rootNode).removeNode(nodeNameToRemove);

                if (removed) {
                    allRemovedNodeNames.forEach(nodeName => {
                        _recursiveClearHandlers(router, nodeName);
                    });
                }
            }

            return router;
        };

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
                
                let builtPath: string;
                if (options.rewritePathOnMatch === false) {
                    builtPath = path;
                } else {
                    try {
                        builtPath = router.buildPath(routeName, routeParams);
                    } catch (buildPathError) {
                        // If buildPath throws error (e.g., due to forwardTo pointing to non-existent route),
                        // return null to indicate no match
                        return null;
                    }
                }

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

export async function findFirstAccessibleChildAtPath(router: Router, routeName: string, params?: Params): Promise<string | null> {
    if (!router.rootNode) {
        return null;
    }

    // @ts-ignore: getSegmentsByName is private but provides the necessary functionality here
    const segments = router.rootNode.getSegmentsByName(routeName);
    if (!segments || segments.length === 0) {
        return null;
    }
    const targetNode = segments[segments.length - 1];

    if (!targetNode || !targetNode.children || targetNode.children.length === 0) {
        return null;
    }

    const lifecycleFunctions = router.getLifecycleFunctions() as [
        Record<string, ReturnType<ActivationFnFactory<any>>>,
        Record<string, ReturnType<ActivationFnFactory<any>>>
    ];
    const canActivateFunctions = lifecycleFunctions[1];

    for (const childNode of targetNode.children) {
        const childFullName = routeName + '.' + childNode.name;
        const childState = router.buildState(childFullName, params);
        if (!childState) {
            continue;
        }

        let childPath: string;
        try {
            childPath = router.buildPath(childState.name, childState.params);
        } catch (buildPathError) {
            // If route does not exist (e.g., due to forwardTo pointing to non-existent route),
            // skip this child and continue searching
            continue;
        }

        const fullChildState = router.makeState(
            childState.name,
            childState.params,
            childPath
        );

        const canActivateHandler = canActivateFunctions[childFullName];
        if (canActivateHandler) {
            try {
                const canActivateOutcome = await new Promise<boolean>((resolvePromise) => {
                    try {
                        canActivateHandler(fullChildState, null, (err) => {
                            if (err) {
                                resolvePromise(false);
                            } else {
                                resolvePromise(true);
                            }
                        });
                    } catch (syncError) {
                        resolvePromise(false);
                    }
                });

                if (canActivateOutcome) {
                    return childFullName;
                }
            } catch (guardError) {
                continue;
            }
        } else {
            return childFullName;
        }
    }
    return null;
}
