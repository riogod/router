import { createRouter } from '@riogz/router'
import persistentParamsPlugin from '../'

const createTestRouter = () =>
    createRouter([
        { name: 'route1', path: '/route1/:id' },
        { name: 'route2', path: '/route2/:id' },
        { name: 'home', path: '/' },
        { name: 'settings', path: '/settings' }
    ])

describe('Persistent params plugin', () => {
    let router

    describe('with an array', () => {
        beforeAll(() => {
            router = createTestRouter()
        })

        it('should be registered with params', () => {
            router.usePlugin(persistentParamsPlugin(['mode']))
        })

        it('should persist specified parameters', done => {
            router.start('route1')
            router.navigate('route2', { id: '2' }, {}, (err, state) => {
                expect(state.path).toBe('/route2/2')
                router.navigate(
                    'route1',
                    { id: '1', mode: 'dev' },
                    {},
                    (err, state) => {
                        expect(state.path).toBe('/route1/1?mode=dev')

                        router.navigate(
                            'route2',
                            { id: '2' },
                            {},
                            (err, state) => {
                                expect(state.path).toBe('/route2/2?mode=dev')
                                done()
                            }
                        )
                    }
                )
            })
        })

        it('should save value on start', done => {
            router.stop()
            router.start('/route2/1?mode=dev', (err, state) => {
                expect(state.params).toEqual({ mode: 'dev', id: '1' })

                router.navigate('route2', { id: '2' }, {}, (err, state) => {
                    expect(state.path).toBe('/route2/2?mode=dev')
                    done()
                })
            })
        })
    })

    describe('with an object', () => {
        beforeAll(() => {
            router.stop()
            router = createTestRouter()
        })

        it('should be registered with params', () => {
            router.usePlugin(persistentParamsPlugin({ mode: 'dev' }))
        })

        it('should persist specified parameters', done => {
            router.start()
            router.navigate('route1', { id: '1' }, {}, (err, state) => {
                expect(state.path).toBe('/route1/1?mode=dev')
                done()
            })
        })
    })

    describe('multiple persistent parameters', () => {
        beforeAll(() => {
            router.stop()
            router = createTestRouter()
        })

        it('should handle multiple parameters with array format', () => {
            router.usePlugin(persistentParamsPlugin(['theme', 'locale', 'debug']))
        })

        it('should persist multiple parameters independently', done => {
            router.start()
            
            // Set theme first
            router.navigate('route1', { id: '1', theme: 'dark' }, {}, (err, state) => {
                expect(state.path).toBe('/route1/1?theme=dark')
                
                // Add locale
                router.navigate('route2', { id: '2', locale: 'ru' }, {}, (err, state) => {
                    expect(state.path).toBe('/route2/2?theme=dark&locale=ru')
                    
                    // Navigate without setting new params - both should persist
                    router.navigate('home', {}, {}, (err, state) => {
                        expect(state.path).toBe('/?theme=dark&locale=ru')
                        done()
                    })
                })
            })
        })
    })

    describe('with object defaults', () => {
        beforeAll(() => {
            router.stop()
            router = createTestRouter()
        })

        it('should include default values from start', () => {
            router.usePlugin(persistentParamsPlugin({
                theme: 'light',
                locale: 'en',
                debug: false
            }))
        })

        it('should include defaults in all routes', done => {
            router.start()
            router.navigate('home', {}, {}, (err, state) => {
                expect(state.path).toBe('/?theme=light&locale=en&debug=false')
                done()
            })
        })

        it('should allow overriding default values', done => {
            router.navigate('route1', { id: '1', theme: 'dark' }, {}, (err, state) => {
                expect(state.path).toBe('/route1/1?theme=dark&locale=en&debug=false')
                
                // Theme should persist with new value
                router.navigate('settings', {}, {}, (err, state) => {
                    expect(state.path).toBe('/settings?theme=dark&locale=en&debug=false')
                    done()
                })
            })
        })
    })

    describe('edge cases', () => {
        beforeAll(() => {
            router.stop()
            router = createTestRouter()
        })

        it('should handle undefined parameter values gracefully', () => {
            router.usePlugin(persistentParamsPlugin(['theme', 'locale']))
        })

        it('should not include undefined parameters in URL', done => {
            router.start()
            router.navigate('home', { theme: undefined }, {}, (err, state) => {
                // Should not include theme=undefined in URL
                expect(state.path).toBe('/')
                done()
            })
        })

        it('should handle empty configuration', () => {
            router.stop()
            router = createTestRouter()
            
            // Should not throw with empty config
            expect(() => {
                router.usePlugin(persistentParamsPlugin())
            }).not.toThrow()
            
            expect(() => {
                router.usePlugin(persistentParamsPlugin({}))
            }).not.toThrow()
            
            expect(() => {
                router.usePlugin(persistentParamsPlugin([]))
            }).not.toThrow()
        })

                it('should handle mixed parameter types', () => {
            // Test that the plugin can handle both persistent and non-persistent params
            router.stop()
            router = createTestRouter()
            router.usePlugin(persistentParamsPlugin(['theme']))
            
            // Should not throw when mixing parameter types
            expect(() => {
                router.start()
            }).not.toThrow()
        })
    })

    describe('TypeScript exports', () => {
        it('should export named functions and types', () => {
            // Test that named exports are available
            const { persistentParamsPluginFactory } = require('../')
            expect(typeof persistentParamsPluginFactory).toBe('function')
        })
    })
})
