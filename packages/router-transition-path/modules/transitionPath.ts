export interface SegmentParams {
    [key: string]: string
}

export interface State {
    name: string
    params?: {
        [key: string]: any
    }
    meta?: {
        options?: {
            [key: string]: boolean
        }
        params?: {
            [key: string]: SegmentParams
        }
    }
    [key: string]: any
}

export interface TransitionPath {
    intersection: string
    toDeactivate: string[]
    toActivate: string[]
}

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

export default function transitionPath(
    toState: State,
    fromState: State | null
): TransitionPath {
    const toStateOptions = toState.meta?.options || {}
    const fromStateIds = fromState ? nameToIDs(fromState.name) : []
    const toStateIds = nameToIDs(toState.name)
    const maxI = Math.min(fromStateIds.length, toStateIds.length)

    function pointOfDifference() {
        let i
        for (i = 0; i < maxI; i += 1) {
            const currentSegmentName = fromStateIds[i]

            if (currentSegmentName !== toStateIds[i]) return i

            const segmentMetaParamsSchema = fromState?.meta?.params?.[currentSegmentName]
            
            if (segmentMetaParamsSchema) {
                const paramKeys = Object.keys(segmentMetaParamsSchema)
                if (paramKeys.length > 0) {
                    let paramsAreDifferent = false
                    for (const pKey of paramKeys) {
                        if (toState.params?.[pKey] !== fromState?.params?.[pKey]) {
                            paramsAreDifferent = true
                            break
                        }
                    }
                    if (paramsAreDifferent) return i
                }
            } else {
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
