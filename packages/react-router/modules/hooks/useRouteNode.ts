import { shouldUpdateNode } from '@riogz/router-transition-path'
import { useContext, useEffect, useState } from 'react'
import { routerContext } from '../context'
import { RouteContext } from '../types'

export type UnsubscribeFn = () => void

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
