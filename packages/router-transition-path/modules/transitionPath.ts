/**
 * Represents URL parameters for a specific route segment.
 * Maps parameter names to their string values.
 * 
 * @example
 * ```typescript
 * const params: SegmentParams = {
 *   userId: "42",
 *   tab: "profile"
 * };
 * ```
 */
export interface SegmentParams {
    [key: string]: string
}

/**
 * Represents a router state containing route information and metadata.
 * Used to determine transition paths between different routes.
 * 
 * @example
 * ```typescript
 * const state: State = {
 *   name: 'users.profile.edit',
 *   params: { userId: '42' },
 *   meta: {
 *     options: { reload: false },
 *     params: {
 *       'users.profile': { userId: 'url' }
 *     }
 *   }
 * };
 * ```
 */
export interface State {
    /** Hierarchical route name (e.g., 'users.profile.edit') */
    name: string
    /** Route parameters extracted from URL */
    params?: {
        [key: string]: any
    }
    /** Additional metadata about the route */
    meta?: {
        /** Transition options affecting route behavior */
        options?: {
            [key: string]: boolean
        }
        /** Parameter schemas for each route segment */
        params?: {
            [key: string]: SegmentParams
        }
    }
    /** Additional state properties */
    [key: string]: any
}

/**
 * Represents the result of calculating a transition path between two router states.
 * Contains information about which route segments need to be activated/deactivated.
 * 
 * @example
 * ```typescript
 * const path: TransitionPath = {
 *   intersection: 'users.profile',
 *   toDeactivate: ['users.profile.settings'],
 *   toActivate: ['users.profile.edit']
 * };
 * ```
 */
export interface TransitionPath {
    /** The deepest common route segment between from and to states */
    intersection: string
    /** Route segments that need to be deactivated (in reverse order) */
    toDeactivate: string[]
    /** Route segments that need to be activated */
    toActivate: string[]
}

/**
 * Converts a hierarchical route name into an array of route segment IDs.
 * Each segment represents a level in the route hierarchy.
 * 
 * @param name - The hierarchical route name (e.g., 'users.profile.edit')
 * @returns Array of route segment IDs from root to leaf
 * 
 * @example
 * ```typescript
 * nameToIDs('users.profile.edit')
 * // Returns: ['users', 'users.profile', 'users.profile.edit']
 * 
 * nameToIDs('home')
 * // Returns: ['home']
 * 
 * nameToIDs('')
 * // Returns: ['']
 * ```
 */
export const nameToIDs = (name: string): string[] =>
    name
        .split('.')
        .reduce(
            (ids: string[], part: string) =>
                ids.concat(
                    ids.length ? ids[ids.length - 1] + '.' + part : part
                ),
            []
        )

/**
 * Calculates the transition path between two router states.
 * Determines which route segments need to be deactivated and activated
 * when navigating from one state to another.
 * 
 * The function analyzes the route hierarchy and parameters to find the
 * intersection point where the routes diverge, then calculates which
 * segments need to be updated during the transition.
 * 
 * @param toState - The target state to navigate to
 * @param fromState - The current state to navigate from (null for initial navigation)
 * @returns TransitionPath object containing intersection and activation/deactivation arrays
 * 
 * @example
 * ```typescript
 * // Basic transition between different routes
 * const path = transitionPath(
 *   { name: 'users.profile.edit', params: { userId: '42' } },
 *   { name: 'users.settings', params: { userId: '42' } }
 * );
 * // Returns: {
 * //   intersection: 'users',
 * //   toDeactivate: ['users.settings'],
 * //   toActivate: ['users.profile', 'users.profile.edit']
 * // }
 * 
 * // Initial navigation (from null state)
 * const initialPath = transitionPath(
 *   { name: 'users.profile', params: { userId: '42' } },
 *   null
 * );
 * // Returns: {
 * //   intersection: '',
 * //   toDeactivate: [],
 * //   toActivate: ['users', 'users.profile']
 * // }
 * 
 * // Transition with reload option
 * const reloadPath = transitionPath(
 *   { 
 *     name: 'users.profile', 
 *     params: { userId: '42' },
 *     meta: { options: { reload: true } }
 *   },
 *   { name: 'users.profile', params: { userId: '42' } }
 * );
 * // Returns: {
 * //   intersection: '',
 * //   toDeactivate: ['users.profile', 'users'],
 * //   toActivate: ['users', 'users.profile']
 * // }
 * ```
 */
export default function transitionPath(
    toState: State,
    fromState: State | null
): TransitionPath {
    const toStateOptions = toState.meta?.options || {}
    const fromStateIds = fromState ? nameToIDs(fromState.name) : []
    const toStateIds = nameToIDs(toState.name)
    const maxI = Math.min(fromStateIds.length, toStateIds.length)

    /**
     * Finds the point where two route hierarchies diverge.
     * Compares route segment names and their parameters to determine
     * the deepest common point in the route tree.
     * 
     * @returns Index of the first differing segment
     */
    function pointOfDifference() {
        let i
        for (i = 0; i < maxI; i += 1) {
            const currentSegmentName = fromStateIds[i]

            // If segment names differ, this is the divergence point
            if (currentSegmentName !== toStateIds[i]) return i

            const segmentMetaParamsSchema = fromState?.meta?.params?.[currentSegmentName]
            
            if (segmentMetaParamsSchema) {
                const paramKeys = Object.keys(segmentMetaParamsSchema)
                if (paramKeys.length > 0) {
                    let paramsAreDifferent = false
                    // Check if any parameter values differ between states
                    for (const pKey of paramKeys) {
                        if (toState.params?.[pKey] !== fromState?.params?.[pKey]) {
                            paramsAreDifferent = true
                            break
                        }
                    }
                    if (paramsAreDifferent) return i
                }
            } else {
                // If fromState has no params but toState does, they differ
                if (toState.meta?.params?.[currentSegmentName]) {
                    return i
                }
            }
        }

        return i
    }

    let i
    if (!fromState || toStateOptions.reload) {
        i = 0
    } else {
        const fromStateHasMetaParams = fromState.meta?.params && Object.keys(fromState.meta.params).length > 0

        if (!fromStateHasMetaParams) {
        i = 0
    } else {
        i = pointOfDifference()
        }
    }

    const toDeactivate = fromStateIds.slice(i).reverse()
    const toActivate = toStateIds.slice(i)

    const intersection = fromState && i > 0 ? fromStateIds[i - 1] : ''

    return {
        intersection,
        toDeactivate,
        toActivate
    }
}
