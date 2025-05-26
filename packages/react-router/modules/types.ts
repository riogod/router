/**
 * @fileoverview Type definitions for React Router integration.
 * Defines interfaces for React components that work with the router state,
 * context types, and utility functions.
 * 
 * @module @riogz/react-router/types
 */

import { Router, State } from '@riogz/router'

/**
 * Context type that combines router instance with current route state.
 * Used by React components to access both router functionality and current route information.
 * 
 * @interface RouteContext
 * 
 * @example
 * ```typescript
 * // In a component using useRoute hook
 * const { router, route, previousRoute } = useRoute()
 * 
 * // Access router methods
 * router.navigate('users.profile', { id: '123' })
 * 
 * // Access current route state
 * console.log(route.name)        // 'users.view'
 * console.log(route.params)      // { id: '123' }
 * console.log(previousRoute?.name) // 'home'
 * ```
 */
export type RouteContext = {
    /** The router instance with all navigation methods */
    router: Router
} & RouteState

/**
 * Interface representing the current and previous route states.
 * Provides access to route transition information for React components.
 * 
 * @interface RouteState
 * 
 * @example
 * ```typescript
 * // Component receiving route state
 * function MyComponent({ route, previousRoute }: RouteState) {
 *   // Current route information
 *   const currentPage = route.name
 *   const currentParams = route.params
 *   
 *   // Previous route for transition logic
 *   const cameFromHome = previousRoute?.name === 'home'
 *   
 *   return <div>Current: {currentPage}</div>
 * }
 * ```
 */
export interface RouteState {
    /** 
     * Current active route state with name, parameters, and metadata.
     * Contains all information about the currently active route.
     */
    route: State
    
    /** 
     * Previous route state before the current transition.
     * Null if this is the first route or no previous route exists.
     */
    previousRoute: State | null
}

/**
 * Function type for unsubscribing from router events.
 * Returned by router subscription methods to allow cleanup.
 * 
 * @typedef {Function} UnsubscribeFn
 * @returns {void}
 * 
 * @example
 * ```typescript
 * // Subscribe to router changes
 * const unsubscribe: UnsubscribeFn = router.subscribe(listener)
 * 
 * // Later, clean up the subscription
 * unsubscribe()
 * ```
 */
export type UnsubscribeFn = () => void
