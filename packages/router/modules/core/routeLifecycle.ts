import { Router } from '../types/router'

const toFunction = val => (typeof val === 'function' ? val : () => () => val)

export default function withRouteLifecycle<Dependencies>(
    router: Router<Dependencies>
): Router<Dependencies> {
    const canDeactivateFactories = {}
    const canActivateFactories = {}
    const canDeactivateFunctions = {}
    const canActivateFunctions = {}
    
    // New lifecycle hooks storage
    const onEnterRouteFactories = {}
    const onExitRouteFactories = {}
    const onRouteInActiveChainFactories = {}
    const onEnterRouteFunctions = {}
    const onExitRouteFunctions = {}
    const onRouteInActiveChainFunctions = {}
    const browserTitleFactories = {}
    const browserTitleFunctions = {}

    router.getLifecycleFactories = () => {
        return [canDeactivateFactories, canActivateFactories]
    }

    router.getLifecycleFunctions = () => {
        return [canDeactivateFunctions, canActivateFunctions]
    }

    // New methods to get route lifecycle hooks
    router.getRouteLifecycleFactories = () => {
        return {
            onEnterRoute: onEnterRouteFactories,
            onExitRoute: onExitRouteFactories,
            onRouteInActiveChain: onRouteInActiveChainFactories
        }
    }

    router.getRouteLifecycleFunctions = () => {
        return {
            onEnterRoute: onEnterRouteFunctions,
            onExitRoute: onExitRouteFunctions,
            onRouteInActiveChain: onRouteInActiveChainFunctions
        }
    }

    router.getBrowserTitleFunctions = () => {
        return browserTitleFunctions
    }

    router.canDeactivate = (name, canDeactivateHandler) => {
        const factory = toFunction(canDeactivateHandler)

        canDeactivateFactories[name] = factory
        canDeactivateFunctions[name] = router.executeFactory(factory)

        return router
    }

    router.clearCanDeactivate = name => {
        canDeactivateFactories[name] = undefined
        canDeactivateFunctions[name] = undefined

        return router
    }

    router.canActivate = (name, canActivateHandler) => {
        const factory = toFunction(canActivateHandler)

        canActivateFactories[name] = factory
        canActivateFunctions[name] = router.executeFactory(factory)

        return router
    }

    // Internal methods to register route lifecycle hooks
    router.registerOnEnterRoute = (name, handler) => {
        onEnterRouteFactories[name] = handler
        onEnterRouteFunctions[name] = handler
        return router
    }

    router.registerOnExitRoute = (name, handler) => {
        onExitRouteFactories[name] = handler
        onExitRouteFunctions[name] = handler
        return router
    }

    router.registerOnRouteInActiveChain = (name, handler) => {
        onRouteInActiveChainFactories[name] = handler
        onRouteInActiveChainFunctions[name] = handler
        return router
    }

    router.registerBrowserTitle = (name, handler) => {
        browserTitleFactories[name] = handler
        browserTitleFunctions[name] = handler
        return router
    }

    return router
}
