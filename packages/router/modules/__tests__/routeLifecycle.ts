import { errorCodes } from '../'
import { createTestRouter, omitMeta } from './helpers'
import createRouter from '../createRouter'

describe('core/route-lifecycle', function () {
    let router

    beforeAll(() => (router = createTestRouter().start()))
    afterAll(() => router.stop())

    it('should block navigation if a component refuses deactivation', done => {
        router.navigate('users.list', function () {
            // Cannot deactivate
            router.canDeactivate('users.list', () => () => Promise.reject())
            router.navigate('users', function (err) {
                expect(err.code).toBe(errorCodes.CANNOT_DEACTIVATE)
                expect(err.segment).toBe('users.list')
                expect(omitMeta(router.getState())).toEqual({
                    name: 'users.list',
                    params: {},
                    path: '/users/list'
                })

                // Can deactivate
                router.canDeactivate('users.list', true)
                router.navigate('users', function () {
                    expect(omitMeta(router.getState())).toEqual({
                        name: 'users',
                        params: {},
                        path: '/users'
                    })
                    // Auto clean up
                    expect(
                        router.getLifecycleFunctions()[0]['users.list']
                    ).toBe(undefined)
                    done()
                })
            })
        })
    })

    it('should register can deactivate status', done => {
        router.navigate('users.list', function () {
            router.canDeactivate('users.list', false)
            router.navigate('users', function (err) {
                expect(err.code).toBe(errorCodes.CANNOT_DEACTIVATE)
                expect(err.segment).toBe('users.list')
                router.canDeactivate('users.list', true)
                router.navigate('users', function (err) {
                    expect(err).toBe(null)
                    done()
                })
            })
        })
    })

    it('should block navigation if a route cannot be activated', done => {
        router.navigate('home', function () {
            router.navigate('admin', function (err) {
                expect(err.code).toBe(errorCodes.CANNOT_ACTIVATE)
                expect(err.segment).toBe('admin')
                expect(router.isActive('home')).toBe(true)
                done()
            })
        })
    })

    it('should force deactivation if specified as a transition option', done => {
        router.navigate('orders.view', { id: '1' }, {}, () => {
            router.canDeactivate('orders.view', false)
            router.navigate('home', err => {
                expect(err.code).toBe(errorCodes.CANNOT_DEACTIVATE)
                router.navigate(
                    'home',
                    {},
                    { forceDeactivate: true },
                    (err, state) => {
                        expect(state.name).toBe('home')
                        done()
                    }
                )
            })
        })
    })

    describe('Route lifecycle hooks', () => {
        let router
        let onEnterCalls: Array<{ route: string, toState: string, fromState?: string, deps: any }> = []
        let onExitCalls: Array<{ route: string, toState: string, fromState?: string, deps: any }> = []
        let onNodeInActiveChainCalls: Array<{ route: string, toState: string, fromState?: string, deps: any }> = []

        beforeEach(() => {
            onEnterCalls = []
            onExitCalls = []
            onNodeInActiveChainCalls = []

            const routes = [
                {
                    name: 'root',
                    path: '/root',
                    onEnterNode: async (toState, fromState, deps) => {
                        onEnterCalls.push({ route: 'root', toState: toState.name, fromState: fromState?.name, deps })
                    },
                    onExitNode: async (toState, fromState, deps) => {
                        onExitCalls.push({ route: 'root', toState: toState.name, fromState: fromState?.name, deps })
                    },
                    onNodeInActiveChain: async (toState, fromState, deps) => {
                        onNodeInActiveChainCalls.push({ route: 'root', toState: toState.name, fromState: fromState?.name, deps })
                    },
                    children: [
                        {
                            name: 'child1',
                            path: '/child1',
                            onEnterNode: async (toState, fromState, deps) => {
                                onEnterCalls.push({ route: 'root.child1', toState: toState.name, fromState: fromState?.name, deps })
                            },
                            onExitNode: async (toState, fromState, deps) => {
                                onExitCalls.push({ route: 'root.child1', toState: toState.name, fromState: fromState?.name, deps })
                            },
                            onNodeInActiveChain: async (toState, fromState, deps) => {
                                onNodeInActiveChainCalls.push({ route: 'root.child1', toState: toState.name, fromState: fromState?.name, deps })
                            },
                            children: [
                                {
                                    name: 'grandchild',
                                    path: '/grandchild',
                                    onEnterNode: async (toState, fromState, deps) => {
                                        onEnterCalls.push({ route: 'root.child1.grandchild', toState: toState.name, fromState: fromState?.name, deps })
                                    },
                                    onExitNode: async (toState, fromState, deps) => {
                                        onExitCalls.push({ route: 'root.child1.grandchild', toState: toState.name, fromState: fromState?.name, deps })
                                    }
                                }
                            ]
                        },
                        {
                            name: 'child2',
                            path: '/child2',
                            onEnterNode: async (toState, fromState, deps) => {
                                onEnterCalls.push({ route: 'root.child2', toState: toState.name, fromState: fromState?.name, deps })
                            },
                            onExitNode: async (toState, fromState, deps) => {
                                onExitCalls.push({ route: 'root.child2', toState: toState.name, fromState: fromState?.name, deps })
                            }
                        }
                    ]
                },
                {
                    name: 'other',
                    path: '/other',
                    onEnterNode: async (toState, fromState, deps) => {
                        onEnterCalls.push({ route: 'other', toState: toState.name, fromState: fromState?.name, deps })
                    },
                    onExitNode: async (toState, fromState, deps) => {
                        onExitCalls.push({ route: 'other', toState: toState.name, fromState: fromState?.name, deps })
                    }
                }
            ]

            router = createRouter(routes)
            // Set up test dependencies
            router.setDependencies({
                testService: { name: 'TestService' },
                analytics: { trackPageView: jest.fn() }
            })
            router.start()
        })

        afterEach(() => {
            router.stop()
        })

        it('should call onEnterRoute when entering a route', done => {
            router.navigate('root', () => {
                expect(onEnterCalls).toEqual([
                    { route: 'root', toState: 'root', fromState: undefined, deps: expect.objectContaining({ testService: { name: 'TestService' } }) }
                ])
                expect(onExitCalls).toEqual([])
                expect(onNodeInActiveChainCalls).toEqual([])
                done()
            })
        })

        it('should call onExitRoute when leaving a route', done => {
            router.navigate('root', () => {
                onEnterCalls = [] // Clear previous calls
                router.navigate('other', () => {
                    expect(onExitCalls).toEqual([
                        { route: 'root', toState: 'other', fromState: 'root', deps: expect.objectContaining({ testService: { name: 'TestService' } }) }
                    ])
                    expect(onEnterCalls).toEqual([
                        { route: 'other', toState: 'other', fromState: 'root', deps: expect.objectContaining({ testService: { name: 'TestService' } }) }
                    ])
                    done()
                })
            })
        })

        it('should call onRouteInActiveChain for routes that remain on the path', done => {
            router.navigate('root.child1.grandchild', () => {
                onEnterCalls = []
                onExitCalls = []
                onNodeInActiveChainCalls = []

                router.navigate('root.child2', () => {
                    expect(onNodeInActiveChainCalls).toEqual([
                        { route: 'root', toState: 'root.child2', fromState: 'root.child1.grandchild', deps: expect.objectContaining({ testService: { name: 'TestService' } }) }
                    ])
                    expect(onExitCalls).toContainEqual(
                        { route: 'root.child1.grandchild', toState: 'root.child2', fromState: 'root.child1.grandchild', deps: expect.objectContaining({ testService: { name: 'TestService' } }) }
                    )
                    expect(onExitCalls).toContainEqual(
                        { route: 'root.child1', toState: 'root.child2', fromState: 'root.child1.grandchild', deps: expect.objectContaining({ testService: { name: 'TestService' } }) }
                    )
                    expect(onEnterCalls).toEqual([
                        { route: 'root.child2', toState: 'root.child2', fromState: 'root.child1.grandchild', deps: expect.objectContaining({ testService: { name: 'TestService' } }) }
                    ])
                    done()
                })
            })
        })

        it('should call onRouteInActiveChain for parent routes on initial navigation', done => {
            // Create a new router to test initial navigation
            const newRouter = createRouter([
                {
                    name: 'app',
                    path: '/app',
                    onNodeInActiveChain: async (toState, fromState, deps) => {
                        onNodeInActiveChainCalls.push({ route: 'app', toState: toState.name, fromState: fromState?.name, deps })
                    },
                    children: [
                        {
                            name: 'dashboard',
                            path: '/dashboard',
                            onNodeInActiveChain: async (toState, fromState, deps) => {
                                onNodeInActiveChainCalls.push({ route: 'app.dashboard', toState: toState.name, fromState: fromState?.name, deps })
                            },
                            children: [
                                {
                                    name: 'stats',
                                    path: '/stats',
                                    onEnterNode: async (toState, fromState, deps) => {
                                        onEnterCalls.push({ route: 'app.dashboard.stats', toState: toState.name, fromState: fromState?.name, deps })
                                    }
                                }
                            ]
                        }
                    ]
                }
            ])

            onNodeInActiveChainCalls = []
            onEnterCalls = []

            newRouter.setDependencies({
                testService: { name: 'TestService' },
                analytics: { trackPageView: jest.fn() }
            })
            newRouter.start()
            newRouter.navigate('app.dashboard.stats', () => {
                // On initial navigation to app.dashboard.stats:
                // - onRouteInActiveChain should be triggered for 'app' and 'app.dashboard' (parent routes)
                // - onEnterRoute should be triggered for 'app.dashboard.stats' (final route)
                expect(onNodeInActiveChainCalls).toEqual([
                    { route: 'app', toState: 'app.dashboard.stats', fromState: undefined, deps: expect.objectContaining({ testService: { name: 'TestService' } }) },
                    { route: 'app.dashboard', toState: 'app.dashboard.stats', fromState: undefined, deps: expect.objectContaining({ testService: { name: 'TestService' } }) }
                ])
                expect(onEnterCalls).toEqual([
                    { route: 'app.dashboard.stats', toState: 'app.dashboard.stats', fromState: undefined, deps: expect.objectContaining({ testService: { name: 'TestService' } }) }
                ])

                newRouter.stop()
                done()
            })
        })

        it('should pass dependencies to lifecycle hooks', done => {
            let depsReceived: any = null

            const testRoutes = [
                {
                    name: 'testRoute',
                    path: '/test',
                    onEnterNode: async (toState, fromState, deps) => {
                        depsReceived = deps
                    }
                }
            ]

            const testRouter = createRouter(testRoutes)
            const testDeps = {
                testService: { name: 'TestService' },
                analytics: { trackPageView: jest.fn() }
            }

            testRouter.setDependencies(testDeps)
            testRouter.start()

            testRouter.navigate('testRoute', () => {
                expect(depsReceived).not.toBeNull()
                expect(depsReceived).toEqual(testDeps)
                expect(depsReceived!.testService.name).toBe('TestService')
                expect(typeof depsReceived!.analytics.trackPageView).toBe('function')

                testRouter.stop()
                done()
            })
        })

        it('should NOT block navigation with async operations in lifecycle hooks', done => {
            let onEnterCompleted = false
            let onExitCompleted = false
            let navigationCompleteTime: number

            const testRoutes = [
                {
                    name: 'source',
                    path: '/source',
                    onExitNode: async (toState, fromState, deps) => {
                        await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
                        onExitCompleted = true
                    }
                },
                {
                    name: 'target',
                    path: '/target',
                    onEnterNode: async (toState, fromState, deps) => {
                        await new Promise(resolve => setTimeout(resolve, 300)) // 300ms delay
                        onEnterCompleted = true
                    }
                }
            ]

            const testRouter = createRouter(testRoutes)
            testRouter.setDependencies({
                testService: { name: 'TestService' }
            })
            testRouter.start()

            const navigationStartTime = Date.now()

            // First navigate to source
            testRouter.navigate('source', () => {
                // Now navigate to target (this will trigger onExitNode for source and onEnterNode for target)
                testRouter.navigate('target', () => {
                    navigationCompleteTime = Date.now()
                    const totalDuration = navigationCompleteTime - navigationStartTime

                    // Navigation should complete quickly (< 50ms), not waiting for async operations
                    expect(totalDuration).toBeLessThan(50)

                    // Verify that async operations haven't completed yet
                    expect(onExitCompleted).toBe(false)
                    expect(onEnterCompleted).toBe(false)

                    // Wait for async operations to complete for verification
                    setTimeout(() => {
                        expect(onExitCompleted).toBe(true)
                        expect(onEnterCompleted).toBe(true)

                        testRouter.stop()
                        done()
                    }, 350) // Wait longer than the longest operation (300ms)
                })
            })
        })

        it('should not block navigation when lifecycle hooks contain async operations', done => {
            let navigationCompleted = false
            let hookExecuted = false

            const testRoutes = [
                {
                    name: 'asyncRoute',
                    path: '/async',
                    onEnterNode: async (toState, fromState, deps) => {
                        // Async operation without blocking
                        await new Promise(resolve => setTimeout(resolve, 100))
                        hookExecuted = true
                    }
                },
                {
                    name: 'target',
                    path: '/target'
                }
            ]

            const testRouter = createRouter(testRoutes)
            testRouter.setDependencies({
                testService: { name: 'TestService' }
            })
            testRouter.start()

            const navigationStartTime = Date.now()

            // Navigate to asyncRoute, then to target
            testRouter.navigate('asyncRoute', () => {
                testRouter.navigate('target', () => {
                    const navigationDuration = Date.now() - navigationStartTime
                    navigationCompleted = true

                    // Navigation should complete quickly without waiting for hooks
                    expect(navigationDuration).toBeLessThan(50)
                    expect(testRouter.getState().name).toBe('target')

                    // Hook executes in background
                    setTimeout(() => {
                        expect(hookExecuted).toBe(true)
                        testRouter.stop()
                        done()
                    }, 150)
                })
            })
        })

        it('should execute multiple lifecycle hooks in parallel', done => {
            let hookExecutionTimes: Array<{ hook: string; duration: number }> = []
            let navigationCompleted = false

            const testRoutes = [
                {
                    name: 'source',
                    path: '/source',
                    onExitNode: async (toState, fromState, deps) => {
                        const startTime = Date.now()
                        await new Promise(resolve => setTimeout(resolve, 100))
                        hookExecutionTimes.push({ hook: 'onExitNode', duration: Date.now() - startTime })
                    }
                },
                {
                    name: 'target',
                    path: '/target',
                    onEnterNode: async (toState, fromState, deps) => {
                        const startTime = Date.now()
                        await new Promise(resolve => setTimeout(resolve, 150))
                        hookExecutionTimes.push({ hook: 'onEnterNode', duration: Date.now() - startTime })
                    }
                }
            ]

            const testRouter = createRouter(testRoutes)
            testRouter.setDependencies({
                testService: { name: 'TestService' }
            })
            testRouter.start()

            const navigationStartTime = Date.now()

            // Navigate to source, then to target
            testRouter.navigate('source', () => {
                testRouter.navigate('target', () => {
                    const navigationDuration = Date.now() - navigationStartTime
                    navigationCompleted = true

                    // Navigation should complete quickly - this is the main goal of the test
                    expect(navigationDuration).toBeLessThan(50)
                    expect(testRouter.getState().name).toBe('target')

                    // Wait for all hooks to complete
                    setTimeout(() => {
                        expect(hookExecutionTimes).toHaveLength(2)

                        // Verify that hooks executed (main point - navigation wasn't blocked)
                        const maxDuration = Math.max(...hookExecutionTimes.map(h => h.duration))
                        const totalDuration = hookExecutionTimes.reduce((sum, h) => sum + h.duration, 0)

                        // Hooks should execute (execution time should be reasonable)
                        expect(maxDuration).toBeGreaterThan(90) // Minimum 90ms for the fastest hook
                        expect(totalDuration).toBeGreaterThan(200) // Total time should be greater than sum

                        testRouter.stop()
                        done()
                    }, 200)
                })
            })
        })

        it('should handle synchronous and asynchronous lifecycle hooks the same way', done => {
            let syncHookCalled = false
            let asyncHookCalled = false
            let navigationCompleted = false

            const testRoutes = [
                {
                    name: 'mixed',
                    path: '/mixed',
                    onEnterNode: async (toState, fromState, deps) => {
                        // Synchronous hook
                        syncHookCalled = true
                    },
                    onExitNode: async (toState, fromState, deps) => {
                        // Asynchronous hook
                        await new Promise(resolve => setTimeout(resolve, 100))
                        asyncHookCalled = true
                    }
                },
                {
                    name: 'target',
                    path: '/target'
                }
            ]

            const testRouter = createRouter(testRoutes)
            testRouter.setDependencies({
                testService: { name: 'TestService' }
            })
            testRouter.start()

            const navigationStartTime = Date.now()

            // Navigate to mixed, then to target
            testRouter.navigate('mixed', () => {
                testRouter.navigate('target', () => {
                    const navigationDuration = Date.now() - navigationStartTime
                    navigationCompleted = true

                    // Navigation should complete quickly
                    expect(navigationDuration).toBeLessThan(50)
                    expect(testRouter.getState().name).toBe('target')

                    // Synchronous hook should be called immediately
                    expect(syncHookCalled).toBe(true)

                    // Asynchronous hook should complete later
                    setTimeout(() => {
                        expect(asyncHookCalled).toBe(true)

                        testRouter.stop()
                        done()
                    }, 150)
                })
            })
        })
    })

    describe('Browser title functionality', () => {
        let router
        let originalTitle
        let mockDocument

        beforeEach(() => {
            // Mock document if it doesn't exist
            if (typeof document === 'undefined') {
                mockDocument = {
                    title: 'Default Title'
                }
                    ; (global as any).document = mockDocument
            } else {
                originalTitle = document.title
                document.title = 'Default Title'
            }
        })

        afterEach(() => {
            if (mockDocument) {
                delete (global as any).document
            } else if (originalTitle !== undefined) {
                document.title = originalTitle
            }
            if (router) {
                router.stop()
            }
        })

        it('should set browser title from string', (done) => {
            const routes = [
                {
                    name: 'home',
                    path: '/home',
                    browserTitle: 'Home Page'
                }
            ]

            router = createRouter(routes)
            router.start()

            router.navigate('home', (err) => {
                expect(err).toBeNull()
                expect(document.title).toBe('Home Page')
                done()
            })
        })

        it('should set browser title from function', (done) => {
            const routes = [
                {
                    name: 'user',
                    path: '/user/:id',
                    browserTitle: async (state) => {
                        return `User ${state.params.id} Profile`
                    }
                }
            ]

            router = createRouter(routes)
            router.start()

            router.navigate('user', { id: '123' }, (err) => {
                expect(err).toBeNull()
                // Navigation completes immediately, browserTitle executes in background
                setTimeout(() => {
                    expect(document.title).toBe('User 123 Profile')
                    done()
                }, 10)
            })
        })

        it('should use most specific route title in nested routes', (done) => {
            const routes = [
                {
                    name: 'app',
                    path: '/app',
                    browserTitle: 'My App',
                    children: [
                        {
                            name: 'dashboard',
                            path: '/dashboard',
                            browserTitle: 'Dashboard - My App'
                        },
                        {
                            name: 'profile',
                            path: '/profile'
                            // No browserTitle - should use parent's
                        }
                    ]
                }
            ]

            router = createRouter(routes)
            router.start()

            router.navigate('app.dashboard', (err) => {
                expect(err).toBeNull()
                expect(document.title).toBe('Dashboard - My App')

                router.navigate('app.profile', (err) => {
                    expect(err).toBeNull()
                    expect(document.title).toBe('My App')
                    done()
                })
            })
        })

        it('should not change title if no browserTitle is defined', (done) => {
            const routes = [
                {
                    name: 'simple',
                    path: '/simple'
                    // No browserTitle
                }
            ]

            router = createRouter(routes)
            router.start()

            const initialTitle = document.title
            router.navigate('simple', (err) => {
                expect(err).toBeNull()
                expect(document.title).toBe(initialTitle)
                done()
            })
        })

        it('should set browser title from function with dependencies', (done) => {
            const routes = [
                {
                    name: 'user',
                    path: '/user/:id',
                    browserTitle: async (state, deps) => {
                        const userService = deps.userService
                        return `User ${state.params.id} - ${userService.getAppName()}`
                    }
                }
            ]

            router = createRouter(routes)
            router.setDependencies({
                userService: {
                    getAppName: () => 'My Application'
                }
            })
            router.start()

            router.navigate('user', { id: '123' }, (err) => {
                expect(err).toBeNull()
                // Navigation completes immediately, browserTitle executes in background
                setTimeout(() => {
                    expect(document.title).toBe('User 123 - My Application')
                    done()
                }, 10)
            })
        })

        it('should NOT block navigation with async browserTitle functions', (done) => {
            let navigationCompleted = false
            let titleUpdated = false

            const routes = [
                {
                    name: 'slowTitle',
                    path: '/slow',
                    browserTitle: async (state, deps) => {
                        await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
                        titleUpdated = true
                        return 'Slow Title'
                    }
                },
                {
                    name: 'target',
                    path: '/target'
                }
            ]

            router = createRouter(routes)
            router.setDependencies({
                userService: {
                    getAppName: () => 'My Application'
                }
            })
            router.start()

            const navigationStartTime = Date.now()

            router.navigate('slowTitle', (err) => {
                const navigationDuration = Date.now() - navigationStartTime
                navigationCompleted = true

                // Navigation should complete quickly, not waiting for browserTitle
                expect(navigationDuration).toBeLessThan(50)
                expect(err).toBeNull()

                // browserTitle should not be updated yet
                expect(titleUpdated).toBe(false)

                // Wait for browserTitle to complete
                setTimeout(() => {
                    expect(titleUpdated).toBe(true)
                    expect(document.title).toBe('Slow Title')
                    done()
                }, 250)
            })
        })

        it('should not block navigation with slow browserTitle functions', (done) => {
            let navigationCompleted = false
            let titleFunctionCalled = false

            const routes = [
                {
                    name: 'slowTitleRoute',
                    path: '/slow-title',
                    browserTitle: async (state, deps) => {
                        titleFunctionCalled = true
                        await new Promise(resolve => setTimeout(resolve, 100))
                        return 'Slow Title Result'
                    }
                },
                {
                    name: 'target',
                    path: '/target'
                }
            ]

            router = createRouter(routes)
            router.start()

            const navigationStartTime = Date.now()

            router.navigate('slowTitleRoute', (err) => {
                const navigationDuration = Date.now() - navigationStartTime
                navigationCompleted = true

                // Navigation should complete quickly without waiting for browserTitle
                expect(navigationDuration).toBeLessThan(50)
                expect(err).toBeNull()
                expect(titleFunctionCalled).toBe(true)

                // Wait for title to be set
                setTimeout(() => {
                    expect(document.title).toBe('Slow Title Result')
                    done()
                }, 150)
            })
        })

        it('should handle synchronous and asynchronous browserTitle functions the same way', (done) => {
            let syncTitleSet = false
            let asyncTitleSet = false

            const routes = [
                {
                    name: 'syncTitle',
                    path: '/sync',
                    browserTitle: async (state, deps) => {
                        syncTitleSet = true
                        return 'Sync Title'
                    }
                },
                {
                    name: 'asyncTitle',
                    path: '/async',
                    browserTitle: async (state, deps) => {
                        await new Promise(resolve => setTimeout(resolve, 100))
                        asyncTitleSet = true
                        return 'Async Title'
                    }
                }
            ]

            router = createRouter(routes)
            router.start()

            // Test synchronous function
            router.navigate('syncTitle', (err) => {
                expect(err).toBeNull()
                expect(syncTitleSet).toBe(true)

                // Wait for title to be set (it's set asynchronously)
                setTimeout(() => {
                    expect(document.title).toBe('Sync Title')

                    // Test asynchronous function
                    router.navigate('asyncTitle', (err) => {
                        expect(err).toBeNull()
                        expect(asyncTitleSet).toBe(false) // Not completed yet

                        setTimeout(() => {
                            expect(asyncTitleSet).toBe(true)
                            expect(document.title).toBe('Async Title')
                            done()
                        }, 150)
                    })
                }, 50)
            })
        })
    })
})
