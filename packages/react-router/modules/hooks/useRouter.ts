import { useContext } from 'react'
import { routerContext } from '../context'
import { Router } from '@riogz/router'

export default function useRouter(): Router {
    const router = useContext(routerContext)
    if (!router) {
        throw new Error('useRouter must be used within a RouterProvider')
    }
    return router
}
