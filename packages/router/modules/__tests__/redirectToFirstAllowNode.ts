import { errorCodes, constants } from '../'
import { createTestRouter, omitMeta } from './helpers'
import createRouter from '../createRouter'

describe('redirectToFirstAllowNode functionality', function() {
    let router

    beforeAll(() => {
        const routes = [
            {
                name: 'app',
                path: '/app',
                redirectToFirstAllowNode: true,
                children: [
                    { name: 'dashboard', path: '/dashboard' },
                    { name: 'settings', path: '/settings' }
                ]
            },
            {
                name: 'admin',
                path: '/admin',
                redirectToFirstAllowNode: true,
                children: [
                    { 
                        name: 'users', 
                        path: '/users',
                        canActivate: () => (toState, fromState, done) => {
                            done(new Error('Access denied'))
                        }
                    },
                    { name: 'reports', path: '/reports' }
                ]
            },
            {
                name: 'protected',
                path: '/protected',
                redirectToFirstAllowNode: true,
                children: [
                    { 
                        name: 'secret1', 
                        path: '/secret1',
                        canActivate: () => (toState, fromState, done) => {
                            done(new Error('Access denied'))
                        }
                    },
                    { 
                        name: 'secret2', 
                        path: '/secret2',
                        canActivate: () => (toState, fromState, done) => {
                            done(new Error('Access denied'))
                        }
                    }
                ]
            },
            {
                name: 'empty',
                path: '/empty',
                redirectToFirstAllowNode: true
                // No children
            },
            {
                name: 'home',
                path: '/',
                redirectToFirstAllowNode: true,
                children: [
                    { name: 'welcome', path: '/welcome' }
                ]
            }
        ]

        router = createRouter(routes, { allowNotFound: true })
        router.start()
    })

    afterAll(() => router.stop())

    it('should register redirectToFirstAllowNode routes in config', () => {
        expect(router.config.redirectToFirstAllowNodeMap).toBeDefined()
        expect(router.config.redirectToFirstAllowNodeMap['app']).toBe(true)
        expect(router.config.redirectToFirstAllowNodeMap['admin']).toBe(true)
        expect(router.config.redirectToFirstAllowNodeMap['protected']).toBe(true)
        expect(router.config.redirectToFirstAllowNodeMap['empty']).toBe(true)
        expect(router.config.redirectToFirstAllowNodeMap['home']).toBe(true)
    })

    it('should find first accessible child', async () => {
        const firstChild = await router.findFirstAccessibleChild('app')
        expect(firstChild).toBe('app.dashboard')
    })

    it('should skip inaccessible children and find first accessible one', async () => {
        const firstChild = await router.findFirstAccessibleChild('admin')
        expect(firstChild).toBe('admin.reports')
    })

    it('should return null if no accessible children found', async () => {
        const firstChild = await router.findFirstAccessibleChild('protected')
        expect(firstChild).toBeNull()
    })

    it('should return null if no children exist', async () => {
        const firstChild = await router.findFirstAccessibleChild('empty')
        expect(firstChild).toBeNull()
    })

    it('should return null for non-existent route', async () => {
        const firstChild = await router.findFirstAccessibleChild('nonexistent')
        expect(firstChild).toBeNull()
    })

    describe('navigation integration', () => {
        it('should redirect to first accessible child during navigation', (done) => {
            router.navigate('app', {}, (err, state) => {
                expect(err).toBeNull()
                expect(state.name).toBe('app.dashboard')
                expect(state.path).toBe('/app/dashboard')
                done()
            })
        })

        it('should skip inaccessible children and redirect to first accessible one', (done) => {
            router.navigate('admin', {}, (err, state) => {
                expect(err).toBeNull()
                expect(state.name).toBe('admin.reports')
                expect(state.path).toBe('/admin/reports')
                done()
            })
        })

        it('should redirect to not found when no accessible children exist', (done) => {
            router.navigate('protected', {}, (err, state) => {
                expect(err).toBeNull()
                expect(state.name).toBe(constants.UNKNOWN_ROUTE)
                done()
            })
        })

        it('should redirect to not found when no children exist', (done) => {
            router.navigate('empty', {}, (err, state) => {
                expect(err).toBeNull()
                expect(state.name).toBe(constants.UNKNOWN_ROUTE)
                done()
            })
        })

        it('should preserve parameters during redirection', (done) => {
            const routesWithParams = [
                {
                    name: 'users',
                    path: '/users/:type',
                    redirectToFirstAllowNode: true,
                    children: [
                        { name: 'verylongname', path: '/verylongname' },  // Longer than 'second'
                        { name: 'second', path: '/second' }
                    ]
                }
            ]

            const paramRouter = createRouter(routesWithParams)
            paramRouter.start()

            paramRouter.navigate('users', { type: 'admin' }, (err, state) => {
                expect(err).toBeNull()
                expect(state).toBeDefined()
                expect(state!.name).toBe('users.verylongname')
                expect(state!.params.type).toBe('admin')
                expect(state!.path).toBe('/users/admin/verylongname')
                paramRouter.stop()
                done()
            })
        })
    })
})

describe('redirectToFirstAllowNode - Nested Redirection', function() {
    let nestedRouter;

    beforeAll(() => {
        const routes = [
            {
                name: 'parent',
                path: '/parent',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'child',
                        path: '/child',
                        redirectToFirstAllowNode: true,
                        canActivate: () => (_toState, _fromState, done) => {
                            done(); // Should be accessible
                        },
                        children: [
                            { 
                                name: 'grandchild',
                                path: '/grandchild',
                                canActivate: () => (_toState, _fromState, done) => {
                                    done(); // Should be accessible
                                }
                            }
                        ]
                    },
                    {
                        name: 'otherchild',
                        path: '/otherchild',
                        canActivate: () => (_toState, _fromState, done) => {
                            done(new Error('otherchild should not be activated')); // Should NOT be accessible
                        }
                    }
                ]
            }
        ];
        nestedRouter = createRouter(routes, { allowNotFound: true });
        nestedRouter.start();
    });

    afterAll(() => {
        nestedRouter.stop();
    });

    it('should redirect to the grandchild when parent and child have redirectToFirstAllowNode', (done) => {
        nestedRouter.navigate('parent', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state).toBeDefined();
            expect(state!.name).toBe('parent.child.grandchild');
            expect(state!.path).toBe('/parent/child/grandchild');
            done();
        });
    });
});

describe('redirectToFirstAllowNode - Interaction with defaultRoute', function() {
    let defaultRouter;

    beforeAll(() => {
        const routes = [
            {
                name: 'home',
                path: '/home',
                redirectToFirstAllowNode: true, // Home itself can redirect
                children: [
                    { name: 'welcome', path: '/welcome' }
                ]
            },
            {
                name: 'testDefault',
                path: '/test-default',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'inaccessible',
                        path: '/inaccessible',
                        canActivate: () => (_toState, _fromState, done) => done(new Error('Inaccessible'))
                    }
                ]
            },
            { name: 'login', path: '/login' } // Another route for reference
        ];
        defaultRouter = createRouter(routes, {
            allowNotFound: false, // To ensure defaultRoute is triggered
            defaultRoute: 'home'
        });
        defaultRouter.start();
    });

    afterAll(() => {
        defaultRouter.stop();
    });

    it('should redirect to defaultRoute, then to defaultRoute\'s first child if applicable', (done) => {
        defaultRouter.navigate('testDefault', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state).toBeDefined();
            // It should end up on home.welcome because:
            // 1. testDefault -> no accessible children -> redirects to defaultRoute (home)
            // 2. home has redirectToFirstAllowNode -> redirects to its first child (welcome)
            expect(state!.name).toBe('home.welcome');
            expect(state!.path).toBe('/home/welcome');
            done();
        });
    });

    it('should redirect to defaultRoute if it has no further redirects or children', (done) => {
        const routesNoWelcome = [
             {
                name: 'home',
                path: '/home' // No redirectToFirstAllowNode, no children
            },
            {
                name: 'testDefaultOnly',
                path: '/test-default-only',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'inaccessible2',
                        path: '/inaccessible2',
                        canActivate: () => (_toState, _fromState, done) => done(new Error('Inaccessible2'))
                    }
                ]
            }
        ];
        const routerWithPlainDefault = createRouter(routesNoWelcome, {
            allowNotFound: false,
            defaultRoute: 'home'
        });
        routerWithPlainDefault.start();

        routerWithPlainDefault.navigate('testDefaultOnly', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state).toBeDefined();
            expect(state!.name).toBe('home');
            expect(state!.path).toBe('/home');
            routerWithPlainDefault.stop();
            done();
        });
    });
});

describe('redirectToFirstAllowNode - Asynchronous canActivate', function() {
    let asyncRouter;

    beforeAll(() => {
        const routesSimpleAsync = [
            {
                name: 'asyncParentSimple',
                path: '/async-parent-simple',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'childSlowActivateOnly',
                        path: '/activate-first',
                        canActivate: () => (_toState, _fromState, done) => {
                            setTimeout(() => {
                                done();
                            }, 150);
                        }
                    },
                    {
                        name: 'childFinalSimple',
                        path: '/final-simple' 
                    }
                ]
            }
        ];
        asyncRouter = createRouter(routesSimpleAsync, { allowNotFound: true });
        asyncRouter.start();
    });

    afterAll(() => {
        asyncRouter.stop();
    });

    it('should wait for a single async canActivate and redirect', (done) => {
        asyncRouter.navigate('asyncParentSimple', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state).toBeDefined();
            expect(state!.name).toBe('asyncParentSimple.childSlowActivateOnly');
            expect(state!.path).toBe('/async-parent-simple/activate-first');
            done();
        });
    }, 10000);

    it('should skip to next child if async canActivate fails, then pick first accessible', (done) => {
        const routesReordered = [
            {
                name: 'asyncParentReordered',
                path: '/async-parent-reordered',
                redirectToFirstAllowNode: true,
                children: [
                     {
                        name: 'childQuickRejectFirst',
                        path: '/quick-reject-first',
                        canActivate: () => (_toState, _fromState, done) => {
                            done(new Error('Quickly rejected first'));
                        }
                    },
                    {
                        name: 'childSlowActivateNext',
                        path: '/slow-next-long-path',
                        canActivate: () => (_toState, _fromState, done) => {
                            setTimeout(() => {
                                done();
                            }, 50);
                        }
                    },
                    {
                        name: 'childFinalNext',
                        path: '/final-next'
                    }
                ]
            }
        ];
        const reorderedRouter = createRouter(routesReordered, { allowNotFound: true });
        reorderedRouter.start();

        reorderedRouter.navigate('asyncParentReordered', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state).toBeDefined();
            expect(state!.name).toBe('asyncParentReordered.childSlowActivateNext');
            expect(state!.path).toBe('/async-parent-reordered/slow-next-long-path');
            reorderedRouter.stop();
            done();
        });
    });
}); 