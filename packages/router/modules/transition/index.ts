import transitionPath, { nameToIDs } from '@riogz/router-transition-path'
import resolve from './resolve'
import { constants, errorCodes } from '../constants'
import { Router } from '../types/router'
import { State, NavigationOptions, DoneFn } from '../types/base'

export default function transition(
    router: Router,
    toState: State,
    fromState: State | null,
    opts: NavigationOptions,
    callback: DoneFn
) {
    let cancelled = false
    let completed = false
    const options = router.getOptions()
    const [
        canDeactivateFunctions,
        canActivateFunctions
    ] = router.getLifecycleFunctions()
    const middlewareFunctions = router.getMiddlewareFunctions()
    const {
        onEnterRoute: onEnterRouteFunctions,
        onExitRoute: onExitRouteFunctions,
        onRouteInActiveChain: onRouteInActiveChainFunctions
    } = router.getRouteLifecycleFunctions()
    const browserTitleFunctions = router.getBrowserTitleFunctions()
    const isCancelled = () => cancelled
    const cancel = () => {
        if (!cancelled && !completed) {
            cancelled = true
            callback({ code: errorCodes.TRANSITION_CANCELLED }, null)
        }
    }
    const done = (err, state) => {
        completed = true

        if (isCancelled()) {
            return
        }

        if (!err && options.autoCleanUp) {
            const activeSegments = nameToIDs(toState.name)
            Object.keys(canDeactivateFunctions).forEach(name => {
                if (activeSegments.indexOf(name) === -1)
                    router.clearCanDeactivate(name)
            })
        }

        callback(err, state || toState)
    }
    const makeError = (base, err) => ({
        ...base,
        ...(err instanceof Object ? err : { error: err })
    })

    const isUnknownRoute = toState.name === constants.UNKNOWN_ROUTE
    const asyncBase = { isCancelled, toState, fromState }
    const { toDeactivate, toActivate, intersection } = transitionPath(toState, fromState)
    
    // Calculate routes that remain on the path (for onRouteInActiveChain)
    const fromStateIds = fromState ? nameToIDs(fromState.name) : []
    const toStateIds = nameToIDs(toState.name)
    const intersectionIndex = intersection ? fromStateIds.indexOf(intersection) : -1
    
    let onPath = []
    if (fromState) {
        // Normal transition - routes that remain on the path
        onPath = intersectionIndex >= 0 ? fromStateIds.slice(0, intersectionIndex + 1) : []
    } else {
        // Initial navigation - all parent routes in toState hierarchy should trigger onRouteInActiveChain
        // (excluding the final route which will trigger onEnterRoute)
        onPath = toStateIds.slice(0, -1)
    }

    const canDeactivate =
        !fromState || opts.forceDeactivate
            ? []
            : (toState, fromState, cb) => {
                  const canDeactivateFunctionMap = toDeactivate
                      .filter(name => canDeactivateFunctions[name])
                      .reduce(
                          (fnMap, name) => ({
                              ...fnMap,
                              [name]: canDeactivateFunctions[name]
                          }),
                          {}
                      )

                  resolve(
                      canDeactivateFunctionMap,
                      { ...asyncBase, errorKey: 'segment' },
                      err =>
                          cb(
                              err
                                  ? makeError(
                                        { code: errorCodes.CANNOT_DEACTIVATE },
                                        err
                                    )
                                  : null
                          )
                  )
              }

    const canActivate = isUnknownRoute
        ? []
        : (toState, fromState, cb) => {
              const canActivateFunctionMap = toActivate
                  .filter(name => canActivateFunctions[name])
                  .reduce(
                      (fnMap, name) => ({
                          ...fnMap,
                          [name]: canActivateFunctions[name]
                      }),
                      {}
                  )

              resolve(
                  canActivateFunctionMap,
                  { ...asyncBase, errorKey: 'segment' },
                  err =>
                      cb(
                          err
                              ? makeError(
                                    { code: errorCodes.CANNOT_ACTIVATE },
                                    err
                                )
                              : null
                      )
              )
          }

    // onExitRoute hooks - called for routes being deactivated
    const onExitRoute = !fromState || !toDeactivate.length
        ? []
        : (toState, fromState, cb) => {
              const onExitPromises = toDeactivate
                  .filter(name => onExitRouteFunctions[name])
                  .map(name => onExitRouteFunctions[name](toState, fromState))

              Promise.all(onExitPromises)
                  .then(() => cb(null))
                  .catch(err => cb(makeError({ code: errorCodes.TRANSITION_ERR }, err)))
          }

    // onEnterRoute hooks - called for routes being activated
    const onEnterRoute = isUnknownRoute || !toActivate.length
        ? []
        : (toState, fromState, cb) => {
              const onEnterPromises = toActivate
                  .filter(name => onEnterRouteFunctions[name])
                  .map(name => onEnterRouteFunctions[name](toState, fromState))

              Promise.all(onEnterPromises)
                  .then(() => cb(null))
                  .catch(err => cb(makeError({ code: errorCodes.TRANSITION_ERR }, err)))
          }

    // onRouteInActiveChain hooks - called for routes that remain on the path
    const onRouteInActiveChain = !onPath.length
        ? []
        : (toState, fromState, cb) => {
              const onRouteInActiveChainPromises = onPath
                  .filter(name => onRouteInActiveChainFunctions[name])
                  .map(name => onRouteInActiveChainFunctions[name](toState, fromState))

              Promise.all(onRouteInActiveChainPromises)
                  .then(() => cb(null))
                  .catch(err => cb(makeError({ code: errorCodes.TRANSITION_ERR }, err)))
          }

    // Update browser title based on current route
    const updateBrowserTitle = (toState, fromState, cb) => {
        const toStateIds = nameToIDs(toState.name)
        
        // Find the most specific route that has a browserTitle
        let titleHandler = null
        let titleRoute = null
        
        for (let i = toStateIds.length - 1; i >= 0; i--) {
            const routeName = toStateIds[i]
            if (browserTitleFunctions[routeName]) {
                titleHandler = browserTitleFunctions[routeName]
                titleRoute = routeName
                break
            }
        }
        
        if (titleHandler) {
            try {
                if (typeof titleHandler === 'string') {
                    // Simple string title
                    if (typeof document !== 'undefined') {
                        document.title = titleHandler
                    }
                    cb(null)
                } else if (typeof titleHandler === 'function') {
                    // Function that returns title
                    Promise.resolve(titleHandler(toState))
                        .then(title => {
                            if (typeof document !== 'undefined') {
                                document.title = title
                            }
                            cb(null)
                        })
                        .catch(err => cb(makeError({ code: errorCodes.TRANSITION_ERR }, err)))
                } else {
                    cb(null)
                }
            } catch (err) {
                cb(makeError({ code: errorCodes.TRANSITION_ERR }, err))
            }
        } else {
            cb(null)
        }
    }

    const middleware = !middlewareFunctions.length
        ? []
        : (toState, fromState, cb) =>
              resolve(middlewareFunctions, { ...asyncBase }, (err, state) =>
                  cb(
                      err
                          ? makeError({ code: errorCodes.TRANSITION_ERR }, err)
                          : null,
                      state || toState
                  )
              )

    const pipeline = []
        .concat(canDeactivate)
        .concat(onExitRoute)
        .concat(canActivate)
        .concat(onEnterRoute)
        .concat(onRouteInActiveChain)
        .concat(updateBrowserTitle)
        .concat(middleware)

    resolve(pipeline, asyncBase, done)

    return cancel
}
