import createRouter from '../../createRouter';
import { Route, Router } from '../../types/router';
import { errorCodes } from '../../constants';

describe('Router.removeNode', () => {
    let router: Router<any>;

    const routes: Route<any>[] = [
        { name: 'home', path: '/' },
        {
            name: 'users',
            path: '/users',
            canActivate: jest.fn(),
            onEnterNode: jest.fn(),
            children: [
                { 
                    name: 'list', 
                    path: '/list', 
                    canActivate: jest.fn(), 
                    onEnterNode: jest.fn(),
                    browserTitle: 'User List' 
                },
                {
                    name: 'profile',
                    path: '/:id',
                    canActivate: jest.fn(),
                    onEnterNode: jest.fn(),
                    children: [
                        { name: 'view', path: '/view', canActivate: jest.fn(), onEnterNode: jest.fn() },
                        { name: 'edit', path: '/edit', canActivate: jest.fn(), onEnterNode: jest.fn() },
                    ],
                },
            ],
        },
        { name: 'about', path: '/about', onEnterNode: jest.fn() },
    ];

    beforeEach(() => {
        router = createRouter(routes.map(r => ({ ...r }))); // Use spread to avoid modifying original routes array for each test
        router.start();
    });

    it('should remove a top-level node', () => {
        router.removeNode('about');
        expect(() => router.buildPath('about', {})).toThrow();
        router.navigate('about', {}, (err) => {
            expect(err.code).toBe(errorCodes.ROUTE_NOT_FOUND);
        });
        expect(router.getRouteLifecycleFunctions().onEnterNode.about).toBeUndefined();
    });

    it('should remove a nested node', () => {
        router.removeNode('users.list');
        expect(() => router.buildPath('users.list', {})).toThrow();
        router.navigate('users.list', {}, (err) => {
            expect(err.code).toBe(errorCodes.ROUTE_NOT_FOUND);
        });
        const [userListCanActivate] = router.getLifecycleFunctions();
        expect(userListCanActivate['users.list']).toBeUndefined();
        expect(router.getRouteLifecycleFunctions().onEnterNode['users.list']).toBeUndefined();
        expect(router.getBrowserTitleFunctions()['users.list']).toBeUndefined();

        // Parent should still exist
        expect(router.buildPath('users', {})).toBe('/users');
    });

    it('should remove a node and its descendants', () => {
        router.removeNode('users');
        expect(() => router.buildPath('users', {})).toThrow();
        expect(() => router.buildPath('users.list', {})).toThrow();
        expect(() => router.buildPath('users.profile', { id: '1' })).toThrow();
        expect(() => router.buildPath('users.profile.view', { id: '1' })).toThrow();

        router.navigate('users', {}, (err) => {
            expect(err.code).toBe(errorCodes.ROUTE_NOT_FOUND);
        });
        router.navigate('users.list', {}, (err) => {
            expect(err.code).toBe(errorCodes.ROUTE_NOT_FOUND);
        });

        const [canActivateFns] = router.getLifecycleFunctions();
        expect(canActivateFns.users).toBeUndefined();
        expect(canActivateFns['users.list']).toBeUndefined();
        expect(canActivateFns['users.profile']).toBeUndefined();
        expect(canActivateFns['users.profile.view']).toBeUndefined();
        
        const onEnterNodeFns = router.getRouteLifecycleFunctions().onEnterNode;
        expect(onEnterNodeFns.users).toBeUndefined();
        expect(onEnterNodeFns['users.list']).toBeUndefined();
        expect(onEnterNodeFns['users.profile']).toBeUndefined();
        expect(onEnterNodeFns['users.profile.view']).toBeUndefined();
    });

    it('should not throw when trying to remove a non-existent node', () => {
        expect(() => router.removeNode('nonexistent')).not.toThrow();
        expect(() => router.removeNode('users.nonexistent')).not.toThrow();
    });

    it('should correctly clear forwardTo references if the removed node was a target', () => {
        router.add({ name: 'legacy', path: '/legacy', forwardTo: 'users.list' });
        router.removeNode('users.list');
        expect(router.config.forwardMap.legacy).toBeUndefined();
    });

    it('should correctly clear forwardTo references if the removed node was a source', () => {
        router.add({ name: 'anotherLegacy', path: '/another-legacy', forwardTo: 'home' });
        router.removeNode('anotherLegacy');
        expect(router.config.forwardMap.anotherLegacy).toBeUndefined();
    });

    it('should clear redirectToFirstAllowNodeMap for the removed node', () => {
        router.add({ name: 'parentRedirect', path: '/parent-redirect', redirectToFirstAllowNode: true, children: [{name: 'child', path: '/child'}] });
        // Ensure the map exists before accessing it
        expect(router.config.redirectToFirstAllowNodeMap && router.config.redirectToFirstAllowNodeMap.parentRedirect).toBe(true);
        router.removeNode('parentRedirect');
        // After removal, the specific entry should be gone. The map itself might still exist if other entries are present.
        expect(router.config.redirectToFirstAllowNodeMap && router.config.redirectToFirstAllowNodeMap.parentRedirect).toBeUndefined();
    });
}); 