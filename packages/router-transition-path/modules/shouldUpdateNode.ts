import transitionPath from './transitionPath'
import { State } from './transitionPath'

/**
 * Creates a function that determines whether a specific route node should update
 * during a router state transition.
 * 
 * This is useful for optimizing component re-renders by only updating components
 * that are actually affected by the route change.
 * 
 * @param nodeName - The name of the route node to check for updates
 * @returns A function that takes two states and returns whether the node should update
 * 
 * @example
 * ```typescript
 * // Create update checker for a specific route node
 * const shouldUpdateProfile = shouldUpdateNode('users.profile');
 * 
 * // Check if profile node should update during transition
 * const shouldUpdate = shouldUpdateProfile(
 *   { name: 'users.profile.edit', params: { userId: '42' } },
 *   { name: 'users.profile.view', params: { userId: '42' } }
 * );
 * // Returns: true (profile node is the intersection point)
 * 
 * // Check if unrelated node should update
 * const shouldUpdateSettings = shouldUpdateNode('settings');
 * const settingsUpdate = shouldUpdateSettings(
 *   { name: 'users.profile.edit', params: { userId: '42' } },
 *   { name: 'users.profile.view', params: { userId: '42' } }
 * );
 * // Returns: false (settings node is not involved in this transition)
 * ```
 */
export default function shouldUpdateNode(nodeName: string) {
    /**
     * Determines if the node should update based on the transition between two states.
     * 
     * A node should update if:
     * - The reload option is set to true
     * - The node is the intersection point of the transition
     * - The node is being activated (appears in toActivate array)
     * 
     * @param toState - The target state being navigated to
     * @param fromState - The current state being navigated from
     * @returns True if the node should update, false otherwise
     */
    return (toState: State, fromState: State): boolean => {
        const {
            intersection,
            toActivate
        } = transitionPath(toState, fromState)

        // Force update if reload option is enabled
        if (toState.meta?.options?.reload) {
            return true
        }

        // Update if this node is the intersection point
        if (nodeName === intersection) {
            return true
        }

        // Update if the node is being activated during this transition
        if (toActivate.indexOf(nodeName) !== -1) {
            return true
        }

        return false
    }
}
