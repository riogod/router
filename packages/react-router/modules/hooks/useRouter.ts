/**
 * @fileoverview React hook for accessing router instance.
 * Provides a convenient way to access router functionality in functional components.
 * 
 * @module @riogz/react-router/hooks/useRouter
 */

import { useContext } from 'react'
import { routerContext } from '../context'
import { Router } from '@riogz/router'

/**
 * React hook that provides access to the router instance.
 * Must be used within a RouterProvider component tree.
 * 
 * Note: This hook does NOT automatically re-render when route changes.
 * Use `useRoute()` if you need reactive updates to route changes.
 * 
 * @returns {Router} The router instance with navigation methods
 * @throws {Error} If used outside of RouterProvider
 * 
 * @example
 * ```typescript
 * import { useRouter } from '@riogz/react-router'
 * 
 * function NavigationButton() {
 *   const router = useRouter()
 *   
 *   const handleClick = () => {
 *     router.navigate('users.profile', { id: '123' })
 *   }
 *   
 *   return (
 *     <button onClick={handleClick}>
 *       Go to Profile
 *     </button>
 *   )
 * }
 * 
 * // Usage with router methods
 * function RouterControls() {
 *   const router = useRouter()
 *   
 *   return (
 *     <div>
 *       <button onClick={() => router.navigate('home')}>Home</button>
 *       <button onClick={() => router.navigate('about')}>About</button>
 *       <button onClick={() => router.stop()}>Stop Router</button>
 *     </div>
 *   )
 * }
 * ```
 */
export default function useRouter(): Router {
    const router = useContext(routerContext)
    if (!router) {
        throw new Error('useRouter must be used within a RouterProvider')
    }
    return router
}
