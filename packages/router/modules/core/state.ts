import { Router } from '../types/router'
import { State, Params as _Params } from '../types/base'
import { constants } from '../constants'

/**
 * Enhances a router with state management capabilities.
 * 
 * This module provides functionality for:
 * - Creating and managing router state objects
 * - State comparison and equality checking
 * - State forwarding and redirection
 * - Not found state handling
 * - State serialization and deserialization
 * - Parameter forwarding between states
 * 
 * Router state represents the current navigation state including:
 * - Route name and parameters
 * - Current path and meta information
 * - Query parameters and hash
 * - Navigation source and options
 * 
 * @template Dependencies - Type of dependencies available in the router
 * @param router - Router instance to enhance with state management
 * @returns Enhanced router with state management functionality
 * 
 * @example
 * ```typescript
 * // Create a state
 * const state = router.makeState('users.detail', { id: '123' })
 * 
 * // Check state equality
 * const isEqual = router.areStatesEqual(state1, state2)
 * 
 * // Check if state is descendant
 * const isDescendant = router.areStatesDescendants(parentState, childState)
 * 
 * // Get current state
 * const currentState = router.getState()
 * ```
 */
export default function withState<Dependencies>(
    router: Router<Dependencies>
): Router<Dependencies> {
    let stateId = 0
    let routerState: State | null = null

    /**
     * Get the current router state.
     * 
     * @returns Current state object or null if no state is set
     * 
     * @example
     * ```typescript
     * const currentState = router.getState()
     * if (currentState) {
     *   console.log('Current route:', currentState.name)
     *   console.log('Route params:', currentState.params)
     *   console.log('Current path:', currentState.path)
     * }
     * ```
     */
    router.getState = () => routerState

    /**
     * Set the current router state.
     * 
     * This is typically called internally during navigation but can be used
     * to manually set the router state.
     * 
     * @param state - New state to set
     * 
     * @example
     * ```typescript
     * // Set state manually
     * router.setState({
     *   name: 'users.detail',
     *   params: { id: '123' },
     *   path: '/users/123'
     * })
     * ```
     */
    router.setState = state => {
        routerState = state
    }

    /**
     * Create a new state object with the given route name and parameters.
     * 
     * This method handles:
     * - Default parameter application
     * - Path generation
     * - Meta information attachment with unique ID
     * 
     * @param name - Route name
     * @param params - Route parameters
     * @param path - Optional custom path (auto-generated if not provided)
     * @param meta - Optional meta information
     * @param forceId - Optional forced ID for the state
     * @returns New state object
     * 
     * @example
     * ```typescript
     * // Basic state creation
     * const state = router.makeState('users.detail', { id: '123' })
     * 
     * // With custom path and meta
     * const state = router.makeState('users.detail', { id: '123' }, '/custom/path', {
     *   source: 'programmatic',
     *   timestamp: Date.now()
     * })
     * ```
     */
    router.makeState = (name, params, path, meta, forceId) => ({
        name,
        params: {
            ...router.config.defaultParams[name],
            ...params
        },
        path,
        meta: meta
            ? {
                  ...meta,
                  id: forceId === undefined ? ++stateId : forceId
              }
            : undefined
    })

    /**
     * Create a "not found" state for unmatched paths.
     * 
     * This is used when a path doesn't match any defined routes
     * and the router is configured to allow not found states.
     * 
     * @param path - The unmatched path
     * @param options - Optional navigation options
     * @returns Not found state object
     * 
     * @example
     * ```typescript
     * // Create not found state
     * const notFoundState = router.makeNotFoundState('/invalid/path')
     * 
     * // With options
     * const notFoundState = router.makeNotFoundState('/invalid/path', {
     *   replace: true
     * })
     * ```
     */
    router.makeNotFoundState = (path, options) =>
        router.makeState(constants.UNKNOWN_ROUTE, { path }, path, {
            options
        })

    /**
     * Check if two states are equal.
     * 
     * States are considered equal if they have the same name and parameters.
     * When ignoreQueryParams is true, only URL parameters are compared.
     * When false, all parameters including query parameters are compared.
     * 
     * @param state1 - First state to compare
     * @param state2 - Second state to compare
     * @param ignoreQueryParams - Whether to ignore query parameters in comparison
     * @returns True if states are equal
     * 
     * @example
     * ```typescript
     * const state1 = router.makeState('users.detail', { id: '123' })
     * const state2 = router.makeState('users.detail', { id: '123' })
     * 
     * // Check equality
     * const isEqual = router.areStatesEqual(state1, state2) // true
     * 
     * // Check equality ignoring query params
     * const isEqual = router.areStatesEqual(state1, state2, true)
     * ```
     */
    router.areStatesEqual = (state1, state2, ignoreQueryParams = true) => {
        if (state1.name !== state2.name) return false

        const getUrlParams = name =>
            router.rootNode
                //@ts-ignore TODO: router.rootNode might not have getSegmentsByName, or it's optional. Investigate type.
                .getSegmentsByName(name)
                .map(segment => segment.parser['urlParams'])
                .reduce((params, p) => params.concat(p), [])

        const state1Params = ignoreQueryParams
            ? getUrlParams(state1.name)
            : Object.keys(state1.params)
        const state2Params = ignoreQueryParams
            ? getUrlParams(state2.name)
            : Object.keys(state2.params)

        return (
            state1Params.length === state2Params.length &&
            Array.from(new Set([...state1Params, ...state2Params])).every(
                p => state1.params[p] === state2.params[p]
            )
        )
    }

    /**
     * Check if one state is a descendant of another.
     * 
     * A state is considered a descendant if its route name starts with
     * the parent route name followed by a dot (hierarchical routing),
     * and all parent state parameters are present in the child state.
     * 
     * @param parentState - Potential parent state
     * @param childState - Potential child state
     * @returns True if childState is a descendant of parentState
     * 
     * @example
     * ```typescript
     * const parentState = router.makeState('users', {})
     * const childState = router.makeState('users.detail', { id: '123' })
     * 
     * // Check descendant relationship
     * const isDescendant = router.areStatesDescendants(parentState, childState) // true
     * 
     * // Non-descendant example
     * const otherState = router.makeState('admin', {})
     * const isDescendant = router.areStatesDescendants(parentState, otherState) // false
     * ```
     */
    router.areStatesDescendants = (parentState, childState) => {
        const regex = new RegExp('^' + parentState.name + '\\.(.*)$')
        if (!regex.test(childState.name)) return false
        // If child state name extends parent state name, and all parent state params
        // are in child state params.
        return Object.keys(parentState.params).every(
            p => parentState.params[p] === childState.params[p]
        )
    }

    /**
     * Apply route forwarding to a state.
     * 
     * If a route has been configured to forward to another route,
     * this method returns the forwarded route name and merged parameters.
     * Parameters are merged from original route defaults, forwarded route defaults,
     * and provided parameters.
     * 
     * @param routeName - Original route name
     * @param routeParams - Original route parameters
     * @returns Object with potentially forwarded name and merged params
     * 
     * @example
     * ```typescript
     * // Set up forwarding
     * router.forward('old-users', 'users')
     * 
     * // Apply forwarding
     * const { name, params } = router.forwardState('old-users', { id: '123' })
     * // Returns: { name: 'users', params: { id: '123' } }
     * ```
     */
    router.forwardState = (routeName, routeParams) => {
        const name = router.config.forwardMap[routeName] || routeName
        const params = {
            ...router.config.defaultParams[routeName],
            ...router.config.defaultParams[name],
            ...routeParams
        }

        return {
            name,
            params
        }
    }

    router.buildState = (routeName, routeParams) => {
        const { name, params } = router.forwardState(routeName, routeParams)

        return router.rootNode.buildState(name, params)
    }

    return router
}
