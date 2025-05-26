/**
 * Options that control navigation behavior.
 */
export interface NavigationOptions {
    /** Whether to replace the current history entry instead of adding a new one */
    replace?: boolean
    /** Whether to force a reload of the route even if it's the same */
    reload?: boolean
    /** Whether to skip the transition process */
    skipTransition?: boolean
    /** Whether to force navigation even if guards would normally prevent it */
    force?: boolean
    /** Additional custom options */
    [key: string]: any
}

/**
 * Type for route parameters - key-value pairs of any type.
 */
export type Params = Record<string, any>

/**
 * Function type for unsubscribing from subscriptions.
 */
export type Unsubscribe = () => void

/**
 * Callback function signature for async operations.
 * 
 * @param err - Error if operation failed, undefined if successful
 * @param state - Optional state data
 */
export type DoneFn = (err?: any, state?: State) => void

/**
 * Function type for cancelling ongoing operations.
 */
export type CancelFn = () => void

/**
 * Metadata associated with a router state.
 */
export interface StateMeta {
    /** Unique identifier for this state instance */
    id: number
    /** Parameters used to create this state */
    params: Params
    /** Navigation options used for this state */
    options: NavigationOptions
    /** Whether this state was reached via a redirect */
    redirected: boolean
    /** Source of the navigation (for debugging) */
    source?: string
}

/**
 * Simplified state representation with just name and parameters.
 */
export interface SimpleState {
    /** Route name */
    name: string
    /** Route parameters */
    params: Params
}

/**
 * Complete router state representation.
 */
export interface State {
    /** Route name */
    name: string
    /** Route parameters */
    params: Params
    /** Full URL path */
    path: string
    /** Optional metadata about this state */
    meta?: StateMeta
}
