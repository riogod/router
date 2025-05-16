import { useContext } from 'react'
import { routeContext } from '../context'
import { RouteContext } from '../types'

export default function useRoute(): RouteContext {
    const context = useContext(routeContext)
    if (!context) {
        // Бросаем ошибку, если хук используется вне провайдера, который предоставляет routeContext
        // (Обычно это RouterProvider)
        throw new Error('useRoute must be used within a RouterProvider or a component that provides routeContext')
    }
    return context
}
