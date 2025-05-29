import {
    TrailingSlashMode,
    QueryParamsMode,
    QueryParamsOptions,
    RouteNode,
    RouteNodeState,
    URLParamsEncodingType
} from '../lib/route-node'
import {
    State,
    SimpleState,
    Params,
    DoneFn,
    NavigationOptions,
    Unsubscribe,
    CancelFn
} from './base'

/**
 * Route definition interface that describes a single route in the application.
 * 
 * @template Dependencies - Type of dependencies available to route handlers
 */
export interface Route<
    Dependencies extends DefaultDependencies = DefaultDependencies
> {
    /** Unique name identifier for the route */
    name: string
    /** URL path pattern with optional parameters (e.g., '/users/:id') */
    path: string
    /** Browser title for the route - can be static string or dynamic function */
    browserTitle?: string | ((state: State, deps: Dependencies) => Promise<string>)
    /** Guard function to control route activation */
    canActivate?: ActivationFnFactory<Dependencies>
    /** Route name to forward to instead of rendering this route */
    forwardTo?: string
    /** Automatically redirect to the first accessible child route when this route is accessed */
    redirectToFirstAllowNode?: boolean
    /** Child routes nested under this route */
    children?: Array<Route<Dependencies>>
    /** Function to encode route parameters before building URLs */
    encodeParams?(stateParams: Params): Params
    /** Function to decode route parameters after parsing URLs */
    decodeParams?(pathParams: Params): Params
    /** Default parameter values for this route */
    defaultParams?: Params
    /** Lifecycle hook called when entering this route */
    onEnterNode?: (state: State, fromState: State, deps: Dependencies) => Promise<void>
    /** Lifecycle hook called when exiting this route */
    onExitNode?: (state: State, fromState: State, deps: Dependencies) => Promise<void>
    /** Lifecycle hook called when this route is in the active chain */
    onNodeInActiveChain?: (state: State, fromState: State, deps: Dependencies) => Promise<void>
}

/**
 * Configuration options for router behavior and features.
 */
export interface Options {
    /** Default route to navigate to when no route is specified */
    defaultRoute?: string
    /** Default parameter values applied to all routes */
    defaultParams?: Params
    /** Whether to enforce strict trailing slash matching */
    strictTrailingSlash: boolean
    /** How to handle trailing slashes in URLs */
    trailingSlashMode: TrailingSlashMode
    /** How to handle query parameters */
    queryParamsMode: QueryParamsMode
    /** Whether to automatically clean up event listeners on stop */
    autoCleanUp: boolean
    /** Whether to allow navigation to non-existent routes */
    allowNotFound: boolean
    /** Whether to use strong matching for route parameters */
    strongMatching: boolean
    /** Whether to rewrite the path when a route matches */
    rewritePathOnMatch: boolean
    /** Configuration for query parameter handling */
    queryParams?: QueryParamsOptions
    /** Whether route matching is case sensitive */
    caseSensitive: boolean
    /** How to encode URL parameters */
    urlParamsEncoding?: URLParamsEncodingType
}

/**
 * Function signature for route activation guards.
 * 
 * @param toState - The state being navigated to
 * @param fromState - The current state being navigated from
 * @param done - Callback to signal completion or error
 * @returns Boolean indicating if navigation should proceed, Promise for async checks, or void
 */
export type ActivationFn = (
    toState: State,
    fromState: State,
    done: DoneFn
) => boolean | Promise<boolean> | void

/**
 * Factory function that creates activation functions with access to router and dependencies.
 * 
 * @template Dependencies - Type of dependencies available to the factory
 * @param router - Router instance
 * @param dependencies - Injected dependencies
 * @returns An activation function
 */
export type ActivationFnFactory<
    Dependencies extends DefaultDependencies = DefaultDependencies
> = (router: Router, dependencies?: Dependencies) => ActivationFn

/**
 * Default type for dependency injection - allows any key-value pairs.
 */
export type DefaultDependencies = Record<string, any>

/**
 * Internal configuration object for router state management.
 */
export interface Config {
    /** Parameter decoders for route parameters */
    decoders: Record<string, any>
    /** Parameter encoders for route parameters */
    encoders: Record<string, any>
    /** Default parameter values */
    defaultParams: Record<string, any>
    /** Route forwarding mappings */
    forwardMap: Record<string, any>
    /** Routes that should redirect to first accessible child */
    redirectToFirstAllowNodeMap?: Record<string, boolean>
}

/**
 * Main router interface providing all routing functionality.
 * 
 * @template Dependencies - Type of dependencies injected into the router
 */
export interface Router<
    Dependencies extends DefaultDependencies = DefaultDependencies
> {
    /** Internal configuration object */
    config: Config

    /** Root node of the route tree */
    rootNode: RouteNode
    
    /**
     * Add routes to the router
     * @param routes - Route definitions to add
     * @param finalSort - Whether to perform final sorting after adding
     * @returns Router instance for chaining
     */
    add(
        routes: Array<Route<Dependencies>> | Route<Dependencies>,
        finalSort?: boolean
    ): Router<Dependencies>
    
    /**
     * Add a single route node programmatically
     * @param name - Route name
     * @param path - Route path pattern
     * @param canActivateHandler - Optional activation guard
     * @returns Router instance for chaining
     */
    addNode(
        name: string,
        path: string,
        canActivateHandler?: ActivationFnFactory<Dependencies>
    ): Router<Dependencies>
    
    /**
     * Check if a route is currently active
     * @param name - Route name to check
     * @param params - Route parameters to match
     * @param strictEquality - Whether to use strict parameter matching
     * @param ignoreQueryParams - Whether to ignore query parameters in comparison
     * @returns True if the route is active
     */
    isActive(
        name: string,
        params?: Params,
        strictEquality?: boolean,
        ignoreQueryParams?: boolean
    ): boolean
    
    /**
     * Build a URL path for a route
     * @param route - Route name
     * @param params - Route parameters
     * @returns Built URL path
     */
    buildPath(route: string, params?: Params): string
    
    /**
     * Match a URL path to a route and return the resulting state
     * @param path - URL path to match
     * @param source - Source of the path (for debugging)
     * @returns Matched state or null if no match
     */
    matchPath(path: string, source?: string): State | null
    
    /**
     * Set the root path for the router
     * @param rootPath - Root path to set
     */
    setRootPath(rootPath: string): void

    getOptions(): Options
    setOption(option: string, value: any): Router<Dependencies>

    makeState(
        name: string,
        params?: Params,
        path?: string,
        meta?: any,
        forceId?: number
    ): State
    makeNotFoundState(path: string, options?: NavigationOptions): State
    getState(): State
    setState(state: State): void
    areStatesEqual(
        state1: State,
        state2: State,
        ignoreQueryParams?: boolean
    ): boolean
    areStatesDescendants(parentState: State, childState: State): boolean
    forwardState(routeName: string, routeParams: Params): SimpleState
    buildState(routeName: string, routeParams: Params): RouteNodeState | null

    isStarted(): boolean
    start(startPathOrState: string | State, done?: DoneFn): Router<Dependencies>
    start(done?: DoneFn): Router<Dependencies>
    stop(): void

    canDeactivate(
        name: string,
        canDeactivateHandler: ActivationFnFactory<Dependencies> | boolean
    ): Router<Dependencies>
    clearCanDeactivate(name: string): Router
    canActivate(
        name: string,
        canActivateHandler: ActivationFnFactory<Dependencies> | boolean
    ): Router<Dependencies>
    getLifecycleFactories(): [
        { [key: string]: ActivationFnFactory<Dependencies> },
        { [key: string]: ActivationFnFactory<Dependencies> }
    ]
    getLifecycleFunctions(): [
        { [key: string]: ActivationFn },
        { [key: string]: ActivationFn }
    ]

    getRouteLifecycleFactories(): {
        onEnterNode: { [key: string]: (state: State, fromState: State) => Promise<void> }
        onExitNode: { [key: string]: (state: State, fromState: State) => Promise<void> }
        onNodeInActiveChain: { [key: string]: (state: State, fromState: State) => Promise<void> }
    }
    getRouteLifecycleFunctions(): {
        onEnterNode: { [key: string]: (state: State, fromState: State) => Promise<void> }
        onExitNode: { [key: string]: (state: State, fromState: State) => Promise<void> }
        onNodeInActiveChain: { [key: string]: (state: State, fromState: State) => Promise<void> }
    }

    getBrowserTitleFunctions(): { [key: string]: string | ((state: State) => Promise<string>) }

    // Internal methods for registering route lifecycle hooks
    registerOnEnterNode(name: string, handler: (state: State, fromState: State, deps: Dependencies) => Promise<void>): Router<Dependencies>
    registerOnExitNode(name: string, handler: (state: State, fromState: State, deps: Dependencies) => Promise<void>): Router<Dependencies>
    registerOnNodeInActiveChain(name: string, handler: (state: State, fromState: State, deps: Dependencies) => Promise<void>): Router<Dependencies>
    registerBrowserTitle(name: string, handler: string | ((state: State, deps: Dependencies) => Promise<string>)): Router<Dependencies>

    // Internal method for redirectToFirstAllowNode functionality
    findFirstAccessibleChild(routeName: string, params?: any): Promise<string | null>

    usePlugin(...plugins: Array<PluginFactory<Dependencies>>): Unsubscribe
    addPlugin(plugin: Plugin): Router<Dependencies>
    getPlugins(): Array<PluginFactory<Dependencies>>

    useMiddleware(
        ...middlewares: Array<MiddlewareFactory<Dependencies>>
    ): Unsubscribe
    clearMiddleware(): Router
    getMiddlewareFactories: () => Array<MiddlewareFactory<Dependencies>>
    getMiddlewareFunctions: () => Middleware[]

    setDependency(dependencyName: string, dependency: any): Router
    setDependencies(deps: Dependencies): Router
    getDependencies(): Dependencies
    getInjectables(): [Router<Dependencies>, Dependencies]
    executeFactory(
        factory: (
            router?: Router<Dependencies>,
            dependencies?: Dependencies
        ) => any
    ): any

    invokeEventListeners: (eventName, ...args) => void
    removeEventListener: (eventName, cb) => void
    addEventListener: (eventName, cb) => Unsubscribe

    cancel(): Router<Dependencies>
    forward(fromRoute: string, toRoute: string): Router<Dependencies>
    navigate(
        routeName: string,
        routeParams: Params,
        options: NavigationOptions,
        done?: DoneFn
    ): CancelFn
    navigate(routeName: string, routeParams: Params, done?: DoneFn): CancelFn
    navigate(routeName: string, done?: DoneFn): CancelFn
    navigateToDefault(opts: NavigationOptions, done?: DoneFn): CancelFn
    navigateToDefault(done?: DoneFn): CancelFn
    transitionToState(
        toState: State,
        fromState: State,
        opts: NavigationOptions,
        done: DoneFn
    )

    subscribe(listener: SubscribeFn | Listener): Unsubscribe | Subscription
}

/**
 * Plugin interface for extending router functionality with lifecycle hooks.
 */
export interface Plugin {
    /** Called when the router starts */
    onStart?(): void
    /** Called when the router stops */
    onStop?(): void
    /** Called when a transition starts */
    onTransitionStart?(toState?: State, fromState?: State): void
    /** Called when a transition is cancelled */
    onTransitionCancel?(toState?: State, fromState?: State): void
    /** Called when a transition encounters an error */
    onTransitionError?(toState?: State, fromState?: State, err?: any): void
    /** Called when a transition completes successfully */
    onTransitionSuccess?(
        toState?: State,
        fromState?: State,
        opts?: NavigationOptions
    ): void
    /** Called when the plugin is being removed/destroyed */
    teardown?(): void
}

/**
 * Middleware function signature for intercepting and controlling route transitions.
 * 
 * @param toState - The state being navigated to
 * @param fromState - The current state being navigated from
 * @param done - Callback to signal completion or error
 * @returns Boolean indicating if transition should proceed, Promise for async operations, or void
 */
export type Middleware = (
    toState: State,
    fromState: State,
    done: DoneFn
) => boolean | Promise<any> | void

/**
 * Factory function that creates middleware with access to router and dependencies.
 * 
 * @template Dependencies - Type of dependencies available to the factory
 * @param router - Router instance
 * @param dependencies - Injected dependencies
 * @returns A middleware function
 */
export type MiddlewareFactory<
    Dependencies extends DefaultDependencies = DefaultDependencies
> = (router: Router, dependencies: Dependencies) => Middleware

/**
 * Factory function that creates plugins with access to router and dependencies.
 * 
 * @template Dependencies - Type of dependencies available to the factory
 * @param router - Router instance (optional)
 * @param dependencies - Injected dependencies (optional)
 * @returns A plugin instance
 */
export type PluginFactory<
    Dependencies extends DefaultDependencies = DefaultDependencies
> = (router?: Router, dependencies?: Dependencies) => Plugin

/**
 * State object passed to subscription callbacks containing current and previous routes.
 */
export interface SubscribeState {
    /** Current active route state */
    route: State
    /** Previous route state */
    previousRoute: State
}

/**
 * Subscription callback function signature.
 * 
 * @param state - Object containing current and previous route states
 */
export type SubscribeFn = (state: SubscribeState) => void

/**
 * Observable listener interface for RxJS-style subscriptions.
 */
export interface Listener {
    /** Method called with new values */
    next: (val: any) => void
    /** Additional properties allowed */
    [key: string]: any
}

/**
 * Subscription object returned from subscribe operations.
 */
export interface Subscription {
    /** Method to unsubscribe from updates */
    unsubscribe: Unsubscribe
}
