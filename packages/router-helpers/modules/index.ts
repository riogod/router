/**
 * @fileoverview Router Helpers
 * 
 * This package provides utility functions for comparing and checking route segments
 * in hierarchical router systems. It offers efficient pattern matching for route names
 * with support for both string and object route representations.
 * 
 * @module @riogz/router-helpers
 */

/** Regular expression pattern for matching dot followed by any characters or end of string */
const dotOrEnd = '(\\..+$|$)'
/** Regular expression pattern for matching start or any characters followed by dot */
const dotOrStart = '(^.+\\.|^)'

/**
 * Represents a router state object containing route information.
 * Can be used interchangeably with string route names in helper functions.
 * 
 * @example
 * ```typescript
 * const state: State = {
 *   name: 'users.profile.edit',
 *   params: { userId: '42' },
 *   meta: { title: 'Edit Profile' }
 * };
 * ```
 */
export interface State {
    /** The hierarchical route name (e.g., 'users.profile.edit') */
    name: string
    /** Optional route parameters */
    params?: {
        [key: string]: any
    }
    /** Additional state properties */
    [key: string]: any
}

/**
 * Extracts the route name from either a string or State object.
 * 
 * @param route - The route as string or State object
 * @returns The route name as string, or empty string if not available
 */
const getName = (route: State | string): string => {
    return typeof route === 'string' ? route : route.name || ''
}

/**
 * Tests if a route matches a given regular expression pattern.
 * 
 * @param route - The route to test (string or State object)
 * @param regex - The regular expression to test against
 * @returns True if the route matches the pattern
 */
const test = (route: State | string, regex: RegExp): boolean => {
    return regex.test(getName(route))
}

/**
 * Normalizes a route segment by escaping special regex characters.
 * This ensures that special characters in route names are treated as literal characters
 * rather than regex metacharacters.
 * 
 * @param name - The route segment name to normalize
 * @returns The normalized segment with escaped special characters
 */
const normaliseSegment = (name: string): string => {
    // Escape all regex special characters: \ ^ $ . | ? * + ( ) [ ] { }
    return name.replace(/[\\^$.|?*+()[\]{}]/g, '\\$&')
}

/** Cache for compiled regular expressions to improve performance */
const regexCache = new Map<string, RegExp>()

/**
 * Gets a cached regular expression or creates and caches a new one.
 * This optimization prevents recompiling the same regex patterns repeatedly.
 * 
 * @param start - The start pattern for the regex
 * @param normalisedSegment - The normalized segment pattern
 * @param end - The end pattern for the regex
 * @returns The cached or newly created RegExp object
 */
const getCachedRegExp = (start: string, normalisedSegment: string, end: string): RegExp => {
    const cacheKey = `${start}|${normalisedSegment}|${end}`
    if (regexCache.has(cacheKey)) {
        return regexCache.get(cacheKey)!
    }
    const newRegExp = new RegExp(start + normalisedSegment + end)
    regexCache.set(cacheKey, newRegExp)
    return newRegExp
}

/**
 * Creates a higher-order function for testing routes against segments with specific patterns.
 * This factory function generates specialized route testing functions based on start and end patterns.
 * 
 * @param start - The regex pattern for the start of the match
 * @param end - The regex pattern for the end of the match
 * @returns A function that can test routes against segments, supporting both direct and curried usage
 */
const testRouteWithSegment = (start: string, end: string) => {
    return (...args: any[]) => {
        const route: State | string = args[0]

        /**
         * Tests if the route matches the given segment with the configured start/end patterns.
         * 
         * @param segment - The route segment to test against
         * @returns True if the route matches the segment pattern
         */
        const applySegment = (segment: string) => {
            const normalisedSegment = normaliseSegment(segment)
            const regex = getCachedRegExp(start, normalisedSegment, end)
            return test(route, regex)
        }

        // Direct usage: testFunction(route, segment)
        if (args.length === 2) {
            const segment: string = args[1]
            return applySegment(segment)
        }

        // Curried usage: testFunction(route)(segment)
        return applySegment
    }
}

/**
 * Function interface for segment testing utilities.
 * Supports both direct usage and curried form for functional programming patterns.
 * 
 * @example
 * ```typescript
 * // Direct usage
 * const result = startsWithSegment('users.profile.edit', 'users');
 * 
 * // Curried usage
 * const startsWithUsers = startsWithSegment('users.profile.edit');
 * const result = startsWithUsers('users');
 * ```
 */
export interface SegmentTestFunction {
    /** Direct usage: test if route matches segment */
    (route: string | State, segment: string): boolean
    /** Curried usage: returns a function that tests segments against the route */
    (route: string | State): (segment: string) => boolean
}

/**
 * Tests if a route starts with a specific segment.
 * Useful for checking if a route is within a particular section of your application.
 * 
 * @param route - The route to test (string or State object)
 * @param segment - The segment to check for at the start
 * @returns True if the route starts with the segment
 * 
 * @example
 * ```typescript
 * // Direct usage
 * startsWithSegment('users.profile.edit', 'users')        // true
 * startsWithSegment('users.profile.edit', 'users.profile') // true
 * startsWithSegment('admin.dashboard', 'users')           // false
 * 
 * // With State object
 * startsWithSegment({ name: 'users.profile.edit' }, 'users') // true
 * 
 * // Curried usage
 * const checkUserRoutes = startsWithSegment('users.profile.edit');
 * checkUserRoutes('users')         // true
 * checkUserRoutes('admin')         // false
 * ```
 */
export const startsWithSegment: SegmentTestFunction = testRouteWithSegment(
    '^',
    dotOrEnd
) as SegmentTestFunction

/**
 * Tests if a route ends with a specific segment.
 * Useful for checking the final destination or action of a route.
 * 
 * @param route - The route to test (string or State object)
 * @param segment - The segment to check for at the end
 * @returns True if the route ends with the segment
 * 
 * @example
 * ```typescript
 * // Direct usage
 * endsWithSegment('users.profile.edit', 'edit')           // true
 * endsWithSegment('users.profile.edit', 'profile.edit')   // true
 * endsWithSegment('users.profile.view', 'edit')           // false
 * 
 * // With State object
 * endsWithSegment({ name: 'users.profile.edit' }, 'edit') // true
 * 
 * // Curried usage
 * const checkEditRoutes = endsWithSegment('users.profile.edit');
 * checkEditRoutes('edit')          // true
 * checkEditRoutes('view')          // false
 * ```
 */
export const endsWithSegment: SegmentTestFunction = testRouteWithSegment(
    dotOrStart,
    '$'
) as SegmentTestFunction

/**
 * Tests if a route includes a specific segment anywhere in its hierarchy.
 * Useful for checking if a route is related to a particular feature or section.
 * 
 * @param route - The route to test (string or State object)
 * @param segment - The segment to check for anywhere in the route
 * @returns True if the route includes the segment
 * 
 * @example
 * ```typescript
 * // Direct usage
 * includesSegment('users.profile.edit', 'profile')        // true
 * includesSegment('users.profile.edit', 'users')          // true
 * includesSegment('users.profile.edit', 'edit')           // true
 * includesSegment('users.profile.edit', 'admin')          // false
 * 
 * // With State object
 * includesSegment({ name: 'users.profile.edit' }, 'profile') // true
 * 
 * // Curried usage
 * const checkProfileRoutes = includesSegment('users.profile.edit');
 * checkProfileRoutes('profile')    // true
 * checkProfileRoutes('settings')   // false
 * ```
 */
export const includesSegment: SegmentTestFunction = testRouteWithSegment(
    dotOrStart,
    dotOrEnd
) as SegmentTestFunction
