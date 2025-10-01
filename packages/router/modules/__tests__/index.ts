import createRouter from '../'
import { RouteNode } from '../lib/route-node'
import { constants } from '../constants'
import { createTestRouter } from './helpers'

describe('router', () => {
    describe('createRouter', () => {
        it('should not throw', () => {
            expect(() => createRouter()).not.toThrow()
        })

        describe('with routes', () => {
            it('should accept a flat list of nested routes', () => {
                const router = createRouter([
                    {
                        name: 'home',
                        path: '/home'
                    },
                    {
                        name: 'home.dashboard',
                        path: '/dashboard'
                    },
                    {
                        name: 'home.notifications',
                        path: '/notifications'
                    }
                ])

                expect(router.buildPath('home')).toBe('/home')
                expect(router.buildPath('home.dashboard')).toBe(
                    '/home/dashboard'
                )
                expect(router.buildPath('home.notifications')).toBe(
                    '/home/notifications'
                )
            })

            it('should accept a list of routes with children', () => {
                const router = createRouter([
                    {
                        name: 'home',
                        path: '/home',
                        children: [
                            {
                                name: 'dashboard',
                                path: '/dashboard'
                            },
                            {
                                name: 'notifications',
                                path: '/notifications'
                            }
                        ]
                    }
                ])

                expect(router.buildPath('home')).toBe('/home')
                expect(router.buildPath('home.dashboard')).toBe(
                    '/home/dashboard'
                )
                expect(router.buildPath('home.notifications')).toBe(
                    '/home/notifications'
                )
            })

            it('should accept a RouteNode', () => {
                const rootNode = new RouteNode('', '', [
                    new RouteNode('home', '/home', [
                        new RouteNode('dashboard', '/dashboard'),
                        new RouteNode('notifications', '/notifications')
                    ])
                ])
                const router = createRouter(rootNode)

                expect(router.buildPath('home')).toBe('/home')
                expect(router.buildPath('home.dashboard')).toBe(
                    '/home/dashboard'
                )
                expect(router.buildPath('home.notifications')).toBe(
                    '/home/notifications'
                )
            })

            it('should process route properties via onRouteAdded during router creation', () => {
                const canActivateFn = jest.fn();
                const canDeactivateFn = jest.fn();
                const decodeParamsFn = jest.fn(params => params);
                const encodeParamsFn = jest.fn(params => params);
                const defaultParamsObj = { sort: 'asc' };

                const routes = [
                    {
                        name: 'test',
                        path: '/test',
                        canActivate: canActivateFn,
                        canDeactivate: canDeactivateFn,
                        forwardTo: 'forwardedTest',
                        decodeParams: decodeParamsFn,
                        encodeParams: encodeParamsFn,
                        defaultParams: defaultParamsObj
                    },
                    {
                        name: 'forwardedTest',
                        path: '/fwd'
                    }
                ];
                const router = createRouter(routes);

                expect(router.config.forwardMap['test']).toBe('forwardedTest');
                expect(router.config.decoders['test']).toBe(decodeParamsFn);
                router.config.decoders['test']({ id: '123' });
                expect(decodeParamsFn).toHaveBeenCalledWith({ id: '123' });

                expect(router.config.encoders['test']).toBe(encodeParamsFn);
                router.config.encoders['test']({ id: '456' });
                expect(encodeParamsFn).toHaveBeenCalledWith({ id: '456' });

                expect(router.config.defaultParams['test']).toEqual(defaultParamsObj);
            });
        })

        describe('with options', () => {
            it('should have default options', () => {
                const router = createRouter([], {}, { store: {} })

                expect(router.getDependencies()).toEqual({
                    store: {}
                })
            })

            it('should accept dependencies', () => {
                const router = createRouter([], {}, { store: {} })

                expect(router.getDependencies()).toEqual({
                    store: {}
                })
            })
        })
    })
})

describe('Dependency management', () => {
    it('should allow setting and getting a single dependency', () => {
        const router = createRouter();
        const myService = { getData: () => 'data' };

        router.setDependency('service', myService);
        const deps = router.getDependencies() as any;

        expect(deps.service).toBe(myService);
        expect(deps.service.getData()).toBe('data');
    });

    it('should allow setting and getting multiple dependencies via setDependencies', () => {
        const router = createRouter();
        const service1 = { name: 'service1' };
        const service2 = { name: 'service2' };

        router.setDependencies({ service1, service2 } as any);
        const deps = router.getDependencies() as any;

        expect(deps.service1).toBe(service1);
        expect(deps.service2).toBe(service2);
    });

    it('setDependencies should overwrite existing dependencies with the same name', () => {
        const initialService = { version: 1 };
        const newService = { version: 2 };
        const router = createRouter([], {}, { myService: initialService });

        router.setDependencies({ myService: newService });
        const deps = router.getDependencies();
        expect(deps.myService).toBe(newService);
        expect(deps.myService.version).toBe(2);
    });

    it('setDependency should overwrite an existing dependency with the same name', () => {
        const initialService = { version: 1 };
        const newService = { version: 2 };
        const router = createRouter([], {}, { myService: initialService });

        router.setDependency('myService', newService);
        const deps = router.getDependencies();
        expect(deps.myService).toBe(newService);
        expect(deps.myService.version).toBe(2);
    });

    it('setDependencies should allow adding new dependencies and not affect others', () => {
        const serviceA = { name: 'A' };
        const serviceB = { name: 'B' };
        const router = createRouter<any>([], {}, { serviceA });

        router.setDependencies({ serviceB });
        const deps = router.getDependencies();

        expect(deps.serviceA).toBe(serviceA);
        expect(deps.serviceB).toBe(serviceB);
        expect(deps.serviceC).toBeUndefined();
    });

    it('should execute a factory function with router and dependencies', () => {
        const mockFactory = jest.fn();
        const depService = { name: 'testService' };
        const router = createRouter<any>([], {}, { depService }); // Use <any> for simplicity with depService

        router.executeFactory(mockFactory);

        expect(mockFactory).toHaveBeenCalledTimes(1);
        // Check that mockFactory was called with router instance and dependencies object
        // router.getDependencies() returns dependencies object
        expect(mockFactory).toHaveBeenCalledWith(router, router.getDependencies());
        // Additionally check dependencies content if needed
        expect(router.getDependencies().depService).toBe(depService);
    });
})

describe('Router core API (forward, buildPath, matchPath, setRootPath)', () => {
    it('router.forward should register a forward rule', () => {
        const router = createRouter();
        router.forward('oldRoute', 'newRoute');
        expect(router.config.forwardMap['oldRoute']).toBe('newRoute');
    });

    it('router.buildPath should handle UNKNOWN_ROUTE', () => {
        const router = createRouter();
        const unknownPath = router.buildPath(constants.UNKNOWN_ROUTE, { path: '/some/unknown/path' });
        expect(unknownPath).toBe('/some/unknown/path');
    });

    it('router.matchPath should return null if no match is found', () => {
        const router = createRouter([{ name: 'home', path: '/home' }]);
        const match = router.matchPath('/nonexistent');
        expect(match).toBeNull();
    });

    it('router.matchPath should decode, forward, and build path correctly on match', () => {
        const decodeParamsFn = jest.fn(params => ({ ...params, decoded: true }));
        const routes = [
            { name: 'user', path: '/user/:id/', decodeParams: decodeParamsFn, forwardTo: 'user.profile' },
            { name: 'user.profile', path: 'profile/:id' }
        ];

        const router1 = createRouter(routes, { trailingSlashMode: 'never' });
        const match1 = router1.matchPath('/user/123/');

        expect(match1).toBeDefined();
        if (match1) {
            expect(match1.name).toBe('user.profile');
            expect(match1.params).toEqual({ id: '123', decoded: true });
            expect(decodeParamsFn).toHaveBeenCalledWith({ id: '123' });
            expect(match1.path).toBe('/user/123/profile/123');
        }

        const router2 = createRouter(routes, { trailingSlashMode: 'never', rewritePathOnMatch: false });
        const match2 = router2.matchPath('/user/123/');

        expect(match2).toBeDefined();
        if (match2) {
            expect(match2.name).toBe('user.profile');
            expect(match2.params).toEqual({ id: '123', decoded: true });
            expect(match2.path).toBe('/user/123/');
        }
    });

    it('router.setRootPath should update the root path for building and matching', () => {
        const routes = [{ name: 'home', path: '/home' }];
        const router = createRouter(routes);

        expect(router.buildPath('home', {})).toBe('/home');
        let match = router.matchPath('/home');
        expect(match).toBeDefined();
        if (match) expect(match.name).toBe('home');

        router.setRootPath('/app');

        expect(router.buildPath('home', {})).toBe('/app/home');
        match = router.matchPath('/app/home');
        expect(match).toBeDefined();
        if (match) expect(match.name).toBe('home');

        match = router.matchPath('/home');
        expect(match).toBeNull();
    });

    /*
    it('buildPath should correctly build path for a child node with absolute path', () => {
        const routes = [
            { name: 'user', path: '/user/:id' },
            { name: 'user.profile', path: '/profile/:idVal' } 
        ];
        const router = createRouter(routes, { trailingSlashMode: 'never' });

        const builtPath = router.buildPath('user.profile', { idVal: '456' });
        expect(builtPath).toBe('/profile/456');
    });
    */
})

describe('Dynamic route definition (add, addNode)', () => {
    it('router.add should add a single flat route or a single tree', () => {
        const router = createRouter();
        const canActivateFn1 = jest.fn();

        // Add a single flat route (as object)
        router.add({ name: 'dynamic1', path: '/dynamic1', canActivate: canActivateFn1 });
        expect(router.buildPath('dynamic1', {})).toBe('/dynamic1');

        // Add a single tree (as object)
        const canActivateFn2 = jest.fn();
        const decodeParamsFn2 = jest.fn(params => params);
        router.add({
            name: 'parentDyn',
            path: '/parentdyn',
            canActivate: canActivateFn2,
            children: [
                { name: 'child', path: '/child/:id', decodeParams: decodeParamsFn2 }
            ]
        });
        expect(router.buildPath('parentDyn.child', { id: 1 })).toBe('/parentdyn/child/1');
        expect(router.config.decoders['parentDyn.child']).toBe(decodeParamsFn2);
    });

    it('router.add should add an array of flat routes', () => {
        const router = createRouter();
        router.add([
            { name: 'flat1', path: '/flat1' },
            { name: 'flat2', path: '/flat2' }
        ]);
        expect(router.buildPath('flat1', {})).toBe('/flat1');
        expect(router.buildPath('flat2', {})).toBe('/flat2');
    });

    it('router.addNode should add a single node', () => {
        const router = createRouter();
        router.addNode('parent', '/parent');
        router.addNode('parent.child', '/child');
        expect(router.buildPath('parent.child', {})).toBe('/parent/child');
    });

    it('router.addNode should register canActivate handler if provided', () => {
        const router = createRouter();
        router.addNode('testactivate', '/testactivate', jest.fn());
        expect(router.buildPath('testactivate', {})).toBe('/testactivate');
    });

    it('router.add with finalSort=true should sort and can add a new flat route', () => {
        const router = createRouter();
        router.add({ name: 'routeA', path: '/a' }, false); // Add without sorting

        const rootSortSpy = jest.spyOn(router.rootNode, 'sortDescendants');

        router.add({ name: 'routeB', path: '/b' }, true); // Add new + sorting

        expect(rootSortSpy).toHaveBeenCalledTimes(1);
        expect(router.buildPath('routeB', {})).toBe('/b');
        rootSortSpy.mockRestore();
    });

    it('router.add with finalSort=true and no new routes should just sort', () => {
        const router = createRouter();
        router.add({ name: 'routeA', path: '/a' }); // Add without sorting

        const rootSortSpy = jest.spyOn(router.rootNode, 'sortDescendants');
        router.add(undefined as any, true); // Only sorting

        expect(rootSortSpy).toHaveBeenCalledTimes(1);
        rootSortSpy.mockRestore();
    });
});

// Tests for composite route names
describe('Composite route names', () => {
    it('should correctly handle child routes with names including parent name', () => {
        const router = createRouter([
            {
                name: 'home',
                path: '/home',
                children: [
                    {
                        name: 'home.welcome', // Composite name
                        path: '/welcome'
                    }
                ]
            }
        ]);

        expect(router.buildPath('home')).toBe('/home');
        expect(router.buildPath('home.welcome')).toBe('/home/welcome');
    });

    it('should correctly build paths for routes with composite names', () => {
        const router = createRouter([
            {
                name: 'user',
                path: '/user/:userId',
                children: [
                    {
                        name: 'user.profile', // Composite name
                        path: '/profile/:tab?'
                    },
                    {
                        name: 'user.settings', // Composite name
                        path: '/settings/:section?'
                    }
                ]
            }
        ]);

        expect(router.buildPath('user.profile', { userId: '123', tab: 'info' })).toBe('/user/123/profile/info');
        expect(router.buildPath('user.settings', { userId: '456', section: 'privacy' })).toBe('/user/456/settings/privacy');
    });

    it('should correctly handle parameters for routes with composite names', () => {
        const routes = [
            {
                name: 'user',
                path: '/user/:userId',
                children: [
                    {
                        name: 'user.profile', // Composite name
                        path: '/profile/:tab?'
                    },
                    {
                        name: 'user.settings', // Composite name
                        path: '/settings/:section?'
                    }
                ]
            }
        ];

        const router = createRouter(routes);

        // Check path building with parameters
        expect(router.buildPath('user.profile', { userId: '123', tab: 'info' })).toBe('/user/123/profile/info');
        expect(router.buildPath('user.settings', { userId: '456', section: 'privacy' })).toBe('/user/456/settings/privacy');
    });
});

describe('Segment addition variations', () => {
    it('should throw when adding composite name without existing parent (addNode)', () => {
        const router = createRouter();
        expect(() => router.addNode('p2.child', '/child')).toThrow(/parent segment 'p2' is missing/);
    });

    it('should support adding composite name after adding parent (add)', () => {
        const router = createRouter();
        router.add({ name: 'p', path: '/p' });
        router.add({ name: 'p.child', path: '/child' });
        expect(router.buildPath('p.child', {})).toBe('/p/child');
    });

    it('should support composite names on multiple levels within children', () => {
        const router = createRouter([
            {
                name: 'root',
                path: '/root',
                children: [
                    {
                        name: 'root.child',
                        path: '/child',
                        children: [
                            { name: 'root.child.grand', path: '/grand' }
                        ]
                    }
                ]
            }
        ]);

        expect(router.buildPath('root.child.grand', {})).toBe('/root/child/grand');
    });

    it('should support nested composite segment within compose-branch (child.grand)', () => {
        const router = createRouter([
            {
                name: 'root',
                path: '/root',
                children: [
                    {
                        name: 'root.child',
                        path: '/child',
                        children: [
                            { name: 'child.grand', path: '/grand' }
                        ]
                    }
                ]
            }
        ]);

        expect(router.buildPath('root.child.grand', {})).toBe('/root/child/grand');
    });

    it('should allow mixing simple and composite names in children of one node', () => {
        const router = createRouter([
            {
                name: 'mix',
                path: '/mix',
                children: [
                    { name: 'item', path: '/item' },
                    { name: 'mix.extra', path: '/extra' }
                ]
            }
        ]);

        expect(router.buildPath('mix.item', {})).toBe('/mix/item');
        expect(router.buildPath('mix.extra', {})).toBe('/mix/extra');
    });

    it('should throw when attempting to add two children with same path at same level', () => {
        const router = createRouter([{ name: 'dup', path: '/dup' }]);
        expect(() =>
            router.add([
                { name: 'dup.a', path: '/same' },
                { name: 'dup.b', path: '/same' }
            ])
        ).toThrow();
    });

    it('should throw in flat array if child comes before parent', () => {
        expect(() =>
            createRouter([
                { name: 'a.b', path: '/b' },
                { name: 'a', path: '/a' }
            ])
        ).toThrow();
    });

    it('should support adding RouteNode instance with composite name when parent exists', () => {
        const router = createRouter([{ name: 'p', path: '/p' }]);
        const node = new RouteNode('p.x', '/x');
        router.add(node);
        expect(router.buildPath('p.x', {})).toBe('/p/x');
    });
});

// New describe block for state functions
describe('Router state functions', () => {

    let router;

    beforeEach(() => (router = createTestRouter().start()));
    afterEach(() => router.stop());

    it('router.makeNotFoundState should create a correct NOT_FOUND state', () => {
        const path = '/some/nonexistent/path';
        const options = { custom: 'option' };
        const notFoundState = router.makeNotFoundState(path, options);

        expect(notFoundState.name).toBe(constants.UNKNOWN_ROUTE);
        expect(notFoundState.params).toEqual({ path });
        expect(notFoundState.path).toBe(path);
        expect(notFoundState.meta).toBeDefined();
        if (notFoundState.meta) {
            expect(notFoundState.meta.options).toEqual(options);
            expect(typeof notFoundState.meta.id).toBe('number');
        }
    });

    it('should correctly compare states with no URL params when ignoring query params', () => {
        const state1 = { name: 'users.list', params: { sort: 'asc' } };
        const state2 = { name: 'users.list', params: { filter: 'active' } };
        expect(router.areStatesEqual(state1, state2, true)).toBe(true);

        const state3 = { name: 'users.list', params: {} };
        expect(router.areStatesEqual(state1, state3, true)).toBe(true);
    });

    it('should return false if path params differ when ignoring query params', () => {
        const state1 = { name: 'users.view', params: { id: 1, filter: 'a' } };
        const state2 = { name: 'users.view', params: { id: 2, filter: 'b' } };
        expect(router.areStatesEqual(state1, state2, true)).toBe(false);
    });
})

describe('areStatesEqual', () => {
    let router;

    beforeAll(() => (router = createTestRouter().start()));
    afterAll(() => router.stop());

    it('should return true if states are identical', () => {
        const state1 = { name: 'users.view', params: { id: 1 } };
        const state2 = { name: 'users.view', params: { id: 1 } };
        expect(router.areStatesEqual(state1, state2)).toBe(true);
    });

    it('should return false if states have different names', () => {
        const state1 = { name: 'users.view', params: { id: 1 } };
        const state2 = { name: 'users.list', params: { id: 1 } };
        expect(router.areStatesEqual(state1, state2)).toBe(false);
    });

    it('should return false if states have different params', () => {
        const state1 = { name: 'users.view', params: { id: 1 } };
        const state2 = { name: 'users.view', params: { id: 2 } };
        expect(router.areStatesEqual(state1, state2)).toBe(false);
    });

    it('should correctly compare states ignoring query parameters', () => {
        const state1 = { name: 'users.view', params: { id: 1, tab: 'profile' } };
        const state2 = { name: 'users.view', params: { id: 1, sort: 'asc' } };
        expect(router.areStatesEqual(state1, state2)).toBe(true); // ignoreQueryParams is true by default

        const state3 = { name: 'users.view', params: { id: 2, tab: 'profile' } };
        expect(router.areStatesEqual(state1, state3)).toBe(false);
    });

    it('should correctly compare states with query parameters (strict)', () => {
        const state1 = { name: 'users.view', params: { id: 1, tab: 'profile' } };
        const state2 = { name: 'users.view', params: { id: 1, tab: 'profile' } };
        expect(router.areStatesEqual(state1, state2, false)).toBe(true);

        const state3 = { name: 'users.view', params: { id: 1, tab: 'settings' } };
        expect(router.areStatesEqual(state1, state3, false)).toBe(false);

        const stateMissingQuery = { name: 'users.view', params: { id: 1 } };
        expect(router.areStatesEqual(state1, stateMissingQuery, false)).toBe(false);
        expect(router.areStatesEqual(stateMissingQuery, state1, false)).toBe(false);

        const stateExtraQuery = { name: 'users.view', params: { id: 1, tab: 'profile', filter: 'true' } };
        expect(router.areStatesEqual(state1, stateExtraQuery, false)).toBe(false);
        expect(router.areStatesEqual(stateExtraQuery, state1, false)).toBe(false);

        const stateValidPath = { name: 'users.view', params: { id: '1' } };
        expect(router.areStatesEqual(stateValidPath, stateExtraQuery, false)).toBe(false);
    });

    // New tests:
    it('should correctly compare states with no URL params when ignoring query params', () => {
        const state1 = { name: 'users.list', params: { sort: 'asc' } }; // users.list has no URL params
        const state2 = { name: 'users.list', params: { filter: 'active' } };
        // getUrlParams will return [], state1Params.length and state2Params.length will be 0
        // Comparison will resolve to true since there are no common url params to compare values
        expect(router.areStatesEqual(state1, state2, true)).toBe(true);

        const state3 = { name: 'users.list', params: {} };
        expect(router.areStatesEqual(state1, state3, true)).toBe(true);
    });

    it('should return false if path params differ when ignoring query params', () => {
        const state1 = { name: 'users.view', params: { id: 1, filter: 'a' } }; // urlParam: id
        const state2 = { name: 'users.view', params: { id: 2, filter: 'b' } }; // urlParam: id
        // When ignoreQueryParams=true, params.id will be compared
        expect(router.areStatesEqual(state1, state2, true)).toBe(false);
    });
});
