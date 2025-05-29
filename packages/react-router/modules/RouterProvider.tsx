/**
 * @fileoverview RouterProvider component for React Router integration.
 * Provides router context to React component tree and manages route state subscriptions.
 * 
 * @module @riogz/react-router/RouterProvider
 */

import React, { useState, useEffect, ReactNode } from 'react'
import { UnsubscribeFn, RouteState } from './types'
import { Router, type DefaultDependencies } from '@riogz/router'
import { routerContext, routeContext } from './context'

/**
 * Determines whether to subscribe to router changes.
 * Returns false in server-side rendering environments to prevent hydration issues.
 * 
 * @returns {boolean} True if running in browser environment, false otherwise
 * 
 * @example
 * ```typescript
 * // Check if we should set up router subscriptions
 * if (shouldSubscribeToRouter()) {
 *   // Safe to subscribe to router events
 *   router.subscribe(listener)
 * }
 * ```
 */
export function shouldSubscribeToRouter() {
    return typeof window !== 'undefined';
}

/**
 * Props for the RouterProvider component.
 * 
 * @interface RouteProviderProps
 * @template Dependencies - Type of dependencies injected into the router
 */
export interface RouteProviderProps<Dependencies extends DefaultDependencies = DefaultDependencies> {
    /** The router instance to provide to child components */
    router: Router<Dependencies>
    /** Child components that will have access to router context */
    children: ReactNode
}

/**
 * RouterProvider component that provides router context to React component tree.
 * 
 * This component sets up the necessary React contexts for router integration,
 * manages route state subscriptions, and ensures proper cleanup. It provides
 * both the router instance and current route state to all child components.
 * 
 * The component automatically handles:
 * - Router state subscriptions and cleanup
 * - Server-side rendering compatibility
 * - Route state updates and propagation
 * - Context value optimization
 * 
 * @template Dependencies - Type of dependencies injected into the router
 * @param {RouteProviderProps<Dependencies>} props - Component props
 * @returns {React.ReactElement} Provider component wrapping children
 * 
 * @example
 * ```typescript
 * import React from 'react'
 * import { createRouter } from '@riogz/router'
 * import { RouterProvider } from '@riogz/react-router'
 * import browserPlugin from '@riogz/router-plugin-browser'
 * 
 * const routes = [
 *   { name: 'home', path: '/' },
 *   { name: 'users', path: '/users/:id' },
 *   { name: 'about', path: '/about' }
 * ]
 * 
 * const router = createRouter(routes)
 * router.usePlugin(browserPlugin())
 * 
 * function App() {
 *   return (
 *     <RouterProvider router={router}>
 *       <div>
 *         <Navigation />
 *         <MainContent />
 *       </div>
 *     </RouterProvider>
 *   )
 * }
 * 
 * // Child components can now use router hooks
 * function Navigation() {
 *   const { router, route } = useRoute()
 *   
 *   return (
 *     <nav>
 *       <button 
 *         onClick={() => router.navigate('home')}
 *         className={route.name === 'home' ? 'active' : ''}
 *       >
 *         Home
 *       </button>
 *       <button 
 *         onClick={() => router.navigate('about')}
 *         className={route.name === 'about' ? 'active' : ''}
 *       >
 *         About
 *       </button>
 *     </nav>
 *   )
 * }
 * ```
 */
function RouterProvider<Dependencies extends DefaultDependencies = DefaultDependencies>({ router, children }: RouteProviderProps<Dependencies>) {
    const [routeState, setRouteState] = useState<RouteState>(() => ({
        route: router.getState(),
        previousRoute: null,
    }))

    useEffect(() => {
        // Не подписываемся на изменения на стороне сервера
        if (!shouldSubscribeToRouter()) {
            return
        }

        const listener = ({ route, previousRoute }: { route: any; previousRoute: any }) => {
            setRouteState({
                route,
                previousRoute,
            })
        }

        // Подписываемся на изменения роутера
        const unsubscribe = router.subscribe(listener) as UnsubscribeFn

        // Функция очистки для отписки при размонтировании или изменении router
        return () => {
            if (unsubscribe) {
                unsubscribe()
            }
        }
    }, [router]) // Перезапускаем эффект, если экземпляр router изменился

    return (
        <routerContext.Provider value={router}>
            <routeContext.Provider value={{ router, ...routeState }}>
                {children}
            </routeContext.Provider>
        </routerContext.Provider>
    )
}

export default RouterProvider
