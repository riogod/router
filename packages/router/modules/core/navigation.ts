import { constants, errorCodes } from '../constants'
import { Router } from '../types/router'
import transition from '../transition'

/** No-operation function used as default callback */
const noop = () => {}

/**
 * Enhances a router with navigation capabilities.
 * 
 * This module provides the core navigation functionality including:
 * - Programmatic navigation to routes
 * - Navigation to default routes
 * - Transition cancellation
 * - State transition management
 * - Error handling for navigation failures
 * 
 * Navigation supports various options like:
 * - Replace vs push navigation
 * - Force reload of same routes
 * - Skip transition process
 * - Custom navigation options
 * 
 * @template Dependencies - Type of dependencies available during navigation
 * @param router - Router instance to enhance with navigation capabilities
 * @returns Enhanced router with navigation functionality
 * 
 * @example
 * ```typescript
 * // Basic navigation
 * router.navigate('user', { id: '123' })
 * 
 * // Navigation with options
 * router.navigate('user', { id: '123' }, { replace: true })
 * 
 * // Navigation with callback
 * router.navigate('user', { id: '123' }, (err, state) => {
 *   if (err) {
 *     console.error('Navigation failed:', err)
 *   } else {
 *     console.log('Navigation successful:', state)
 *   }
 * })
 * ```
 */
export default function withNavigation<Dependencies>(
    router: Router<Dependencies>
): Router<Dependencies> {
    let cancelCurrentTransition

    router.navigate = navigate
    router.navigate = navigate

    /**
     * Navigate to the default route specified in router options.
     * 
     * @param args - Variable arguments: options and/or callback
     * @returns Function to cancel the navigation
     * 
     * @example
     * ```typescript
     * // Navigate to default route
     * router.navigateToDefault()
     * 
     * // With options
     * router.navigateToDefault({ replace: true })
     * 
     * // With callback
     * router.navigateToDefault((err, state) => {
     *   // Handle result
     * })
     * ```
     */
    router.navigateToDefault = (...args) => {
        const opts = typeof args[0] === 'object' ? args[0] : {}
        const done =
            args.length === 2
                ? args[1]
                : typeof args[0] === 'function'
                ? args[0]
                : noop
        const options = router.getOptions()

        if (options.defaultRoute) {
            return navigate(
                options.defaultRoute,
                options.defaultParams,
                opts,
                done
            )
        }

        return () => {}
    }

    /**
     * Cancel the current ongoing navigation transition.
     * 
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * // Start navigation
     * router.navigate('user', { id: '123' })
     * 
     * // Cancel if needed
     * router.cancel()
     * ```
     */
    router.cancel = () => {
        if (cancelCurrentTransition) {
            cancelCurrentTransition('navigate')
            cancelCurrentTransition = null
        }

        return router
    }

    /**
     * Core navigation function that handles route navigation with various overloads.
     * 
     * Supports multiple call signatures:
     * - navigate(name)
     * - navigate(name, params)
     * - navigate(name, params, options)
     * - navigate(name, params, options, callback)
     * - navigate(name, callback)
     * - navigate(name, params, callback)
     * 
     * @param args - Variable arguments for navigation
     * @returns Function to cancel the navigation
     */
    function navigate(...args) {
        const name = args[0]
        const lastArg = args[args.length - 1]
        const done = typeof lastArg === 'function' ? lastArg : noop
        const params = typeof args[1] === 'object' ? args[1] : {}
        const opts = typeof args[2] === 'object' ? args[2] : {}

        if (!router.isStarted()) {
            done({ code: errorCodes.ROUTER_NOT_STARTED })
            return
        }

        const route = router.buildState(name, params)

        if (!route) {
            const err = { code: errorCodes.ROUTE_NOT_FOUND, 
                route: {
                    name,
                    params
                }  
            }
            done(err)
            router.invokeEventListeners(
                constants.TRANSITION_ERROR,
                null,
                router.getState(),
                err
            )
            return
        }

        const toState = router.makeState(
            route.name,
            route.params,
            router.buildPath(route.name, route.params),
            { params: route.meta, options: opts }
        )
        const sameStates = router.getState()
            ? router.areStatesEqual(router.getState(), toState, false)
            : false

        // Do not proceed further if states are the same and no reload
        // (no deactivation and no callbacks)
        if (sameStates && !opts.reload && !opts.force) {
            const err = { code: errorCodes.SAME_STATES }
            done(err)
            router.invokeEventListeners(
                constants.TRANSITION_ERROR,
                toState,
                router.getState(),
                err
            )
            return
        }

        const fromState = router.getState()

        if (opts.skipTransition) {
            done(null, toState)
            return noop
        }

        // Transition
        return router.transitionToState(
            toState,
            fromState,
            opts,
            (err, state) => {
                if (err) {
                    if (err.redirect) {
                        const { name, params } = err.redirect

                        navigate(
                            name,
                            params,
                            { ...opts, force: true, redirected: true },
                            done
                        )
                    } else {
                        done(err)
                    }
                } else {
                    router.invokeEventListeners(
                        constants.TRANSITION_SUCCESS,
                        state,
                        fromState,
                        opts
                    )
                    done(null, state)
                }
            }
        )
    }

    /**
     * Execute a state transition with full lifecycle management.
     * 
     * This method handles the complete transition process including:
     * - Cancelling any ongoing transitions
     * - Firing transition start events
     * - Running the transition pipeline
     * - Handling transition results and errors
     * - Updating router state on success
     * 
     * @param toState - Target state to transition to
     * @param fromState - Current state being transitioned from
     * @param options - Navigation options
     * @param done - Callback function for transition completion
     * @returns Function to cancel the transition
     * 
     * @example
     * ```typescript
     * const cancelFn = router.transitionToState(
     *   targetState,
     *   currentState,
     *   { replace: true },
     *   (err, finalState) => {
     *     if (err) {
     *       console.error('Transition failed:', err)
     *     } else {
     *       console.log('Transition completed:', finalState)
     *     }
     *   }
     * )
     * ```
     */
    router.transitionToState = (
        toState,
        fromState,
        options = {},
        done = noop
    ) => {
        router.cancel()
        router.invokeEventListeners(
            constants.TRANSITION_START,
            toState,
            fromState
        )

        cancelCurrentTransition = transition(
            router,
            toState,
            fromState,
            options,
            (err, state) => {
                cancelCurrentTransition = null
                state = state || toState

                if (err) {
                    if (err.code === errorCodes.TRANSITION_CANCELLED) {
                        router.invokeEventListeners(
                            constants.TRANSITION_CANCEL,
                            toState,
                            fromState
                        )
                    } else {
                        router.invokeEventListeners(
                            constants.TRANSITION_ERROR,
                            toState,
                            fromState,
                            err
                        )
                    }
                    done(err)
                } else {
                    router.setState(state)
                    done(null, state)
                }
            }
        )

        return cancelCurrentTransition
    }

    return router
}
