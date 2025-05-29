import transitionPath, { nameToIDs } from '@riogz/router-transition-path'
import resolve from './resolve'
import { constants, errorCodes } from '../constants'
import { Router } from '../types/router'
import { State, NavigationOptions, DoneFn } from '../types/base'

/**
 * Recursively resolves a state by checking for redirectToFirstAllowNode flags.
 * If a state has the flag, it finds the first accessible child and attempts to resolve that child.
 * This continues until a state without the flag is found or no accessible child can be found.
 */
async function resolveRedirectChain(router: Router, currentState: State): Promise<State> {
    if (currentState.name !== constants.UNKNOWN_ROUTE && router.config.redirectToFirstAllowNodeMap?.[currentState.name]) {
        try {
            const firstChildName = await router.findFirstAccessibleChild(currentState.name, currentState.params);
            if (firstChildName) {
                const childState = router.makeState(
                    firstChildName,
                    currentState.params,
                    router.buildPath(firstChildName, currentState.params)
                );
                // Recursively resolve the child state
                return resolveRedirectChain(router, childState);
            } else {
                // No accessible children found, handle based on router options
                const options = router.getOptions();
                if (options.allowNotFound) {
                    return router.makeNotFoundState(currentState.path || '/');
                } else {
                    if (options.defaultRoute && currentState.name === options.defaultRoute) {
                        return router.makeNotFoundState(currentState.path || '/');
                    } else if (options.defaultRoute) {
                        const defaultState = router.makeState(
                            options.defaultRoute,
                            {},
                            router.buildPath(options.defaultRoute, {})
                        );
                        // Default route might also have redirect, so resolve it too
                        return resolveRedirectChain(router, defaultState);
                    } else {
                        return router.makeNotFoundState(currentState.path || '/');
                    }
                }
            }
        } catch (err) {
            // If findFirstAccessibleChild or makeState throws, propagate as a transition error
            // or return a notFoundState if appropriate
            console.error('Error during redirect chain resolution:', err);
            // Depending on the error, you might want to throw or return a specific error state
            // For now, let's assume it leads to a notFoundState if not handled otherwise
            return router.makeNotFoundState(currentState.path || '/'); 
        }
    }
    // If no redirect is needed for the current state, return it as is
    return currentState;
}

/**
 * Handles the complete transition process between router states.
 * 
 * This function orchestrates the entire navigation lifecycle including:
 * - Route deactivation guards (canDeactivate)
 * - Route exit hooks (onExitNode)
 * - Route activation guards (canActivate)
 * - Route enter hooks (onEnterNode)
 * - Active chain hooks (onNodeInActiveChain)
 * - Browser title updates
 * - Middleware execution
 * 
 * The transition can be cancelled at any point and includes comprehensive
 * error handling for each phase of the navigation process.
 * 
 * @param router - The router instance managing the transition
 * @param toState - The target state to navigate to
 * @param fromState - The current state being navigated from (null for initial navigation)
 * @param opts - Navigation options controlling transition behavior
 * @param callback - Callback function called when transition completes or fails
 * @returns Function to cancel the ongoing transition
 * 
 * @example
 * ```typescript
 * const cancelTransition = transition(
 *   router,
 *   targetState,
 *   currentState,
 *   { replace: false },
 *   (err, finalState) => {
 *     if (err) {
 *       console.error('Transition failed:', err)
 *     } else {
 *       console.log('Transition successful:', finalState)
 *     }
 *   }
 * )
 * 
 * // Cancel if needed
 * cancelTransition()
 * ```
 */
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
        onEnterNode: onEnterNodeFunctions,
        onExitNode: onExitNodeFunctions,
        onNodeInActiveChain: onNodeInActiveChainFunctions
    } = router.getRouteLifecycleFunctions()
    const browserTitleFunctions = router.getBrowserTitleFunctions()
    
    /** Check if the transition has been cancelled */
    const isCancelled = () => cancelled
    
    /** Cancel the ongoing transition */
    const cancel = () => {
        if (!cancelled && !completed) {
            cancelled = true
            callback({ code: errorCodes.TRANSITION_CANCELLED }, null)
        }
    }
    
    /** Complete the transition with success or error */
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
    
    /** Create error object with additional context */
    const makeError = (base, err) => ({
        ...base,
        ...(err instanceof Object ? err : { error: err })
    })

    const asyncBase = { isCancelled, toState, fromState }

    resolveRedirectChain(router, toState)
        .then(resolvedToState => {
            // Check if cancellation happened during async redirect resolution
            if (isCancelled()) return;
            
            // Continue with the main transition logic using the fully resolved state
            continueTransition(resolvedToState);
        })
        .catch(err => {
            // This catch is for errors specifically from resolveRedirectChain itself (e.g., programming errors within it)
            // Errors related to canActivate within findFirstAccessibleChild should be handled inside resolveRedirectChain
            // or result in a state that continueTransition can handle (like UNKNOWN_ROUTE).
            console.error('Critical error in resolveRedirectChain:', err); 
            callback(makeError({ code: errorCodes.TRANSITION_ERR }, err), null);
        });
    
    // Return cancel function immediately
    // The actual transition logic is now asynchronous due to resolveRedirectChain
    return cancel;
    
    function continueTransition(finalToState: State) {
        // Update toState to use the final resolved state
        toState = finalToState
        
        // Update asyncBase to reference the new toState
        const updatedAsyncBase = { isCancelled, toState, fromState }
        
        // Recalculate transition path with the final state
        const { toDeactivate: finalToDeactivate, toActivate: finalToActivate, intersection: finalIntersection } = transitionPath(toState, fromState)
        
        // Calculate routes that remain on the path (for onNodeInActiveChain)
        const fromStateIds = fromState ? nameToIDs(fromState.name) : []
        const toStateIds = nameToIDs(toState.name)
        const intersectionIndex = finalIntersection ? fromStateIds.indexOf(finalIntersection) : -1
        
        let onPath = []
        if (fromState) {
            // Normal transition - routes that remain on the path
            onPath = intersectionIndex >= 0 ? fromStateIds.slice(0, intersectionIndex + 1) : []
        } else {
            // Initial navigation - all parent routes in toState hierarchy should trigger onNodeInActiveChain
            // (excluding the final route which will trigger onEnterNode)
            onPath = toStateIds.slice(0, -1)
        }

        const isUnknownRoute = toState.name === constants.UNKNOWN_ROUTE

        /** Handle route deactivation guards */
        const canDeactivate =
            !fromState || opts.forceDeactivate
                ? []
                : (toState, fromState, cb) => {
                      const canDeactivateFunctionMap = finalToDeactivate
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
                          { ...updatedAsyncBase, errorKey: 'segment' },
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

        /** Handle route activation guards */
        const canActivate = isUnknownRoute
            ? []
            : (toState, fromState, cb) => {
                  const canActivateFunctionMap = finalToActivate
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
                      { ...updatedAsyncBase, errorKey: 'segment' },
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

        /** Handle route exit lifecycle hooks */
        const onExitNode = !fromState || !finalToDeactivate.length
            ? []
            : (toState, fromState, cb) => {
                  const onExitPromises = finalToDeactivate
                      .filter(name => onExitNodeFunctions[name])
                      .map(name => onExitNodeFunctions[name](toState, fromState))

                  Promise.all(onExitPromises)
                      .then(() => cb(null))
                      .catch(err => cb(makeError({ code: errorCodes.TRANSITION_ERR }, err)))
              }

        /** Handle route enter lifecycle hooks */
        const onEnterNode = isUnknownRoute || !finalToActivate.length
            ? []
            : (toState, fromState, cb) => {
                  const onEnterPromises = finalToActivate
                      .filter(name => onEnterNodeFunctions[name])
                      .map(name => onEnterNodeFunctions[name](toState, fromState))

                  Promise.all(onEnterPromises)
                      .then(() => cb(null))
                      .catch(err => cb(makeError({ code: errorCodes.TRANSITION_ERR }, err)))
              }

        /** Handle active chain lifecycle hooks for routes that remain on the path */
        const onNodeInActiveChain = !onPath.length
            ? []
            : (toState, fromState, cb) => {
                  const onNodeInActiveChainPromises = onPath
                      .filter(name => onNodeInActiveChainFunctions[name])
                      .map(name => onNodeInActiveChainFunctions[name](toState, fromState))

                  Promise.all(onNodeInActiveChainPromises)
                      .then(() => cb(null))
                      .catch(err => cb(makeError({ code: errorCodes.TRANSITION_ERR }, err)))
              }

        /** Update browser title based on the current route */
        const updateBrowserTitle = (toState, fromState, cb) => {
            const toStateIds = nameToIDs(toState.name)
            
            // Find the most specific route that has a browserTitle
            let titleHandler = null
            
            for (let i = toStateIds.length - 1; i >= 0; i--) {
                const routeName = toStateIds[i]
                if (browserTitleFunctions[routeName]) {
                    titleHandler = browserTitleFunctions[routeName]
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

        /** Handle middleware execution */
        const middleware = !middlewareFunctions.length
            ? []
            : (toState, fromState, cb) =>
                  resolve(middlewareFunctions, { ...updatedAsyncBase }, (err, state) =>
                      cb(
                          err
                              ? makeError({ code: errorCodes.TRANSITION_ERR }, err)
                              : null,
                          state || toState
                      )
                  )

        // Build the execution pipeline in the correct order
        const pipeline = []
            .concat(canDeactivate)
            .concat(onExitNode)
            .concat(canActivate)
            .concat(onEnterNode)
            .concat(onNodeInActiveChain)
            .concat(updateBrowserTitle)
            .concat(middleware)

        // Execute the pipeline
        resolve(pipeline, updatedAsyncBase, done)
    }
}
