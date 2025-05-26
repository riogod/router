/**
 * @fileoverview React context definitions for router integration.
 * Provides React contexts for sharing router instance and route state
 * throughout the component tree.
 * 
 * @module @riogz/react-router/context
 */

import React from 'react'
import { RouteContext } from './types'
import { Router } from '@riogz/router'

const createContext = React.createContext

/**
 * React context for sharing route state and router instance.
 * Provides access to current route, previous route, and router instance
 * to all child components.
 * 
 * @constant {React.Context<RouteContext>}
 * 
 * @example
 * ```typescript
 * import { routeContext } from '@riogz/react-router'
 * 
 * // Using context directly
 * function MyComponent() {
 *   return (
 *     <routeContext.Consumer>
 *       {({ router, route, previousRoute }) => (
 *         <div>
 *           Current route: {route.name}
 *           <button onClick={() => router.navigate('home')}>
 *             Go Home
 *           </button>
 *         </div>
 *       )}
 *     </routeContext.Consumer>
 *   )
 * }
 * ```
 */
export const routeContext = createContext<RouteContext>(null)

/**
 * React context for sharing the router instance.
 * Provides access to router navigation methods and state
 * to all child components.
 * 
 * @constant {React.Context<Router>}
 * 
 * @example
 * ```typescript
 * import { routerContext } from '@riogz/react-router'
 * 
 * // Using context directly
 * function NavigationComponent() {
 *   return (
 *     <routerContext.Consumer>
 *       {router => (
 *         <nav>
 *           <button onClick={() => router.navigate('home')}>Home</button>
 *           <button onClick={() => router.navigate('about')}>About</button>
 *         </nav>
 *       )}
 *     </routerContext.Consumer>
 *   )
 * }
 * ```
 */
export const routerContext = createContext<Router>(null)
