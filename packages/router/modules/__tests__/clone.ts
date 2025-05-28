import createTestRouter from './helpers/testRouters'
import cloneRouter from '../clone'

describe('core/clone', () => {
    it('should clone the root node', () => {
        const router = createTestRouter()
        const otherRouter = createTestRouter()

        expect(router.rootNode).not.toBe(otherRouter.rootNode)

        const clonedRouter = cloneRouter(router)

        expect(clonedRouter.rootNode).not.toBe(router.rootNode)
        expect(clonedRouter.rootNode.name).toBe(router.rootNode.name)
        expect(clonedRouter.rootNode.path).toBe(router.rootNode.path)
    })

    it('should clone plugins', () => {
        const router = createTestRouter()
        const myPlugin = () => ({
            onTransitionSuccess: () => true
        })
        router.usePlugin(myPlugin)

        const clonedRouter = cloneRouter(router)

        expect(clonedRouter.getPlugins()).toContain(myPlugin)
    })

    it('should clone middleware functions', () => {
        const router = createTestRouter()
        const myMiddleware = () => () => true

        router.useMiddleware(myMiddleware)

        const clonedRouter = cloneRouter(router)

        expect(clonedRouter.getMiddlewareFactories()).toContain(myMiddleware)
    })

    it('should clone canActivate handlers', () => {
        const router = createTestRouter()
        const canActivateAdmin = () => () => false

        router.canActivate('admin', canActivateAdmin)

        const clonedRouter = cloneRouter(router)

        expect(clonedRouter.getLifecycleFactories()[1].admin).toBe(
            canActivateAdmin
        )
    })

    it('should clone canDeactivate handlers', () => {
        const router = createTestRouter();
        const canDeactivateAdmin = () => () => true;

        router.canDeactivate('admin', canDeactivateAdmin);

        const clonedRouter = cloneRouter(router);

        expect(clonedRouter.getLifecycleFactories()[0].admin).toBe(
            canDeactivateAdmin
        );
    });

    it('should allow adding same routes to different cloned routers without conflict', () => {
        const router = createTestRouter()
        
        const router1 = cloneRouter(router)
        const router2 = cloneRouter(router)

        // This should not throw an error, but currently it does due to shared rootNode
        expect(() => {
            router1.add([{ name: "foo", path: "/foo" }])
            router2.add([{ name: "foo", path: "/foo" }])
        }).not.toThrow()
    })

    it('should allow independent route modifications in cloned routers', () => {
        const router = createTestRouter()
        
        const router1 = cloneRouter(router)
        const router2 = cloneRouter(router)

        // Add different routes to each cloned router
        router1.add([
            { name: "dashboard", path: "/dashboard" },
            { name: "dashboard.stats", path: "/stats" }
        ])
        
        router2.add([
            { name: "blog", path: "/blog" },
            { name: "blog.post", path: "/post/:id" }
        ])

        // Each router should only have its own routes
        expect(router1.buildPath('dashboard')).toBe('/dashboard')
        expect(router1.buildPath('dashboard.stats')).toBe('/dashboard/stats')
        expect(() => router1.buildPath('blog')).toThrow()
        expect(() => router1.buildPath('blog.post')).toThrow()

        expect(router2.buildPath('blog')).toBe('/blog')
        expect(router2.buildPath('blog.post', { id: '123' })).toBe('/blog/post/123')
        expect(() => router2.buildPath('dashboard')).toThrow()
        expect(() => router2.buildPath('dashboard.stats')).toThrow()

        // Original router should not be affected
        expect(() => router.buildPath('dashboard')).toThrow()
        expect(() => router.buildPath('blog')).toThrow()
    })
})
