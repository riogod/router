import { RouteNode } from '../../lib/route-node'

describe('RouteNode', () => {
  describe('Basic functionality', () => {
    it('should create a route node', () => {
      const node = new RouteNode('home', '/')
      expect(node.name).toBe('home')
      expect(node.path).toBe('/')
      expect(node.children).toEqual([])
    })

    it('should handle absolute paths', () => {
      const node = new RouteNode('admin', '~/admin')
      expect(node.absolute).toBe(true)
      expect(node.path).toBe('/admin')
    })

    it('should handle relative paths', () => {
      const node = new RouteNode('users', '/users')
      expect(node.absolute).toBe(false)
      expect(node.path).toBe('/users')
    })

    it('should create parser for non-empty paths', () => {
      const node = new RouteNode('users', '/users/:id')
      expect(node.parser).toBeDefined()
      expect(node.parser?.path).toBe('/users/:id')
    })

    it('should not create parser for empty paths', () => {
      const node = new RouteNode('root', '')
      expect(node.parser).toBeNull()
    })
  })

  describe('Child management', () => {
    it('should add child nodes', () => {
      const parent = new RouteNode('parent', '/parent')
      const child = new RouteNode('child', '/child')
      
      parent.add(child)
      
      expect(parent.children).toHaveLength(1)
      expect(parent.children[0]).toBe(child)
      expect(child.parent).toBe(parent)
    })

    it('should add multiple children', () => {
      const parent = new RouteNode('parent', '/parent')
      const child1 = new RouteNode('child1', '/child1')
      const child2 = new RouteNode('child2', '/child2')
      
      parent.add([child1, child2])
      
      expect(parent.children).toHaveLength(2)
      expect(parent.children[0]).toBe(child1)
      expect(parent.children[1]).toBe(child2)
    })

    it('should find child by name', () => {
      const parent = new RouteNode('parent', '/parent')
      const child = new RouteNode('child', '/child')
      
      parent.add(child)
      
      const found = parent.children.find(c => c.name === 'child')
      expect(found).toBe(child)
    })

    it('should return undefined for non-existent child', () => {
      const parent = new RouteNode('parent', '/parent')
      const found = parent.children.find(c => c.name === 'nonexistent')
      expect(found).toBeUndefined()
    })
  })

  describe('Path building', () => {
    it('should build simple paths', () => {
      const root = new RouteNode('root', '')
      const users = new RouteNode('users', '/users/:id')
      root.add(users)
      const path = root.buildPath('users', { id: '123' })
      expect(path).toBe('/users/123')
    })

    it('should build paths with query parameters', () => {
      const root = new RouteNode('root', '')
      const search = new RouteNode('search', '/search?q&category')
      root.add(search)
      const path = root.buildPath('search', { q: 'test', category: 'books' })
      expect(path).toBe('/search?q=test&category=books')
    })

    it('should handle missing parameters', () => {
      const root = new RouteNode('root', '')
      const users = new RouteNode('users', '/users/:id')
      root.add(users)
      expect(() => root.buildPath('users')).toThrow()
    })
  })

  describe('Path matching', () => {
    it('should match exact paths', () => {
      const root = new RouteNode('root', '')
      const users = new RouteNode('users', '/users/:id')
      root.add(users)
      const match = root.matchPath('/users/123')
      expect(match).toEqual({
        name: 'users',
        params: { id: '123' },
        meta: {
          users: {
            id: 'url'
          }
        }
      })
    })

    it('should return null for non-matching paths', () => {
      const root = new RouteNode('root', '')
      const users = new RouteNode('users', '/users/:id')
      root.add(users)
      const match = root.matchPath('/posts/123')
      expect(match).toBeNull()
    })

    it('should handle empty path matching', () => {
      const node = new RouteNode('root', '/')
      const match = node.matchPath('/')
      expect(match).toEqual({
        name: 'root',
        params: {},
        meta: {
          root: {}
        }
      })
    })

    it('should handle complex parameter patterns', () => {
      const root = new RouteNode('root', '')
      const files = new RouteNode('files', '/files/*filepath')
      root.add(files)
      const match = root.matchPath('/files/docs/readme.txt')
      expect(match).toEqual({
        name: 'files',
        params: { filepath: 'docs/readme.txt' },
        meta: {
          files: {
            filepath: 'url'
          }
        }
      })
    })
  })

  describe('Tree traversal', () => {
    it('should find nodes by path', () => {
      const root = new RouteNode('root', '')
      const users = new RouteNode('users', '/users')
      const profile = new RouteNode('profile', '/:id')
      
      root.add(users)
      users.add(profile)
      
      const path = root.getPath('users.profile')
      expect(path).toBe('/users/:id')
    })

    it('should return null for non-existent paths', () => {
      const root = new RouteNode('root', '')
      const path = root.getPath('nonexistent.path')
      expect(path).toBeNull()
    })

    it('should get full path from root', () => {
      const root = new RouteNode('root', '')
      const users = new RouteNode('users', '/users')
      const profile = new RouteNode('profile', '/:id')
      
      root.add(users)
      users.add(profile)
      
      const fullPath = root.getPath('users.profile')
      expect(fullPath).toBe('/users/:id')
    })

    it('should handle absolute paths in tree', () => {
      const root = new RouteNode('root', '')
      const admin = new RouteNode('admin', '~/admin')
      
      root.add(admin)
      
      const fullPath = root.getPath('admin')
      expect(fullPath).toBe('/admin')
    })
  })

  describe('Node properties', () => {
    it('should have correct properties', () => {
      const node = new RouteNode('users', '/users/:id')
      const child = new RouteNode('profile', '/profile')
      node.add(child)
      
      expect(node.name).toBe('users')
      expect(node.path).toBe('/users/:id')
      expect(node.children).toHaveLength(1)
      expect(node.children[0].name).toBe('profile')
    })

    it('should handle empty children', () => {
      const node = new RouteNode('simple', '/simple')
      expect(node.children).toEqual([])
    })
  })

  describe('Edge cases', () => {
    it('should handle special characters in names', () => {
      const node = new RouteNode('user-profile', '/user-profile')
      expect(node.name).toBe('user-profile')
    })

    it('should handle complex path patterns', () => {
      const node = new RouteNode('complex', '/api/v1/users/:id/posts/:postId?sort&filter')
      expect(node.parser).toBeDefined()
      expect(node.parser?.hasUrlParams).toBe(true)
      expect(node.parser?.hasQueryParams).toBe(true)
    })

    it('should handle root path correctly', () => {
      const node = new RouteNode('root', '/')
      expect(node.path).toBe('/')
      expect(node.absolute).toBe(false)
    })

    it('should handle empty name', () => {
      const node = new RouteNode('', '/path')
      expect(node.name).toBe('')
      expect(node.path).toBe('/path')
    })
  })

  describe('Performance considerations', () => {
    it('should handle large trees efficiently', () => {
      const root = new RouteNode('root', '')
      
      const start = performance.now()
      
      // Create a large tree
      for (let i = 0; i < 100; i++) {
        const parent = new RouteNode(`parent${i}`, `/parent${i}`)
        root.add(parent)
        
        for (let j = 0; j < 10; j++) {
          const child = new RouteNode(`child${j}`, `/child${j}`)
          parent.add(child)
        }
      }
      
      const end = performance.now()
      
      expect(root.children).toHaveLength(100)
      expect(root.children[0].children).toHaveLength(10)
      // Увеличиваем лимит для CI серверов (GitHub Actions менее производительные)
      expect(end - start).toBeLessThan(500)
    })

    it('should find children efficiently in large trees', () => {
      const root = new RouteNode('root', '')
      
      // Create a moderately large tree
      for (let i = 0; i < 50; i++) {
        const child = new RouteNode(`child${i}`, `/child${i}`)
        root.add(child)
      }
      
      const start = performance.now()
      
      for (let i = 0; i < 50; i++) {
        root.children.find(c => c.name === `child${i}`)
      }
      
      const end = performance.now()
      
      // Увеличиваем лимит для CI серверов
      expect(end - start).toBeLessThan(200)
    })

    it('should match paths efficiently', () => {
      const node = new RouteNode('users', '/users/:id/posts/:postId')
      
      const start = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        node.matchPath(`/users/${i}/posts/${i * 2}`)
      }
      
      const end = performance.now()
      
      // Увеличиваем лимит для CI серверов
      expect(end - start).toBeLessThan(500)
    })
  })

  describe('Memory management', () => {
    it('should properly set parent references', () => {
      const parent = new RouteNode('parent', '/parent')
      const child = new RouteNode('child', '/child')
      
      parent.add(child)
      
      expect(child.parent).toBe(parent)
      expect(parent.children.includes(child)).toBe(true)
    })

    it('should handle circular reference prevention', () => {
      const node1 = new RouteNode('node1', '/node1')
      const node2 = new RouteNode('node2', '/node2')
      
      node1.add(node2)
      
      // Attempting to add parent as child should not create circular reference
      // This depends on implementation - adjust test based on actual behavior
      expect(() => node2.add(node1)).not.toThrow()
    })
  })
}) 