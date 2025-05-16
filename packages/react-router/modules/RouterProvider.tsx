import React, { useState, useEffect, ReactNode } from 'react'
import { UnsubscribeFn, RouteState } from './types'
import { Router } from '@riogz/router'
import { routerContext, routeContext } from './context'

export function shouldSubscribeToRouter() {
    return typeof window !== 'undefined';
}

export interface RouteProviderProps {
    router: Router
    children: ReactNode
}

const RouterProvider: React.FC<RouteProviderProps> = ({ router, children }) => {
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
