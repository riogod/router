/**
 * @fileoverview Router Logger Plugin
 * 
 * This package provides a logging plugin for @riogz/router that outputs detailed
 * information about router lifecycle events and state transitions to the browser console.
 * It uses console groups for organized output and gracefully degrades when console
 * features are not available.
 * 
 * @module @riogz/router-plugin-logger
 */

import { PluginFactory } from '@riogz/router'

/** No-operation function used as fallback when console features are unavailable */
const noop = () => {}

/**
 * Logger plugin factory for @riogz/router.
 * 
 * Creates a plugin that logs router lifecycle events and state transitions to the console.
 * The plugin automatically detects available console features and gracefully degrades
 * when advanced features like console.group are not supported.
 * 
 * Features:
 * - Logs router start/stop events
 * - Groups transition logs for better organization
 * - Logs transition states (from/to)
 * - Handles transition errors and cancellations
 * - Graceful degradation for limited console support
 * 
 * @returns A router plugin object with lifecycle event handlers
 * 
 * @example
 * ```typescript
 * import { createRouter } from '@riogz/router';
 * import loggerPlugin from '@riogz/router-plugin-logger';
 * 
 * const router = createRouter(routes);
 * router.usePlugin(loggerPlugin);
 * router.start();
 * 
 * // Console output will show:
 * // "Router started"
 * // ▼ Router transition
 * //   "Transition started from state"
 * //   { name: 'home', params: {} }
 * //   "To state" 
 * //   { name: 'users', params: { id: '42' } }
 * //   "Transition success"
 * ```
 */
const loggerPlugin: PluginFactory = () => {
    /** Function to start a console group (collapsed if available) */
    let startGroup: (label: string) => void
    /** Function to end a console group */
    let endGroup: () => void

    // Feature detection for console grouping capabilities
    if (console.groupCollapsed) {
        // Prefer collapsed groups for cleaner output
        startGroup = label => console.groupCollapsed(label)
        endGroup = () => console.groupEnd()
    } else if (console.group) {
        // Fallback to regular groups
        startGroup = label => console.group(label)
        endGroup = () => console.groupEnd()
    } else {
        // No grouping support - use no-op functions
        startGroup = noop
        endGroup = noop
    }

    console.info('Router started')

    return {
        /**
         * Called when the router is stopped.
         * Logs a simple info message to indicate router shutdown.
         */
        onStop() {
            console.info('Router stopped')
        },

        /**
         * Called when a route transition begins.
         * Creates a new console group and logs the source and destination states.
         * 
         * @param toState - The target state being navigated to
         * @param fromState - The current state being navigated from
         */
        onTransitionStart(toState, fromState) {
            endGroup() // Close any previous group
            startGroup('Router transition')
            console.log('Transition started from state')
            console.log(fromState)
            console.log('To state')
            console.log(toState)
        },

        /**
         * Called when a route transition is cancelled.
         * Logs a warning message to indicate the cancellation.
         */
        onTransitionCancel() {
            console.warn('Transition cancelled')
        },

        /**
         * Called when a route transition encounters an error.
         * Logs the error details and closes the current console group.
         * 
         * @param toState - The target state that failed to be reached
         * @param fromState - The state the transition started from
         * @param err - The error object containing details about the failure
         */
        onTransitionError(toState, fromState, err) {
            console.warn('Transition error with code ' + err.code)
            endGroup()
        },

        /**
         * Called when a route transition completes successfully.
         * Logs a success message and closes the current console group.
         */
        onTransitionSuccess() {
            console.log('Transition success')
            endGroup()
        }
    }
}

export default loggerPlugin
