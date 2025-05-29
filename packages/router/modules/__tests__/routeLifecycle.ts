import { errorCodes } from '../'
import { createTestRouter, omitMeta } from './helpers'
import createRouter from '../createRouter'

describe('core/route-lifecycle', function() {
    let router

    beforeAll(() => (router = createTestRouter().start()))
    afterAll(() => router.stop())

    it('should block navigation if a component refuses deactivation', done => {
        router.navigate('users.list', function() {
            // Cannot deactivate
            router.canDeactivate('users.list', () => () => Promise.reject())
            router.navigate('users', function(err) {
                expect(err.code).toBe(errorCodes.CANNOT_DEACTIVATE)
                expect(err.segment).toBe('users.list')
                expect(omitMeta(router.getState())).toEqual({
                    name: 'users.list',
                    params: {},
                    path: '/users/list'
                })

                // Can deactivate
                router.canDeactivate('users.list', true)
                router.navigate('users', function() {
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
        router.navigate('users.list', function() {
            router.canDeactivate('users.list', false)
            router.navigate('users', function(err) {
                expect(err.code).toBe(errorCodes.CANNOT_DEACTIVATE)
                expect(err.segment).toBe('users.list')
                router.canDeactivate('users.list', true)
                router.navigate('users', function(err) {
                    expect(err).toBe(null)
                    done()
                })
            })
        })
    })

    it('should block navigation if a route cannot be activated', done => {
        router.navigate('home', function() {
            router.navigate('admin', function(err) {
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
        let onEnterCalls: Array<{route: string, toState: string, fromState?: string}> = []
        let onExitCalls: Array<{route: string, toState: string, fromState?: string}> = []
        let onNodeInActiveChainCalls: Array<{route: string, toState: string, fromState?: string}> = []

        beforeEach(() => {
            onEnterCalls = []
            onExitCalls = []
            onNodeInActiveChainCalls = []

            const routes = [
                {
                    name: 'root',
                    path: '/root',
                    onEnterNode: async (toState, fromState) => {
                        onEnterCalls.push({ route: 'root', toState: toState.name, fromState: fromState?.name })
                    },
                    onExitNode: async (toState, fromState) => {
                        onExitCalls.push({ route: 'root', toState: toState.name, fromState: fromState?.name })
                    },
                    onNodeInActiveChain: async (toState, fromState) => {
                        onNodeInActiveChainCalls.push({ route: 'root', toState: toState.name, fromState: fromState?.name })
                    },
                    children: [
                        {
                            name: 'child1',
                            path: '/child1',
                            onEnterNode: async (toState, fromState) => {
                                onEnterCalls.push({ route: 'root.child1', toState: toState.name, fromState: fromState?.name })
                            },
                            onExitNode: async (toState, fromState) => {
                                onExitCalls.push({ route: 'root.child1', toState: toState.name, fromState: fromState?.name })
                            },
                            onNodeInActiveChain: async (toState, fromState) => {
                                onNodeInActiveChainCalls.push({ route: 'root.child1', toState: toState.name, fromState: fromState?.name })
                            },
                            children: [
                                {
                                    name: 'grandchild',
                                    path: '/grandchild',
                                    onEnterNode: async (toState, fromState) => {
                                        onEnterCalls.push({ route: 'root.child1.grandchild', toState: toState.name, fromState: fromState?.name })
                                    },
                                    onExitNode: async (toState, fromState) => {
                                        onExitCalls.push({ route: 'root.child1.grandchild', toState: toState.name, fromState: fromState?.name })
                                    }
                                }
                            ]
                        },
                        {
                            name: 'child2',
                            path: '/child2',
                            onEnterNode: async (toState, fromState) => {
                                onEnterCalls.push({ route: 'root.child2', toState: toState.name, fromState: fromState?.name })
                            },
                            onExitNode: async (toState, fromState) => {
                                onExitCalls.push({ route: 'root.child2', toState: toState.name, fromState: fromState?.name })
                            }
                        }
                    ]
                },
                {
                    name: 'other',
                    path: '/other',
                    onEnterNode: async (toState, fromState) => {
                        onEnterCalls.push({ route: 'other', toState: toState.name, fromState: fromState?.name })
                    },
                    onExitNode: async (toState, fromState) => {
                        onExitCalls.push({ route: 'other', toState: toState.name, fromState: fromState?.name })
                    }
                }
            ]

            router = createRouter(routes)
            router.start()
        })

        afterEach(() => {
            router.stop()
        })

        it('should call onEnterRoute when entering a route', done => {
            router.navigate('root', () => {
                expect(onEnterCalls).toEqual([
                    { route: 'root', toState: 'root', fromState: undefined }
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
                        { route: 'root', toState: 'other', fromState: 'root' }
                    ])
                    expect(onEnterCalls).toEqual([
                        { route: 'other', toState: 'other', fromState: 'root' }
                    ])
                    done()
                })
            })
        })

        it('should call onRouteInActiveChain for routes that remain on the path', done => {
            router.navigate('root.child1', () => {
                onEnterCalls = []
                onExitCalls = []
                onNodeInActiveChainCalls = []
                
                router.navigate('root.child2', () => {
                    expect(onNodeInActiveChainCalls).toEqual([
                        { route: 'root', toState: 'root.child2', fromState: 'root.child1' }
                    ])
                    expect(onExitCalls).toEqual([
                        { route: 'root.child1', toState: 'root.child2', fromState: 'root.child1' }
                    ])
                    expect(onEnterCalls).toEqual([
                        { route: 'root.child2', toState: 'root.child2', fromState: 'root.child1' }
                    ])
                    done()
                })
            })
        })

        it('should call onRouteInActiveChain for nested routes', done => {
            router.navigate('root.child1.grandchild', () => {
                onEnterCalls = []
                onExitCalls = []
                onNodeInActiveChainCalls = []
                
                router.navigate('root.child2', () => {
                    expect(onNodeInActiveChainCalls).toEqual([
                        { route: 'root', toState: 'root.child2', fromState: 'root.child1.grandchild' }
                    ])
                    expect(onExitCalls).toContainEqual(
                        { route: 'root.child1.grandchild', toState: 'root.child2', fromState: 'root.child1.grandchild' }
                    )
                    expect(onExitCalls).toContainEqual(
                        { route: 'root.child1', toState: 'root.child2', fromState: 'root.child1.grandchild' }
                    )
                    expect(onEnterCalls).toEqual([
                        { route: 'root.child2', toState: 'root.child2', fromState: 'root.child1.grandchild' }
                    ])
                    done()
                })
            })
        })

        it('should call onRouteInActiveChain for parent routes on initial navigation', done => {
            // Создаем новый роутер для тестирования начальной навигации
            const newRouter = createRouter([
                {
                    name: 'app',
                    path: '/app',
                    onNodeInActiveChain: async (toState, fromState) => {
                        onNodeInActiveChainCalls.push({ route: 'app', toState: toState.name, fromState: fromState?.name })
                    },
                    children: [
                        {
                            name: 'dashboard',
                            path: '/dashboard',
                            onNodeInActiveChain: async (toState, fromState) => {
                                onNodeInActiveChainCalls.push({ route: 'app.dashboard', toState: toState.name, fromState: fromState?.name })
                            },
                            children: [
                                {
                                    name: 'stats',
                                    path: '/stats',
                                    onEnterNode: async (toState, fromState) => {
                                        onEnterCalls.push({ route: 'app.dashboard.stats', toState: toState.name, fromState: fromState?.name })
                                    }
                                }
                            ]
                        }
                    ]
                }
            ])

            onNodeInActiveChainCalls = []
            onEnterCalls = []

            newRouter.start()
            newRouter.navigate('app.dashboard.stats', () => {
                // При начальной навигации к app.dashboard.stats:
                // - onRouteInActiveChain должен сработать для 'app' и 'app.dashboard' (родительские роуты)
                // - onEnterRoute должен сработать для 'app.dashboard.stats' (конечный роут)
                expect(onNodeInActiveChainCalls).toEqual([
                    { route: 'app', toState: 'app.dashboard.stats', fromState: undefined },
                    { route: 'app.dashboard', toState: 'app.dashboard.stats', fromState: undefined }
                ])
                expect(onEnterCalls).toEqual([
                    { route: 'app.dashboard.stats', toState: 'app.dashboard.stats', fromState: undefined }
                ])
                
                newRouter.stop()
                done()
            })
        })
    })

    describe('Browser title functionality', () => {
        let router
        let originalTitle
        let mockDocument

        beforeEach(() => {
            // Мокируем document если его нет
            if (typeof document === 'undefined') {
                mockDocument = {
                    title: 'Default Title'
                }
                ;(global as any).document = mockDocument
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
                // Небольшая задержка для async функции
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
                            // Нет browserTitle - должен использовать родительский
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
                    // Нет browserTitle
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
    })
})
