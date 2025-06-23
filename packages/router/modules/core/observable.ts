import $$observable from '../lib/symbol-observable'
import { Router } from '../types/router'
import { constants } from '../constants'

/**
 * Enhances a router with observable capabilities and event management.
 * 
 * This module provides:
 * - Event listener management (add/remove/invoke)
 * - Observable pattern implementation
 * - Subscription management for route changes
 * - RxJS compatibility through $$observable symbol
 * 
 * The router emits events for:
 * - Router start/stop
 * - Transition start/success/error/cancel
 * - Route changes
 * 
 * Supports both function-based and object-based observers for RxJS compatibility.
 * 
 * @template Dependencies - Type of dependencies available in the router
 * @param router - Router instance to enhance with observable capabilities
 * @returns Enhanced router with event and subscription functionality
 * 
 * @example
 * ```typescript
 * // Subscribe to route changes
 * const unsubscribe = router.subscribe(({ route, previousRoute }) => {
 *   console.log(`Navigated from ${previousRoute?.name} to ${route.name}`)
 * })
 * 
 * // Listen to specific events
 * router.addEventListener('$$success', (toState, fromState) => {
 *   console.log('Navigation successful')
 * })
 * 
 * // RxJS-style subscription
 * const subscription = router.subscribe({
 *   next: ({ route }) => console.log('New route:', route.name)
 * })
 * subscription.unsubscribe()
 * ```
 */
export default function withObservability<Dependencies>(
    router: Router<Dependencies>
): Router<Dependencies> {
    const callbacks = {}

    /**
     * Invoke all event listeners for a specific event.
     * 
     * @param eventName - Name of the event to invoke
     * @param args - Arguments to pass to event listeners
     * 
     * @example
     * ```typescript
     * router.invokeEventListeners('$$success', toState, fromState, options)
     * ```
     */
    router.invokeEventListeners = (eventName, ...args) => {
        ;(callbacks[eventName] || []).forEach(cb => cb(...args))
    }

    /**
     * Remove a specific event listener.
     * 
     * @param eventName - Name of the event
     * @param cb - Callback function to remove
     * 
     * @example
     * ```typescript
     * const handler = (state) => console.log(state)
     * router.addEventListener('$$success', handler)
     * router.removeEventListener('$$success', handler)
     * ```
     */
    router.removeEventListener = (eventName, cb) => {
        if (callbacks[eventName]) {
            callbacks[eventName] = callbacks[eventName].filter(_cb => _cb !== cb)
        }
    }

    /**
     * Add an event listener for a specific event.
     * 
     * @param eventName - Name of the event to listen to
     * @param cb - Callback function to execute when event is fired
     * @returns Function to remove the event listener
     * 
     * @example
     * ```typescript
     * const unsubscribe = router.addEventListener('$$success', (toState, fromState) => {
     *   console.log('Navigation successful:', toState.name)
     * })
     * 
     * // Later remove the listener
     * unsubscribe()
     * ```
     */
    router.addEventListener = (eventName, cb) => {
        callbacks[eventName] = (callbacks[eventName] || []).concat(cb)

        return () => router.removeEventListener(eventName, cb)
    }

    /**
     * Subscribe to route changes with support for both function and object observers.
     * 
     * @param listener - Function or object with 'next' method to handle route changes
     * @returns Unsubscribe function or subscription object with unsubscribe method
     */
    function subscribe(listener) {
        const isObject = typeof listener === 'object'
        const finalListener = isObject ? listener.next.bind(listener) : listener
        const unsubscribeHandler = router.addEventListener(
            constants.TRANSITION_SUCCESS,
            (toState, fromState) => {
                finalListener({
                    route: toState,
                    previousRoute: fromState
                })
            }
        )

        return isObject
            ? { unsubscribe: unsubscribeHandler }
            : unsubscribeHandler
    }

    /**
     * Create an observable object compatible with RxJS and other reactive libraries.
     * 
     * @returns Observable object with subscribe method and $$observable symbol
     */
    function observable() {
        return {
            /**
             * Subscribe to the observable with an observer object.
             * 
             * @param observer - Observer object with next method
             * @returns Subscription object with unsubscribe method
             * @throws TypeError if observer is not an object
             */
            subscribe(observer) {
                if (typeof observer !== 'object' || observer === null) {
                    throw new TypeError(
                        'Expected the observer to be an object.'
                    )
                }
                return subscribe(observer)
            },

            /** Symbol for RxJS compatibility */
            [$$observable]() {
                return this
            }
        }
    }

    router.subscribe = subscribe
    //@ts-ignore Adding $$observable for Observable compatibility
    router[$$observable] = observable
    //@ts-ignore Adding @@observable for legacy Observable compatibility (e.g. RxJS 4)
    router['@@observable'] = observable

    return router
}
