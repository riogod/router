import transitionPath from './transitionPath'
import { State } from './transitionPath'

export default function shouldUpdateNode(nodeName: string) {
    return (toState: State, fromState: State): boolean => {
        const {
            intersection,
            toActivate
        } = transitionPath(toState, fromState)

        if (toState.meta?.options?.reload) { // Safe access
            return true
        }

        if (nodeName === intersection) {
            return true
        }

        // If the node is being activated (and it's not the intersection, and no reload), it should update.
        if (toActivate.indexOf(nodeName) !== -1) {
            return true
        }

        return false
    }
}
