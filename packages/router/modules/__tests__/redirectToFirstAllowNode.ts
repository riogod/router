import { errorCodes, constants } from '../'
import { createTestRouter, omitMeta } from './helpers'
import createRouter from '../createRouter'
import { findFirstAccessibleChildAtPath } from '../core/routes'

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
        const firstChild = await findFirstAccessibleChildAtPath(router, 'app')
        expect(firstChild).toBe('app.dashboard')
    })

    it('should skip inaccessible children and find first accessible one', async () => {
        const firstChild = await findFirstAccessibleChildAtPath(router, 'admin')
        expect(firstChild).toBe('admin.reports')
    })

    it('should return null if no accessible children found', async () => {
        const firstChild = await findFirstAccessibleChildAtPath(router, 'protected')
        expect(firstChild).toBeNull()
    })

    it('should return null if no children exist', async () => {
        const firstChild = await findFirstAccessibleChildAtPath(router, 'empty')
        expect(firstChild).toBeNull()
    })

    it('should return null for non-existent route', async () => {
        const firstChild = await findFirstAccessibleChildAtPath(router, 'nonexistent')
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

describe('redirectToFirstAllowNode - Deeply Nested Scenarios', function() {
    let deepRouter;

    // Helper to create router with specific routes for this describe block
    const createDeepTestRouter = (routesConfig, options = {}) => {
        const router = createRouter(routesConfig, { allowNotFound: true, ...options });
        router.start();
        return router;
    };

    afterEach(() => {
        if (deepRouter) {
            deepRouter.stop();
            deepRouter = null;
        }
    });

    it('1. should navigate through multiple levels of redirectToFirstAllowNode', (done) => {
        const routes = [
            {
                name: 'level1',
                path: '/level1',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'level2',
                        path: '/level2',
                        redirectToFirstAllowNode: true,
                        children: [
                            {
                                name: 'level3',
                                path: '/level3',
                                redirectToFirstAllowNode: true,
                                children: [
                                    { name: 'level4', path: '/level4' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes);
        deepRouter.navigate('level1', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state?.name).toBe('level1.level2.level3.level4');
            expect(state?.path).toBe('/level1/level2/level3/level4');
            done();
        });
    });

    it('2. should stop at first level where canActivate fails in deep chain', (done) => {
        const routes = [
            {
                name: 'l1',
                path: '/l1',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'l2',
                        path: '/l2', // Accessible
                        redirectToFirstAllowNode: true,
                        children: [
                            {
                                name: 'l3_fail',
                                path: '/l3_fail_first', // Path to ensure it's considered first by sortChildren
                                redirectToFirstAllowNode: true,
                                canActivate: () => (_t, _f, cb) => cb(new Error('L3 Fails')),
                                children: [
                                    { name: 'l4_after_fail', path: '/l4_after_fail' }
                                ]
                            },
                            {
                                name: 'l3_ok_after_fail_path',
                                path: '/l3_ok_path_second' // Path to ensure it's considered second
                            }
                        ]
                    },
                     {
                        name: 'l2_alt',
                        path: '/l2_alt_longer_path', // Alternative path, make it longer so it's sorted after l2
                        redirectToFirstAllowNode: true,
                        children: [
                            { name: 'l3_alt', path: '/l3_alt'}
                        ]
                    }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes);
        deepRouter.navigate('l1', {}, (err, state) => {
            expect(err).toBeNull();
            // l1 redirects. Tries l1.l2.
            // l1.l2 redirects. Tries l1.l2.l3_fail (fails canActivate).
            // Then tries l1.l2.l3_ok_after_fail_path (accessible, no further redirect).
            // So, it should end up on l1.l2.l3_ok_after_fail_path.
            expect(state?.name).toBe('l1.l2.l3_ok_after_fail_path');
            expect(state?.path).toBe('/l1/l2/l3_ok_path_second');
            done();
        });
    });

    it('3. should stop at last accessible node if deepest canActivate fails', (done) => {
        const routes = [
            {
                name: 'p1',
                path: '/p1',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'c1',
                        path: '/c1',
                        redirectToFirstAllowNode: true,
                        children: [
                            {
                                name: 'gc1',
                                path: '/gc1',
                                redirectToFirstAllowNode: true,
                                children: [
                                    {
                                        name: 'ggc1_fail',
                                        path: '/ggc1_fail',
                                        canActivate: () => (_t, _f, cb) => cb(new Error('GGC1 Fails'))
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes);
        deepRouter.navigate('p1', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state.name).toBe(constants.UNKNOWN_ROUTE)
            done();
        });
    });

    it('4. redirect on first and last, but not intermediate nodes', (done) => {
        const routes = [
            {
                name: 'first_redirect',
                path: '/first_redirect',
                redirectToFirstAllowNode: true, // Redirects
                children: [
                    {
                        name: 'no_redirect1',
                        path: '/no_redirect1', // No redirect
                        children: [
                            {
                                name: 'no_redirect2',
                                path: '/no_redirect2', // No redirect
                                children: [
                                    {
                                        name: 'last_redirect',
                                        path: '/last_redirect',
                                        redirectToFirstAllowNode: true, // Redirects
                                        children: [
                                            { name: 'final_child', path: '/final_child' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes);
        // Navigate to a node that itself redirects, but whose target does not immediately redirect further up the chain.
        deepRouter.navigate('first_redirect', {}, (err, state) => {
            expect(err).toBeNull();
            // first_redirect -> no_redirect1. no_redirect1 doesn't redirect.
            // If we navigated to first_redirect.no_redirect1.no_redirect2.last_redirect, it would then go to final_child
            expect(state?.name).toBe('first_redirect.no_redirect1');
            expect(state?.path).toBe('/first_redirect/no_redirect1');
            done();
        });
    });
    
    it('4.1. navigate to deeper node which then redirects', (done) => {
        const routes = [
            {
                name: 'first_redirect',
                path: '/first_redirect',
                redirectToFirstAllowNode: true, 
                children: [
                    {
                        name: 'no_redirect1',
                        path: '/no_redirect1', 
                        children: [
                            {
                                name: 'no_redirect2',
                                path: '/no_redirect2', 
                                children: [
                                    {
                                        name: 'last_redirect',
                                        path: '/last_redirect',
                                        redirectToFirstAllowNode: true, 
                                        children: [
                                            { name: 'final_child', path: '/final_child' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes);
        deepRouter.navigate('first_redirect.no_redirect1.no_redirect2.last_redirect', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state?.name).toBe('first_redirect.no_redirect1.no_redirect2.last_redirect.final_child');
            expect(state?.path).toBe('/first_redirect/no_redirect1/no_redirect2/last_redirect/final_child');
            done();
        });
    });

    it('5. try multiple parallel paths with one failing early', (done) => {
        const routes = [
            {
                name: 'multi_parent',
                path: '/multi_parent',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'branchA_fail',
                        path: '/branchA_fail', // Path to make it come first in sort order if needed
                        redirectToFirstAllowNode: true,
                        canActivate: () => (_t, _f, cb) => cb(new Error('Branch A Fails')),
                        children: [{ name: 'childA', path: '/childA' }]
                    },
                    {
                        name: 'branchB_ok',
                        path: '/branchB_ok',
                        redirectToFirstAllowNode: true,
                        children: [
                            { name: 'childB1', path: '/childB1' },
                            { name: 'childB2', path: '/childB2' }
                        ]
                    }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes);
        deepRouter.navigate('multi_parent', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state?.name).toBe('multi_parent.branchB_ok.childB1');
            expect(state?.path).toBe('/multi_parent/branchB_ok/childB1');
            done();
        });
    });

    it('6. redirect only on deepest node, not parents', (done) => {
        const routes = [
            {
                name: 'top_no_redirect',
                path: '/top_no_redirect',
                // No redirectToFirstAllowNode
                children: [
                    {
                        name: 'mid_no_redirect',
                        path: '/mid_no_redirect',
                        // No redirectToFirstAllowNode
                        children: [
                            {
                                name: 'deep_redirect',
                                path: '/deep_redirect',
                                redirectToFirstAllowNode: true, // Only this one redirects
                                children: [
                                    { name: 'final_deep_child', path: '/final_deep_child' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes);
        // Navigate directly to the node that has the redirect flag
        deepRouter.navigate('top_no_redirect.mid_no_redirect.deep_redirect', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state?.name).toBe('top_no_redirect.mid_no_redirect.deep_redirect.final_deep_child');
            expect(state?.path).toBe('/top_no_redirect/mid_no_redirect/deep_redirect/final_deep_child');
            done();
        });
    });

    it('7. preserve parameters through deep redirection', (done) => {
        const routes = [
            {
                name: 'param_l1',
                path: '/param_l1/:id',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'param_l2',
                        path: '/param_l2/:type',
                        redirectToFirstAllowNode: true,
                        children: [
                            { name: 'param_l3_final', path: '/param_l3_final' }
                        ]
                    }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes);
        deepRouter.navigate('param_l1', { id: '123', type: 'user' }, (err, state) => {
            expect(err).toBeNull();
            expect(state?.name).toBe('param_l1.param_l2.param_l3_final');
            expect(state?.params).toEqual({ id: '123', type: 'user' });
            expect(state?.path).toBe('/param_l1/123/param_l2/user/param_l3_final');
            done();
        });
    });

    it('8. deep redirect interacting with defaultRoute when all children fail', (done) => {
        const routes = [
            {
                name: 'deep_fail_parent',
                path: '/deep_fail_parent',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'deep_fail_child1',
                        path: '/c1_fail_activation',
                        canActivate: () => (_t, _f, cb) => cb(new Error('Fail 1')),
                        redirectToFirstAllowNode: true,
                        children: [{ name: 'target1', path: '/target1' }]
                    },
                    {
                        name: 'deep_fail_child2',
                        path: '/c2_fail_activation',
                        canActivate: () => (_t, _f, cb) => cb(new Error('Fail 2')),
                        children: [{ name: 'target2', path: '/target2' }]
                    }
                ]
            },
            {
                name: 'default_target_parent',
                path: '/default_target_parent',
                redirectToFirstAllowNode: true,
                children: [
                    { name: 'default_actual_child', path: '/actual_child' }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes, { defaultRoute: 'default_target_parent', allowNotFound: false });
        deepRouter.navigate('deep_fail_parent', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state?.name).toBe('default_target_parent.default_actual_child');
            expect(state?.path).toBe('/default_target_parent/actual_child');
            done();
        });
    });

    it('9. very deep redirection (5 levels) with all accessible', (done) => {
        const routes = [
            {
                name: 'vdeep1',
                path: '/vdeep1',
                redirectToFirstAllowNode: true,
                children: [
                    {
                        name: 'vdeep2',
                        path: '/vdeep2',
                        redirectToFirstAllowNode: true,
                        children: [
                            {
                                name: 'vdeep3',
                                path: '/vdeep3',
                                redirectToFirstAllowNode: true,
                                children: [
                                    {
                                        name: 'vdeep4',
                                        path: '/vdeep4',
                                        redirectToFirstAllowNode: true,
                                        children: [
                                            {
                                                name: 'vdeep5',
                                                path: '/vdeep5',
                                                redirectToFirstAllowNode: true,
                                                children: [
                                                    { name: 'vdeep6_final', path: '/vdeep6_final' }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
        deepRouter = createDeepTestRouter(routes);
        deepRouter.navigate('vdeep1', {}, (err, state) => {
            expect(err).toBeNull();
            expect(state?.name).toBe('vdeep1.vdeep2.vdeep3.vdeep4.vdeep5.vdeep6_final');
            expect(state?.path).toBe('/vdeep1/vdeep2/vdeep3/vdeep4/vdeep5/vdeep6_final');
            done();
        });
    }, 10000); // Increased timeout for very deep recursion potentially

    it('10. Deep redirect with sibling that is accessible but not first by sort order', (done) => {
        const routes = [
          {
            name: 'parentOrderTest',
            path: '/parent-order',
            redirectToFirstAllowNode: true,
            children: [
              {
                name: 'PathWithSpatParam',
                path: '/path-spat/:param/*spat',
                redirectToFirstAllowNode: true,
                children: [{ name: 'childOfSpat', path: '/child-of-spat' }]
              },
              {
                name: 'ShortPathNoParam',
                path: '/short',
                redirectToFirstAllowNode: true,
                children: [{ name: 'childOfShort', path: '/child-of-short' }]
              }
            ]
          }
        ];
        deepRouter = createDeepTestRouter(routes);
        deepRouter.navigate('parentOrderTest', {}, (err, state) => {
          expect(err).toBeNull();
          expect(state?.name).toBe('parentOrderTest.ShortPathNoParam.childOfShort');
          expect(state?.path).toBe('/parent-order/short/child-of-short');
          done();
        });
      });
}); 