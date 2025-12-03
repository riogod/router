import transitionPath, { nameToIDs } from '@riogz/router-transition-path'
import resolve from './resolve'
import { constants, errorCodes } from '../constants'
import { Router } from '../types/router'
import { State, NavigationOptions, DoneFn } from '../types/base'
import { findFirstAccessibleChildAtPath } from '../core/routes'

/**
 * Recursively resolves a state by checking for redirectToFirstAllowNode flags.
 * If a state has the flag, it finds the first accessible child and attempts to resolve that child.
 * This continues until a state without the flag is found or no accessible child can be found.
 */
async function resolveRedirectChain(router: Router, currentState: State | null): Promise<State | null> {
    if (!currentState || currentState.name === constants.UNKNOWN_ROUTE) {
        return currentState;
    }

    const { redirectToFirstAllowNodeMap } = router.config;
    if (!redirectToFirstAllowNodeMap || !redirectToFirstAllowNodeMap[currentState.name]) {
        return currentState;
    }

    // Вызываем импортированную функцию
    const firstAccessibleChildName = await findFirstAccessibleChildAtPath(router, currentState.name, currentState.params);

    if (firstAccessibleChildName) {
        const childStateCandidate = router.buildState(firstAccessibleChildName, currentState.params);
        if (childStateCandidate) {
            let childPath: string;
            try {
                childPath = router.buildPath(childStateCandidate.name, childStateCandidate.params);
            } catch (buildPathError) {
                // If route does not exist (e.g., due to forwardTo pointing to non-existent route),
                // return current state instead of continuing the redirect chain
                return currentState;
            }

            const fullChildStateCandidate = router.makeState(
                childStateCandidate.name,
                childStateCandidate.params,
                childPath,
                currentState.meta // Передаем meta от родителя
            );
            // Рекурсивно проверяем следующую ноду в цепочке
            return resolveRedirectChain(router, fullChildStateCandidate);
        }
    }
    // Если нет доступного дочернего элемента или не удалось построить его состояние,
    // или если дочерний элемент сам не имеет дальнейших перенаправлений,
    // то текущее состояние (currentState) является концом этой конкретной ветки перенаправления.
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
            //
            // Always log the error in production environments so real issues are not masked.
            // In test environments (NODE_ENV === 'test') logging can be noisy, so we suppress it there.
            const isTestEnv =
                typeof process !== 'undefined' &&
                process.env &&
                process.env.NODE_ENV === 'test';

            if (!isTestEnv) {
                console.error('Critical error in resolveRedirectChain:', err);
            }

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
                // Run lifecycle hooks in background (fire-and-forget)
                finalToDeactivate.forEach((name) => {
                    const hook = onExitNodeFunctions[name]
                    if (hook) {
                        // Wrap in Promise.resolve to handle potential rejections
                        Promise.resolve(hook(toState, fromState))
                            .catch(() => {
                                // Silently ignore errors in lifecycle hooks
                                // They should not block navigation
                            })
                    }
                })
                // Call callback immediately - don't wait for hooks to complete
                cb(null)
            }

        /** Handle route enter lifecycle hooks */
        const onEnterNode = isUnknownRoute || !finalToActivate.length
            ? []
            : (toState, fromState, cb) => {
                // Run lifecycle hooks in background (fire-and-forget)
                finalToActivate.forEach((name) => {
                    const hook = onEnterNodeFunctions[name]
                    if (hook) {
                        // Wrap in Promise.resolve to handle potential rejections
                        Promise.resolve(hook(toState, fromState))
                            .catch(() => {
                                // Silently ignore errors in lifecycle hooks
                                // They should not block navigation
                            })
                    }
                })
                // Call callback immediately - don't wait for hooks to complete
                cb(null)
            }

        /** Handle active chain lifecycle hooks for routes that remain on the path */
        const onNodeInActiveChain = !onPath.length
            ? []
            : (toState, fromState, cb) => {
                // Run lifecycle hooks in background (fire-and-forget)
                onPath.forEach((name) => {
                    const hook = onNodeInActiveChainFunctions[name]
                    if (hook) {
                        // Wrap in Promise.resolve to handle potential rejections
                        Promise.resolve(hook(toState, fromState))
                            .catch(() => {
                                // Silently ignore errors in lifecycle hooks
                                // They should not block navigation
                            })
                    }
                })
                // Call callback immediately - don't wait for hooks to complete
                cb(null)
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
                    } else if (typeof titleHandler === 'function') {
                        // Function that returns title - run in background
                        Promise.resolve(titleHandler(toState))
                            .then((title) => {
                                if (typeof document !== 'undefined') {
                                    document.title = title
                                }
                            })
                            .catch(() => {
                                // Ignore errors in browserTitle functions
                            })
                    }
                } catch (err) {
                    // Ignore errors in browserTitle functions
                }
            }

            // Call callback immediately - don't wait for title update to complete
            cb(null)
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
