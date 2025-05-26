import { constants, errorCodes } from '../constants'
import { Router } from '../types/router'

/** No-operation function used as default callback */
const noop = function() {}

/**
 * Enhances a router with lifecycle management capabilities.
 * 
 * This module provides functionality for:
 * - Starting the router with initial state
 * - Stopping the router and cleaning up
 * - Managing router started state
 * - Handling initial navigation and default routes
 * - Error handling for startup scenarios
 * 
 * The router lifecycle includes:
 * 1. Start: Initialize router with a path, state, or default route
 * 2. Running: Router is active and handling navigation
 * 3. Stop: Router is stopped and state is cleared
 * 
 * @template Dependencies - Type of dependencies available in the router
 * @param router - Router instance to enhance with lifecycle capabilities
 * @returns Enhanced router with start/stop functionality
 * 
 * @example
 * ```typescript
 * // Start with current browser path
 * router.start('/users/123', (err, state) => {
 *   if (err) {
 *     console.error('Failed to start router:', err)
 *   } else {
 *     console.log('Router started with state:', state)
 *   }
 * })
 * 
 * // Start with state object
 * router.start({
 *   name: 'user',
 *   params: { id: '123' },
 *   path: '/users/123'
 * })
 * 
 * // Stop the router
 * router.stop()
 * ```
 */
export default function withRouterLifecycle<Dependencies>(
    router: Router<Dependencies>
): Router<Dependencies> {
    let started = false

    /**
     * Check if the router is currently started and active.
     * 
     * @returns True if router is started, false otherwise
     * 
     * @example
     * ```typescript
     * if (router.isStarted()) {
     *   router.navigate('home')
     * } else {
     *   console.log('Router not started yet')
     * }
     * ```
     */
    router.isStarted = () => started

    /**
     * Start the router with optional initial path or state.
     * 
     * The router can be started in several ways:
     * - With a path string: router.start('/users/123')
     * - With a state object: router.start({ name: 'user', params: { id: '123' } })
     * - Without arguments: uses default route if configured
     * - With callback: router.start('/path', callback)
     * 
     * @param args - Variable arguments for router startup
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * // Start with path
     * router.start('/users/123')
     * 
     * // Start with callback
     * router.start((err, state) => {
     *   if (!err) console.log('Started with state:', state)
     * })
     * 
     * // Start with path and callback
     * router.start('/users/123', (err, state) => {
     *   // Handle startup result
     * })
     * ```
     */
    //@ts-ignore TODO: Review arguments and return type of router.start for better type safety
    router.start = (...args) => {
        const options = router.getOptions()
        const lastArg = args[args.length - 1]
        const done = typeof lastArg === 'function' ? lastArg : noop
        const startPathOrState =
            typeof args[0] !== 'function' ? args[0] : undefined

        if (started) {
            done({ code: errorCodes.ROUTER_ALREADY_STARTED })
            return router
        }

        let startPath, startState

        started = true
        router.invokeEventListeners(constants.ROUTER_START)

        /** Callback function for handling startup completion */
        const cb = (err, state?, invokeErrCb = true) => {
            if (!err)
                router.invokeEventListeners(
                    constants.TRANSITION_SUCCESS,
                    state,
                    null,
                    { replace: true }
                )
            if (err && invokeErrCb)
                router.invokeEventListeners(
                    constants.TRANSITION_ERROR,
                    state,
                    null,
                    err
                )
            done(err, state)
        }

        if (startPathOrState === undefined && !options.defaultRoute) {
            return cb({ code: errorCodes.NO_START_PATH_OR_STATE })
        }
        if (typeof startPathOrState === 'string') {
            startPath = startPathOrState
        } else if (typeof startPathOrState === 'object') {
            startState = startPathOrState
        }

        if (!startState) {
            // If no supplied start state, get start state
            startState =
                startPath === undefined ? null : router.matchPath(startPath)

            /** Navigate to default route */
            const navigateToDefault = () =>
                router.navigateToDefault({ replace: true }, done)
            
            /** Redirect to a specific route */
            const redirect = route =>
                router.navigate(
                    route.name,
                    route.params,
                    { replace: true, reload: true, redirected: true },
                    done
                )

            /** Transition to a specific state */
            const transitionToState = state => {
                router.transitionToState(
                    state,
                    router.getState(),
                    {},
                    (err, state) => {
                        if (!err) cb(null, state)
                        else if (err.redirect) redirect(err.redirect)
                        else if (options.defaultRoute) navigateToDefault()
                        else cb(err, null, false)
                    }
                )
            }
            
            // If matched start path
            if (startState) {
                transitionToState(startState)
            } else if (options.defaultRoute) {
                // If default, navigate to default
                navigateToDefault()
            } else if (options.allowNotFound) {
                transitionToState(
                    router.makeNotFoundState(startPath, { replace: true })
                )
            } else {
                // No start match, no default => do nothing
                cb({ code: errorCodes.ROUTE_NOT_FOUND, path: startPath }, null)
            }
        } else {
            // Initialise router with provided start state
            router.setState(startState)
            cb(null, startState)
        }

        return router
    }

    /**
     * Stop the router and clear its state.
     * 
     * This will:
     * - Set the router state to null
     * - Mark the router as not started
     * - Fire the router stop event
     * 
     * @returns Router instance for chaining
     * 
     * @example
     * ```typescript
     * // Stop the router
     * router.stop()
     * 
     * // Check if stopped
     * console.log('Router started:', router.isStarted()) // false
     * ```
     */
    router.stop = () => {
        if (started) {
            router.setState(null)
            started = false
            router.invokeEventListeners(constants.ROUTER_STOP)
        }

        return router
    }

    return router
}
