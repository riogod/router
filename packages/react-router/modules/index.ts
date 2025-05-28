/**
 * @fileoverview Main entry point for @riogz/react-router package.
 * 
 * This module exports React integration components, hooks, and higher-order components
 * for seamless router integration in React applications.
 * 
 * Exports include:
 * - RouterProvider: Context provider for router state
 * - BaseLink: Foundation link component with router integration
 * - Hooks: useRouter, useRoute, useRouteNode for reactive router access
 * - HOCs: withRouter, withRoute, routeNode for component enhancement
 * - Render props: Router, Route, RouteNode for flexible component patterns
 * - Pre-configured components: Link, ConnectedLink for common use cases
 * 
 * @module @riogz/react-router
 * 
 * 
 * @example
 * ```tsx
 * import { RouterProvider, useRoute, useRouter } from '@riogz/react-router';
 * 
 * function App() {
 *   return (
 *     <RouterProvider router={router}>
 *       <Navigation />
 *     </RouterProvider>
 *   );
 * }
 * 
 * function Navigation() {
 *   const router = useRouter();
 *   const route = useRoute();
 *   
 *   return (
 *     <nav>
 *       <button onClick={() => router.navigate('home')}>
 *         Home {route.name === 'home' && '(current)'}
 *       </button>
 *     </nav>
 *   );
 * }
 * ```
 */

import RouterProvider from './RouterProvider'
// Re-export contexts and types
export { routerContext, routeContext } from './context'
export type { RouteContext, RouteState, UnsubscribeFn } from './types'
export type { BaseLinkProps } from './BaseLink'
import BaseLink from './BaseLink'
import withRouter from './hocs/withRouter'
import withRoute from './hocs/withRoute'
import routeNode from './hocs/routeNode'
import RouteNode from './render/RouteNode'
import useRouter from './hooks/useRouter'
import useRoute from './hooks/useRoute'
import useRouteNode from './hooks/useRouteNode'
import { routerContext, routeContext } from './context'

/** BaseLink component enhanced with route state (reactive to route changes) */
const ConnectedLink = withRoute(BaseLink)

/** BaseLink component enhanced with router instance (non-reactive) */
const Link = withRouter(BaseLink)

/** Consumer component for accessing router instance via render props */
const Router = routerContext.Consumer

/** Consumer component for accessing route state via render props */
const Route = routeContext.Consumer

export {
    // Core components
    RouterProvider,
    BaseLink,
    
    // Pre-configured link components
    ConnectedLink,
    Link,
    
    // Higher-Order Components (HOCs)
    withRouter,
    withRoute,
    routeNode,
    
    // Render prop components
    Router,
    Route,
    RouteNode,
    
    // React hooks
    useRouter,
    useRoute,
    useRouteNode
}
