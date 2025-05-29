/**
 * @fileoverview Main entry point for @riogz/router package
 * 
 * This module exports all public APIs including:
 * - Router creation and cloning functions
 * - Type definitions for TypeScript support
 * - Constants and error codes
 * - Utility functions and classes
 * 
 * @module @riogz/router
 */

import createRouter from './createRouter'
import { RouteNode } from './lib/route-node'
import transitionPath from '@riogz/router-transition-path'
import { constants, errorCodes, ErrorCodes as _ErrorCodes, Constants as _Constants } from './constants'
import cloneRouter from './clone'

// Router type definitions
export type {
    /** Route definition interface */
    Route,
    /** Router configuration options */
    Options,
    /** Route activation function signature */
    ActivationFn,
    /** Factory function for creating activation functions */
    ActivationFnFactory,
    /** Default type for dependency injection */
    DefaultDependencies,
    /** Main router interface */
    Router,
    /** Plugin interface for extending router functionality */
    Plugin,
    /** Factory function for creating plugins */
    PluginFactory,
    /** Middleware function signature */
    Middleware,
    /** Factory function for creating middleware */
    MiddlewareFactory,
    /** State object passed to subscribers */
    SubscribeState,
    /** Subscription callback function */
    SubscribeFn,
    /** Observable listener interface */
    Listener,
    /** Subscription object with unsubscribe method */
    Subscription
} from './types/router'

// Base type definitions
export type { 
    /** Router state interface */
    State, 
    /** State metadata interface */
    StateMeta, 
    /** Navigation options interface */
    NavigationOptions 
} from './types/base'

// Core functions and classes
export {
    /** Main function for creating router instances */
    createRouter,
    /** Function for cloning existing router instances */
    cloneRouter,
    /** Route node class for building route trees */
    RouteNode,
    /** Utility for calculating transition paths */
    transitionPath,
    /** Router event and route constants */
    constants,
    /** Router error codes */
    errorCodes
}

// Constant type definitions
export type { 
    /** Error codes interface */
    ErrorCodes as _ErrorCodes, 
    /** Constants interface */
    Constants as _Constants 
} from './constants'

/**
 * Default export - the main createRouter function
 * 
 * @example
 * ```typescript
 * import createRouter from '@riogz/router'
 * 
 * const router = createRouter([
 *   { name: 'home', path: '/' },
 *   { name: 'user', path: '/users/:id' }
 * ])
 * ```
 */
export default createRouter
