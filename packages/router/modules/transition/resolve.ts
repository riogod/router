/**
 * Resolves a sequence of functions (guards, middleware, lifecycle hooks) during route transitions.
 * 
 * This function handles the execution of async functions in sequence, managing:
 * - Function execution order
 * - State changes during execution
 * - Error handling and propagation
 * - Cancellation support
 * - Promise resolution
 * - Boolean return value handling
 * 
 * Functions can return:
 * - Boolean: true to continue, false to stop with error
 * - Promise: resolved value determines continuation
 * - State object: updates the current state
 * - void: waits for done callback to be called
 * 
 * @param functions - Array of functions or object with named functions to execute
 * @param context - Execution context containing cancellation check and state information
 * @param context.isCancelled - Function to check if operation was cancelled
 * @param context.toState - Target state being navigated to
 * @param context.fromState - Current state being navigated from
 * @param context.errorKey - Optional key to include in error objects for debugging
 * @param callback - Callback function called when all functions complete or an error occurs
 * 
 * @example
 * ```typescript
 * // Resolve array of middleware functions
 * resolve(
 *   [middleware1, middleware2, middleware3],
 *   { isCancelled, toState, fromState },
 *   (err, finalState) => {
 *     if (err) {
 *       console.error('Middleware failed:', err)
 *     } else {
 *       console.log('All middleware executed:', finalState)
 *     }
 *   }
 * )
 * 
 * // Resolve object of named guard functions
 * resolve(
 *   { 'route1': guard1, 'route2': guard2 },
 *   { isCancelled, toState, fromState, errorKey: 'segment' },
 *   (err, finalState) => {
 *     // Handle completion
 *   }
 * )
 * ```
 */
export default function resolve(
    functions,
    { isCancelled, toState, fromState, errorKey = undefined },
    callback
) {
    let remainingFunctions = Array.isArray(functions)
        ? functions
        : Object.keys(functions)

    /** Check if an object is a valid router state */
    const isState = obj =>
        typeof obj === 'object' &&
        obj.name !== undefined &&
        obj.params !== undefined &&
        obj.path !== undefined
    
    /** Check if state values have changed (which shouldn't happen during transition) */
    const hasStateChanged = (toState, fromState) =>
        fromState.name !== toState.name ||
        fromState.params !== toState.params ||
        fromState.path !== toState.path

    /** Merge two states, preserving metadata */
    const mergeStates = (toState, fromState) => ({
        ...fromState,
        ...toState,
        meta: {
            ...fromState.meta,
            ...toState.meta
        }
    })

    /** Process a single function in the sequence */
    const processFn = (stepFn, errBase, state, _done) => {
        /** Enhanced done callback that handles state merging and validation */
        const done = (err, newState?) => {
            if (err) {
                _done(err)
            } else if (newState && newState !== state && isState(newState)) {
                if (hasStateChanged(newState, state)) {
                    console.error(
                        '[router][transition] Warning: state values (name, params, path) were changed during transition process.'
                    )
                }

                _done(null, mergeStates(newState, state))
            } else {
                _done(null, state)
            }
        }
        
        // Execute the function and handle different return types
        const res = stepFn.call(null, state, fromState, done)
        
        if (isCancelled()) {
            done(null)
        } else if (typeof res === 'boolean') {
            // Boolean return: true = continue, false = error
            done(res ? null : errBase)
        } else if (isState(res)) {
            // State object return: update current state
            done(null, res)
        } else if (res && typeof res.then === 'function') {
            // Promise return: wait for resolution
            res.then(
                resVal => {
                    if (resVal instanceof Error) done({ error: resVal }, null)
                    else done(null, resVal)
                },
                err => {
                    if (err instanceof Error) {
                        console.error(err.stack || err)
                        done({ ...errBase, promiseError: err }, null)
                    } else {
                        done(
                            typeof err === 'object'
                                ? { ...errBase, ...err }
                                : errBase,
                            null
                        )
                    }
                }
            )
        }
        // else: function will call done() callback asynchronously
    }

    /** Process the next function in the sequence */
    const next = (err, state) => {
        if (isCancelled()) {
            callback()
        } else if (err) {
            callback(err)
        } else {
            if (!remainingFunctions.length) {
                // All functions completed successfully
                callback(null, state)
            } else {
                // Process next function
                const isMapped = typeof remainingFunctions[0] === 'string'
                const errBase =
                    errorKey && isMapped
                        ? { [errorKey]: remainingFunctions[0] }
                        : {}
                const stepFn = isMapped
                    ? functions[remainingFunctions[0]]
                    : remainingFunctions[0]

                remainingFunctions = remainingFunctions.slice(1)

                processFn(stepFn, errBase, state, next)
            }
        }
    }

    // Start processing the first function
    next(null, toState)
}
