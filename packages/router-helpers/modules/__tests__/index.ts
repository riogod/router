import * as helpers from '../'

describe('router-helpers', function() {
    describe('.startsWithSegment()', function() {
        it('should return true if a route starts with a segment', function() {
            expect(helpers.startsWithSegment('a.b.c', 'a')).toBe(true)
            expect(helpers.startsWithSegment('a.b.c', 'a.b')).toBe(true)
            expect(helpers.startsWithSegment({ name: 'a.b.c' }, 'a')).toBe(true)
        })

        it('should return false if a route does not start with a segment', function() {
            expect(helpers.startsWithSegment('a.b.c', 'aa')).toBe(false)
            expect(helpers.startsWithSegment('a.b.c', 'a.a')).toBe(false)
            expect(helpers.startsWithSegment({ name: 'a.b.c' }, 'aa')).toBe(
                false
            )
        })

        it('should work with curried form', function() {
            expect(helpers.startsWithSegment('a.b.c')('a')).toBe(true)
            expect(helpers.startsWithSegment({ name: 'a.b.c' })('a.b')).toBe(true)
            expect(helpers.startsWithSegment('a.b.c')('d')).toBe(false)
        })

        it('should handle object route without name property correctly', function() {
            expect(helpers.startsWithSegment({ params: {} } as any, 'a')).toBe(false)
            expect(helpers.startsWithSegment({ name: null } as any)('a')).toBe(false)
            expect(helpers.startsWithSegment({ name: undefined } as any, 'a')).toBe(false)
        })

        it('should properly escape special regex characters in segments', function() {
            // Test with backslashes
            expect(helpers.startsWithSegment('a\\b.c', 'a\\b')).toBe(true)
            expect(helpers.startsWithSegment('a\\b.c', 'a.b')).toBe(false)
            
            // Test with other special regex characters
            expect(helpers.startsWithSegment('a$.b', 'a$')).toBe(true)
            expect(helpers.startsWithSegment('a^.b', 'a^')).toBe(true)
            expect(helpers.startsWithSegment('a*.b', 'a*')).toBe(true)
            expect(helpers.startsWithSegment('a+.b', 'a+')).toBe(true)
            expect(helpers.startsWithSegment('a?.b', 'a?')).toBe(true)
            expect(helpers.startsWithSegment('a|.b', 'a|')).toBe(true)
            expect(helpers.startsWithSegment('a(.b', 'a(')).toBe(true)
            expect(helpers.startsWithSegment('a).b', 'a)')).toBe(true)
            expect(helpers.startsWithSegment('a[.b', 'a[')).toBe(true)
            expect(helpers.startsWithSegment('a].b', 'a]')).toBe(true)
            expect(helpers.startsWithSegment('a{.b', 'a{')).toBe(true)
            expect(helpers.startsWithSegment('a}.b', 'a}')).toBe(true)
            
            // Test that these don't match as regex patterns
            expect(helpers.startsWithSegment('abc', 'a*')).toBe(false) // * should not match any character
            expect(helpers.startsWithSegment('abc', 'a+')).toBe(false) // + should not match any character
            expect(helpers.startsWithSegment('abc', 'a?')).toBe(false) // ? should not match any character
        })
    })

    describe('.endsWithSegment()', function() {
        it('should return true if a route ends with a segment', function() {
            expect(helpers.endsWithSegment('a.b.c', 'c')).toBe(true)
            expect(helpers.endsWithSegment({ name: 'a.b.c' }, 'c')).toBe(true)
        })

        it('should return false if a route does not end with a segment', function() {
            expect(helpers.endsWithSegment('a.b.c', 'cc')).toBe(false)
            expect(helpers.endsWithSegment({ name: 'a.b.c' }, 'cc')).toBe(false)
        })

        it('should work with curried form', function() {
            expect(helpers.endsWithSegment('a.b.c')('c')).toBe(true)
            expect(helpers.endsWithSegment({ name: 'a.b.c' })('b.c')).toBe(true)
            expect(helpers.endsWithSegment('a.b.c')('d')).toBe(false)
        })
    })

    describe('.includesSegment()', function() {
        it('should return true if a route includes a segment', function() {
            expect(helpers.includesSegment('a.b.c', 'a')).toBe(true)
            expect(helpers.includesSegment('a.b.c', 'a.b')).toBe(true)
            expect(helpers.includesSegment('a.b.c', 'a.b.c')).toBe(true)
            expect(helpers.includesSegment('a.b.c', 'b')).toBe(true)
            expect(helpers.includesSegment('a.b.c', 'c')).toBe(true)
        })

        it('should return false if a route does not include a segment', function() {
            expect(helpers.includesSegment('a.b.c', 'aa')).toBe(false)
            expect(helpers.includesSegment('a.bb.c', 'a.b')).toBe(false)
            expect(helpers.includesSegment('a.b.c', 'bb.c')).toBe(false)
            expect(helpers.includesSegment('a.b.c', 'a.b.b')).toBe(false)
        })

        it('should work with curried form', function() {
            expect(helpers.includesSegment('a.b.c')('b')).toBe(true)
            expect(helpers.includesSegment({ name: 'a.b.c' })('a.c')).toBe(false)
        })
    })
})
