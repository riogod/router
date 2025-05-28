import { createRouter } from '../index'
import { omitMeta } from './helpers'

describe('Unicode and Emoji Handling', () => {
    describe('Query parameters with Unicode characters and emojis', () => {
        it('should handle Chinese characters without root path', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ])

            const state = router.matchPath('/search?q=测试')
            expect(omitMeta(state)).toEqual({
                name: 'search',
                params: { q: '测试' },
                path: '/search'
            })
        })

        it('should handle emojis without root path', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ])

            const state = router.matchPath('/search?q=🚀')
            expect(omitMeta(state)).toEqual({
                name: 'search',
                params: { q: '🚀' },
                path: '/search'
            })
        })

        it('should handle Chinese characters and emojis without root path', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ])

            const state = router.matchPath('/search?q=测试🚀')
            expect(omitMeta(state)).toEqual({
                name: 'search',
                params: { q: '测试🚀' },
                path: '/search'
            })
        })

        it('should handle Chinese characters with root path', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ], {
                defaultRoute: 'home'
            })

            router.setRootPath('/app')

            const state = router.matchPath('/app/search?q=测试')
            expect(omitMeta(state)).toEqual({
                name: 'search',
                params: { q: '测试' },
                path: '/app/search'
            })
        })

        it('should handle emojis with root path', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ], {
                defaultRoute: 'home'
            })

            router.setRootPath('/app')

            const state = router.matchPath('/app/search?q=🚀')
            expect(omitMeta(state)).toEqual({
                name: 'search',
                params: { q: '🚀' },
                path: '/app/search'
            })
        })

        it('should handle Chinese characters and emojis with root path', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ], {
                defaultRoute: 'home'
            })

            router.setRootPath('/app')

            const state = router.matchPath('/app/search?q=测试🚀')
            expect(omitMeta(state)).toEqual({
                name: 'search',
                params: { q: '测试🚀' },
                path: '/app/search'
            })
        })

        it('should handle complex emojis with root path', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ], {
                defaultRoute: 'home'
            })

            router.setRootPath('/app')

            const state = router.matchPath('/app/search?q=👨‍💻🌟🎉')
            expect(omitMeta(state)).toEqual({
                name: 'search',
                params: { q: '👨‍💻🌟🎉' },
                path: '/app/search'
            })
        })

        it('should handle multiple Unicode parameters', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ])

            const state = router.matchPath('/search?q=测试🚀&category=技术&emoji=🎯')
            expect(omitMeta(state)).toEqual({
                name: 'search',
                params: { 
                    q: '测试🚀',
                    category: '技术',
                    emoji: '🎯'
                },
                path: '/search'
            })
        })

        it('should build paths correctly', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ])

            // buildPath only builds the path part, not query parameters
            const path = router.buildPath('search')
            expect(path).toBe('/search')
        })

        it('should build paths with root path correctly', () => {
            const router = createRouter([
                { name: 'home', path: '/' },
                { name: 'search', path: '/search' }
            ], {
                defaultRoute: 'home'
            })

            router.setRootPath('/app')

            // buildPath only builds the path part, not query parameters
            const path = router.buildPath('search')
            expect(path).toBe('/app/search')
        })
    })
}) 