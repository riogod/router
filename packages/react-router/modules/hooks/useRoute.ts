/**
 * @fileoverview React hook for accessing route state with reactive updates.
 * Provides access to current route, previous route, and router instance
 * with automatic re-rendering on route changes.
 * 
 * @module @riogz/react-router/hooks/useRoute
 */

import { useContext } from 'react'
import { routeContext } from '../context'
import { RouteContext } from '../types'

/**
 * React hook that provides access to route context with reactive updates.
 * Must be used within a RouterProvider component tree.
 * 
 * This hook automatically re-renders the component when route changes occur,
 * making it ideal for components that need to respond to navigation.
 * 
 * @returns {RouteContext} Object containing router, current route, and previous route
 * @throws {Error} If used outside of RouterProvider or route context
 * 
 * @example
 * ```typescript
 * import { useRoute } from '@riogz/react-router'
 * 
 * function CurrentRouteDisplay() {
 *   const { router, route, previousRoute } = useRoute()
 *   
 *   return (
 *     <div>
 *       <h1>Current Route: {route.name}</h1>
 *       <p>Parameters: {JSON.stringify(route.params)}</p>
 *       {previousRoute && (
 *         <p>Previous: {previousRoute.name}</p>
 *       )}
 *       
 *       <button onClick={() => router.navigate('home')}>
 *         Go Home
 *       </button>
 *     </div>
 *   )
 * }
 * 
 * // Conditional rendering based on route
 * function ConditionalContent() {
 *   const { route } = useRoute()
 *   
 *   if (route.name === 'users.profile') {
 *     return <UserProfile userId={route.params.id} />
 *   }
 *   
 *   if (route.name.startsWith('admin')) {
 *     return <AdminPanel />
 *   }
 *   
 *   return <DefaultContent />
 * }
 * ```
 */
export default function useRoute(): RouteContext {
    const context = useContext(routeContext)
    if (!context) {
        // Бросаем ошибку, если хук используется вне провайдера, который предоставляет routeContext
        // (Обычно это RouterProvider)
        throw new Error('useRoute must be used within a RouterProvider or a component that provides routeContext')
    }
    return context
}
