const dotOrEnd = '(\\..+$|$)'
const dotOrStart = '(^.+\\.|^)'

export interface State {
    name: string
    params?: {
        [key: string]: any
    }
    [key: string]: any
}

const getName = (route: State | string): string => {
    return typeof route === 'string' ? route : route.name || ''
}

const test = (route: State | string, regex: RegExp): boolean => {
    return regex.test(getName(route))
}

const normaliseSegment = (name: string): string => {
    return name.replace(/\./g, '\\.')
}

const regexCache = new Map<string, RegExp>()

const getCachedRegExp = (start: string, normalisedSegment: string, end: string): RegExp => {
    const cacheKey = `${start}|${normalisedSegment}|${end}`
    if (regexCache.has(cacheKey)) {
        return regexCache.get(cacheKey)!
    }
    const newRegExp = new RegExp(start + normalisedSegment + end)
    regexCache.set(cacheKey, newRegExp)
    return newRegExp
}

const testRouteWithSegment = (start: string, end: string) => {
    return (...args: any[]) => {
        const route: State | string = args[0]

        const applySegment = (segment: string) => {
            const normalisedSegment = normaliseSegment(segment)
            const regex = getCachedRegExp(start, normalisedSegment, end)
            return test(route, regex)
        }

        if (args.length === 2) {
            const segment: string = args[1]
            return applySegment(segment)
        }

        return applySegment
    }
}

export interface SegmentTestFunction {
    (route: string | State, segment: string): boolean
    (route: string | State): (segment: string) => boolean
}
export const startsWithSegment: SegmentTestFunction = testRouteWithSegment(
    '^',
    dotOrEnd
) as SegmentTestFunction
export const endsWithSegment: SegmentTestFunction = testRouteWithSegment(
    dotOrStart,
    '$'
) as SegmentTestFunction
export const includesSegment: SegmentTestFunction = testRouteWithSegment(
    dotOrStart,
    dotOrEnd
) as SegmentTestFunction
