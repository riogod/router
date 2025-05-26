/**
 * Interface defining error codes used throughout the router
 */
export interface ErrorCodes {
    /** Router has not been started yet */
    ROUTER_NOT_STARTED: string
    /** No start path or state provided when starting router */
    NO_START_PATH_OR_STATE: string
    /** Router is already started */
    ROUTER_ALREADY_STARTED: string
    /** Requested route was not found */
    ROUTE_NOT_FOUND: string
    /** Attempting to navigate to the same state */
    SAME_STATES: string
    /** Route cannot be deactivated */
    CANNOT_DEACTIVATE: string
    /** Route cannot be activated */
    CANNOT_ACTIVATE: string
    /** General transition error */
    TRANSITION_ERR: string
    /** Transition was cancelled */
    TRANSITION_CANCELLED: string
}

/**
 * Interface defining constant values used for router events and special routes
 */
export interface Constants {
    /** Identifier for unknown/not found routes */
    UNKNOWN_ROUTE: string
    /** Event name for router start */
    ROUTER_START: string
    /** Event name for router stop */
    ROUTER_STOP: string
    /** Event name for transition start */
    TRANSITION_START: string
    /** Event name for transition cancel */
    TRANSITION_CANCEL: string
    /** Event name for transition success */
    TRANSITION_SUCCESS: string
    /** Event name for transition error */
    TRANSITION_ERROR: string
}

/**
 * Error codes used throughout the router for consistent error handling
 * 
 * @example
 * ```typescript
 * import { errorCodes } from '@riogz/router'
 * 
 * if (error.code === errorCodes.ROUTE_NOT_FOUND) {
 *   // Handle route not found error
 * }
 * ```
 */
export const errorCodes: ErrorCodes = {
    ROUTER_NOT_STARTED: 'NOT_STARTED',
    NO_START_PATH_OR_STATE: 'NO_START_PATH_OR_STATE',
    ROUTER_ALREADY_STARTED: 'ALREADY_STARTED',
    ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
    SAME_STATES: 'SAME_STATES',
    CANNOT_DEACTIVATE: 'CANNOT_DEACTIVATE',
    CANNOT_ACTIVATE: 'CANNOT_ACTIVATE',
    TRANSITION_ERR: 'TRANSITION_ERR',
    TRANSITION_CANCELLED: 'CANCELLED'
}

/**
 * Constants used for router events and special route identifiers
 * 
 * @example
 * ```typescript
 * import { constants } from '@riogz/router'
 * 
 * router.addEventListener(constants.TRANSITION_SUCCESS, (state) => {
 *   console.log('Navigation successful:', state)
 * })
 * ```
 */
export const constants: Constants = {
    UNKNOWN_ROUTE: '@@router/UNKNOWN_ROUTE',
    ROUTER_START: '$start',
    ROUTER_STOP: '$stop',
    TRANSITION_START: '$$start',
    TRANSITION_CANCEL: '$$cancel',
    TRANSITION_SUCCESS: '$$success',
    TRANSITION_ERROR: '$$error'
}
