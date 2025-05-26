/**
 * @fileoverview React hook for selective route node updates.
 * Provides optimized route state access that only updates when specific
 * route nodes change, improving performance for large route trees.
 * 
 * @module @riogz/react-router/hooks/useRouteNode
 */

import { shouldUpdateNode } from '@riogz/router-transition-path'
import { useContext, useEffect, useState } from 'react'
import { routerContext } from '../context'
import { RouteContext } from '../types'

/**
 * Function type for unsubscribing from router events.
 * @typedef {Function} UnsubscribeFn
 * @returns {void}
 */
export type UnsubscribeFn = () => void

/**
 * React hook that provides selective route state updates for specific route nodes.
 * Only triggers re-renders when the specified route node should be updated,
 * providing better performance than useRoute() for components that only care
 * about specific parts of the route tree.
 * 
 * @param {string} nodeName - The route node name to monitor for changes
 * @returns {RouteContext} Object containing router, current route, and previous route
 * @throws {Error} If used outside of RouterProvider
 * 
 * @example
 * ```typescript
 * import { useRouteNode } from '@riogz/react-router'
 * 
 * // Component that only updates for 'users' route changes
 * function UserSection() {
 *   const { router, route, previousRoute } = useRouteNode('users')
 *   
 *   // This component will only re-render when:
 *   // - Navigating to/from users routes
 *   // - User route parameters change
 *   // - User route metadata changes
 *   
 *   return (
 *     <div>
 *       {route.name.startsWith('users') ? (
 *         <UserContent route={route} />
 *       ) : (
 *         <div>Not in users section</div>
 *       )}
 *     </div>
 *   )
 * }
 * 
 * // Performance optimization for nested routes
 * function ProfileSection() {
 *   const { route } = useRouteNode('users.profile')
 *   
 *   // Only updates when profile-related routes change
 *   // Ignores changes to users.list, users.search, etc.
 *   
 *   return (
 *     <div>
 *       Profile for user: {route.params.userId}
 *     </div>
 *   )
 * }
 * 
 * // Conditional rendering with optimization
 * function AdminPanel() {
 *   const { route, router } = useRouteNode('admin')
 *   
 *   if (!route.name.startsWith('admin')) {
 *     return null // Component won't update for non-admin routes
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Admin Panel</h1>
 *       <p>Current admin page: {route.name}</p>
 *       <button onClick={() => router.navigate('admin.users')}>
 *         Manage Users
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export default function useRouteNode(nodeName: string): RouteContext {
    const router = useContext(routerContext)

    if (!router) {
        throw new Error('useRouteNode must be used within a RouterProvider')
    }

    const [state, setState] = useState<Omit<RouteContext, 'router'>>(() => ({
        previousRoute: null,
        route: router.getState()
    }))

    useEffect(() => {
        if (!router) {
            return
        }

        const subscription = router.subscribe(({ route, previousRoute }) => {
            const shouldUpdate = shouldUpdateNode(nodeName)(route, previousRoute)

                if (shouldUpdate) {
                    setState({
                        route,
                        previousRoute
                    })
                }
        })

        return () => {
            if (typeof subscription === 'function') {
                (subscription as UnsubscribeFn)()
            }
        }
    }, [router, nodeName])

    return { router, ...state }
}
