import { Router, Route, Options, DefaultDependencies, Config } from './types/router'

import withOptions from './core/options'
import withRoutes from './core/routes'
import withDependencies from './core/dependencies'
import withState from './core/state'
import withPlugins from './core/plugins'
import withMiddleware from './core/middleware'
import withObservability from './core/observable'
import withNavigation from './core/navigation'
import withRouterLifecycle from './core/routerLifecycle'
import withRouteLifecycle from './core/routeLifecycle'
import { RouteNode } from './lib/route-node'

/**
 * Function type that enhances a router instance with additional functionality
 * @template Dependencies - Type of dependencies injected into the router
 */
type Enhancer<Dependencies> = (
    router: Router<Dependencies>
) => Router<Dependencies>

/**
 * Utility function that composes multiple enhancer functions into a single function
 * @template Dependencies - Type of dependencies injected into the router
 * @param fns - Array of enhancer functions to compose
 * @returns A single function that applies all enhancers in sequence
 */
const pipe = <Dependencies>(...fns: Array<Enhancer<Dependencies>>) => (
    arg: Router<Dependencies>
): Router<Dependencies> =>
    fns.reduce((prev: Router<Dependencies>, fn) => fn(prev), arg)

/**
 * Creates a new router instance with the specified routes, options, and dependencies.
 * 
 * The router is built using a functional composition pattern where each enhancer
 * adds specific functionality to the base router object.
 * 
 * @template Dependencies - Type of dependencies to inject into the router
 * @param routes - Array of route definitions or a RouteNode instance. Defaults to empty array.
 * @param options - Configuration options for the router behavior. Defaults to empty object.
 * @param dependencies - Dependencies to inject into route handlers and middleware. Defaults to empty object.
 * @returns A fully configured router instance
 * 
 * @example
 * ```typescript
 * // Basic router
 * const router = createRouter([
 *   { name: 'home', path: '/' },
 *   { name: 'user', path: '/users/:id' }
 * ])
 * 
 * // Router with options
 * const router = createRouter(routes, {
 *   defaultRoute: 'home',
 *   strictTrailingSlash: false
 * })
 * 
 * // Router with dependencies
 * const router = createRouter(routes, options, {
 *   api: new ApiService(),
 *   auth: new AuthService()
 * })
 * ```
 */
const createRouter = <
    Dependencies extends DefaultDependencies = DefaultDependencies
>(
    routes: Array<Route<Dependencies>> | RouteNode = [],
    options: Partial<Options> = {},
    dependencies: Dependencies = {} as Dependencies
): Router<Dependencies> => {
    const config: Config = {
        decoders: {},
        encoders: {},
        defaultParams: {},
        forwardMap: {},
        redirectToFirstAllowNodeMap: {}
    }

    return pipe<Dependencies>(
        withOptions(options),
        withDependencies(dependencies),
        withObservability,
        withState,
        withRouterLifecycle,
        withRouteLifecycle,
        withNavigation,
        withPlugins,
        withMiddleware,
        withRoutes(routes)
    )({ config } as Router<Dependencies>)
}

export default createRouter
