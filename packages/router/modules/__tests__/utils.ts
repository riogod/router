import { createTestRouter, omitMeta } from './helpers'
import createRouter from '../'

describe('core/utils', () => {
    let router

    describe('with strictQueryParams', () => {
        beforeAll(() => (router = createTestRouter().start()))
        afterAll(() => router.stop())

        it('should expose RouteNode path building function', function() {
            expect(router.buildPath('users.list')).toBe('/users/list')
        })

        it('should tell if a route is active or not', function() {
            router.navigate('users.view', { id: 1 })
            expect(router.isActive('users.view', { id: 1 })).toBe(true)
            expect(router.isActive('users.view', { id: 2 })).toBe(false)
            expect(router.isActive('users.view')).toBe(false)
            expect(router.isActive('users')).toBe(true)
            expect(router.isActive('users', {}, true)).toBe(false)

            router.navigate('section.query', { section: 'section1' })
            expect(router.isActive('section', { section: 'section1' })).toBe(
                true
            )
            expect(
                router.isActive('section.query', {
                    section: 'section1',
                    param1: '123'
                })
            ).toBe(true)
            expect(
                router.isActive('section.query', { section: 'section2' })
            ).toBe(false)
            expect(
                router.isActive(
                    'section.query',
                    { section: 'section1', param2: '123' },
                    false,
                    false
                )
            ).toBe(false)
            expect(router.isActive('users.view', { id: 123 })).toBe(false)
        })

        it('should decode path params on match', () => {
            expect(omitMeta(router.matchPath('/encoded/hello/123'))).toEqual({
                name: 'withEncoder',
                params: {
                    one: 'hello',
                    two: '123'
                },
                path: '/encoded/hello/123'
            })
        })

        it('should match deep `/` routes', function() {
            router.setOption('trailingSlashMode', 'never')
            expect(omitMeta(router.matchPath('/profile'))).toEqual({
                name: 'profile.me',
                params: {},
                path: '/profile'
            })

            router.setOption('trailingSlashMode', 'always')
            expect(omitMeta(router.matchPath('/profile'))).toEqual({
                name: 'profile.me',
                params: {},
                path: '/profile/'
            })
        })
    })

    describe('without strict query params mode', () => {
        beforeAll(
            () =>
                (router = createTestRouter({
                    queryParamsMode: 'loose'
                }).start())
        )
        afterAll(() => router.stop())

        it('should build paths with extra parameters', () => {
            expect(
                router.buildPath('users.view', {
                    id: '123',
                    username: 'thomas'
                })
            ).toBe('/users/view/123?username=thomas')
        })
    })

    describe('with non default query params format', () => {
        beforeAll(() => {
            router = createRouter(
                [
                    {
                        name: 'query',
                        path: '/query?param1&param2'
                    }
                ],
                {
                    queryParamsMode: 'loose',
                    queryParams: {
                        booleanFormat: 'unicode'
                    }
                }
            )
        })
        afterAll(() => router.stop())

        it('should build paths', () => {
            expect(
                router.buildPath('query', {
                    param1: true,
                    param2: false
                })
            ).toBe('/query?param1=✓&param2=✗')
        })

        it('should match paths', () => {
            const match = router.matchPath('/query?param1=✓&param2=✗')

            expect(match.params).toEqual({
                param1: true,
                param2: false
            })
        })

        it('should match on start', () => {
            router.start('/query?param1=✓&param2=✗', (err, state) => {
                expect(state.params).toEqual({
                    param1: true,
                    param2: false
                })
            })
        })
    })

    it('should build path with default parameters', () => {
        const router = createRouter([
            {
                name: 'withDefaults',
                defaultParams: { id: '1' },
                path: '/with-defaults/:id'
            }
        ])

        expect(router.buildPath('withDefaults')).toBe('/with-defaults/1')
        expect(router.makeState('withDefaults').params).toEqual({ id: '1' })
    })
    
    it('should compare states by areStatesEqual method', () => {
        const router = createRouter([
            {
                name: 'withDefaults',
                defaultParams: { id: '1' },
                path: '/with-defaults/:id'
            }
        ])

        expect(
            router.areStatesEqual(
                {
                    name: 'withDefaults',
                    path: '/with-defaults/1',
                    params: { a: 1, b: undefined }
                },
                {
                    name: 'withDefaults',
                    path: '/with-defaults/1',
                    params: { a: 1, c: 2 }
                },
                false
            )
        ).toBe(false)
    })
})

describe('isActive specific tests', () => {
    it('should return false if router has not started (no active state)', () => {
        const localRouter = createTestRouter(); // Не вызываем .start()
        expect(localRouter.isActive('users.view', { id: 1 })).toBe(false);
    });

    // Тесты для strictEquality
    it('should handle strictEquality correctly when active', (done) => {
        const localRouter = createTestRouter();
        localRouter.start('/users/view/1', () => {
            expect(localRouter.isActive('users.view', { id: '1' }, true)).toBe(true);
            expect(localRouter.isActive('users.view', { id: '2' }, true)).toBe(false); 
            expect(localRouter.isActive('users', { id: '1' }, true)).toBe(false);
            
            localRouter.stop();
            done();
        });
    });

    it('should handle strictEquality=false correctly (descendant check)', (done) => {
        const localRouter = createTestRouter();
        localRouter.start('/users/view/1', () => {
            expect(localRouter.isActive('users', {}, false)).toBe(true);
            expect(localRouter.isActive('users.view', { id: '1' }, false)).toBe(true);
            expect(localRouter.isActive('orders', {}, false)).toBe(false);

            localRouter.stop();
            done();
        });
    });
    
    // Тесты для ignoreQueryParams (влияет на areStatesEqual, вызываемый isActive)
    it('should respect ignoreQueryParams when strictEquality is true', (done) => {
        const localRouter = createTestRouter();
        localRouter.start('/users/list?sort=name&dir=asc', () => {
            // Scenario 1: isActive(..., ignoreQueryParams = true) (default behavior of isActive)
            expect(localRouter.isActive('users.list', {}, true, true)).toBe(true);
            expect(localRouter.isActive('users.list', {sort: 'name'}, true, true)).toBe(true);

            // Scenario 2: isActive(..., ignoreQueryParams = false)
            expect(localRouter.isActive('users.list', { sort: 'name', dir: 'asc' }, true, false)).toBe(true);
            expect(localRouter.isActive('users.list', { sort: 'name' }, true, false)).toBe(false);
            expect(localRouter.isActive('users.list', {}, true, false)).toBe(false);
            expect(localRouter.isActive('users.list', { sort: 'name', dir: 'asc', extra: 'val' }, true, false)).toBe(false);

            localRouter.stop();
            done();
        });
    });
});
