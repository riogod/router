import { RouteNode } from 'route-node'
import { constants } from '../constants'
import { Router, Route } from '../types/router'

export default function withRoutes<Dependencies>(
    routes: Array<Route<Dependencies>> | RouteNode
) {
    return (router: Router<Dependencies>): Router<Dependencies> => {
        router.forward = (fromRoute, toRoute) => {
            router.config.forwardMap[fromRoute] = toRoute

            return router
        }

        const rootNode =
            routes instanceof RouteNode
                ? routes
                : new RouteNode('', '', routes, { onAdd: onRouteAdded })

        function onRouteAdded(route) {
            if (route.canActivate)
                router.canActivate(route.name, route.canActivate)

            if (route.canDeactivate)
                router.canDeactivate(route.name, route.canDeactivate)

            if (route.forwardTo) router.forward(route.name, route.forwardTo)

            if (route.decodeParams)
                router.config.decoders[route.name] = route.decodeParams

            if (route.encodeParams)
                router.config.encoders[route.name] = route.encodeParams

            if (route.defaultParams)
                router.config.defaultParams[route.name] = route.defaultParams

            // Register new lifecycle hooks
            if (route.onEnterRoute)
                router.registerOnEnterRoute(route.name, route.onEnterRoute)

            if (route.onExitRoute)
                router.registerOnExitRoute(route.name, route.onExitRoute)

            if (route.onRouteInActiveChain)
                router.registerOnRouteInActiveChain(route.name, route.onRouteInActiveChain)

            if (route.browserTitle)
                router.registerBrowserTitle(route.name, route.browserTitle)
        }

        router.rootNode = rootNode

        router.add = (routesInput, finalSort?) => {
            if (routesInput) {
                rootNode.add(routesInput, onRouteAdded, !finalSort);
            }

            if (finalSort) {
                rootNode.sortDescendants();
            }
            return router;
        }

        router.addNode = (name, path, canActivateHandler?) => {
            rootNode.addNode(name, path)
            if (canActivateHandler) router.canActivate(name, canActivateHandler)
            return router
        }

        // Перегрузки для isActive
        function isActiveOverload(name: string): boolean
        function isActiveOverload(name: string, params: any): boolean
        function isActiveOverload(name: string, params: any, strictEquality: boolean): boolean
        function isActiveOverload(name: string, params: any, strictEquality: boolean, ignoreQueryParams: boolean): boolean
        function isActiveOverload(
            name: string,
            params?: any,
            strictEquality: boolean = false,
            ignoreQueryParams: boolean = true
        ): boolean {
            const activeState = router.getState()

            if (!activeState) return false

            // Определяем, были ли параметры переданы явно
            const paramsProvided = arguments.length > 1

            if (!paramsProvided) {
                // Если параметры не указаны, проверяем только иерархию имен
                if (strictEquality) {
                    return activeState.name === name
                }
                
                const activeNameParts = activeState.name.split('.')
                const targetNameParts = name.split('.')
                
                // Проверяем, является ли активный маршрут потомком целевого
                if (targetNameParts.length <= activeNameParts.length) {
                    return targetNameParts.every((part, index) => 
                        activeNameParts[index] === part
                    )
                }
                return false
            }

            // Параметры переданы - используем стандартную логику
            const targetState = router.makeState(name, params)
            
            if (strictEquality || activeState.name === name) {
                return router.areStatesEqual(
                    targetState,
                    activeState,
                    ignoreQueryParams
                )
            }

            return router.areStatesDescendants(targetState, activeState)
        }
        
        router.isActive = isActiveOverload

        router.buildPath = (route, params) => {
            if (route === constants.UNKNOWN_ROUTE) {
                return params.path
            }

            const paramsWithDefault = {
                ...router.config.defaultParams[route],
                ...params
            }

            const {
                trailingSlashMode,
                queryParamsMode,
                queryParams
            } = router.getOptions()
            const encodedParams = router.config.encoders[route]
                ? router.config.encoders[route](paramsWithDefault)
                : paramsWithDefault

            return router.rootNode.buildPath(route, encodedParams, {
                trailingSlashMode,
                queryParamsMode,
                queryParams,
                urlParamsEncoding: router.getOptions().urlParamsEncoding
            })
        }

        router.matchPath = (path, source) => {
            const options = router.getOptions()
            const match = router.rootNode.matchPath(path, options)

            if (match) {
                const { name, params, meta } = match
                const decodedParams = router.config.decoders[name]
                    ? router.config.decoders[name](params)
                    : params
                const {
                    name: routeName,
                    params: routeParams
                } = router.forwardState(name, decodedParams)
                const builtPath =
                    options.rewritePathOnMatch === false
                        ? path
                        : router.buildPath(routeName, routeParams)

                return router.makeState(routeName, routeParams, builtPath, {
                    params: meta,
                    source
                })
            }

            return null
        }

        router.setRootPath = rootPath => {
            router.rootNode.setPath(rootPath)
        }

        return router
    }
}
