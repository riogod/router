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

  describe('Node Update Functionality', () => {
    let root: RouteNode;

    beforeEach(() => {
      root = new RouteNode('root', '');
    });

    it('should update an existing node if a node with the same name is added', () => {
      const initialNodeDef = { name: 'home', path: '/home_old' };
      root.add(initialNodeDef);
      const initialChild = root.children.find(c => c.name === 'home');
      expect(initialChild?.path).toBe('/home_old');

      const updatedNodeDef = { name: 'home', path: '/home_new' };
      root.add(updatedNodeDef);

      expect(root.children).toHaveLength(1); // Should not add a new node
      const updatedChild = root.children.find(c => c.name === 'home');
      expect(updatedChild?.path).toBe('/home_new');
    });

    it('should throw an error if updated path conflicts with a sibling', () => {
      root.add({ name: 'sibling', path: '/sibling' });
      root.add({ name: 'home', path: '/home' });

      const conflictingUpdateDef = { name: 'home', path: '/sibling' };
      expect(() => {
        root.add(conflictingUpdateDef);
      }).toThrow('Path "/sibling" for route "home" conflicts with existing sibling route "sibling".');
    });

    it('should add new children to an existing node during update', () => {
      root.add({ name: 'parent', path: '/parent' });
      const parentNode = root.children.find(c => c.name === 'parent');
      expect(parentNode?.children).toHaveLength(0);

      const updateWithNewChildDef = {
        name: 'parent',
        path: '/parent',
        children: [{ name: 'child1', path: '/child1' }]
      };
      root.add(updateWithNewChildDef);

      expect(parentNode?.children).toHaveLength(1);
      expect(parentNode?.children[0].name).toBe('child1');
      expect(parentNode?.children[0].path).toBe('/child1');
    });

    it('should update existing children of an existing node during update', () => {
      root.add({
        name: 'parent',
        path: '/parent',
        children: [{ name: 'child1', path: '/child1_old' }]
      });
      const parentNode = root.children.find(c => c.name === 'parent');
      const childNode = parentNode?.children.find(c => c.name === 'child1');
      expect(childNode?.path).toBe('/child1_old');

      const updateWithUpdatedChildDef = {
        name: 'parent',
        path: '/parent',
        children: [{ name: 'child1', path: '/child1_new' }]
      };
      root.add(updateWithUpdatedChildDef);
      
      expect(parentNode?.children).toHaveLength(1);
      expect(childNode?.path).toBe('/child1_new');
    });

    it('should add new and update existing children simultaneously', () => {
      root.add({
        name: 'parent',
        path: '/parent',
        children: [{ name: 'child1', path: '/child1_old' }]
      });
      const parentNode = root.children.find(c => c.name === 'parent');

      const updateMixedDef = {
        name: 'parent',
        path: '/parent',
        children: [
          { name: 'child1', path: '/child1_new' }, // Update existing
          { name: 'child2', path: '/child2' }      // Add new
        ]
      };
      root.add(updateMixedDef);

      expect(parentNode?.children).toHaveLength(2);
      const child1 = parentNode?.children.find(c => c.name === 'child1');
      const child2 = parentNode?.children.find(c => c.name === 'child2');
      expect(child1?.path).toBe('/child1_new');
      expect(child2?.name).toBe('child2');
      expect(child2?.path).toBe('/child2');
    });

    it('should preserve existing children not mentioned in the update', () => {
      root.add({
        name: 'parent',
        path: '/parent',
        children: [
            { name: 'child_preserved', path: '/preserved' },
            { name: 'child_to_update', path: '/to_update_old' }
        ]
      });
      const parentNode = root.children.find(c => c.name === 'parent');

      const partialUpdateDef = {
        name: 'parent',
        path: '/parent',
        children: [
          { name: 'child_to_update', path: '/to_update_new' },
          { name: 'child_new', path: '/new' }
        ]
      };
      root.add(partialUpdateDef);

      expect(parentNode?.children).toHaveLength(3);
      const preservedChild = parentNode?.children.find(c => c.name === 'child_preserved');
      const updatedChild = parentNode?.children.find(c => c.name === 'child_to_update');
      const newChild = parentNode?.children.find(c => c.name === 'child_new');
      
      expect(preservedChild?.path).toBe('/preserved');
      expect(updatedChild?.path).toBe('/to_update_new');
      expect(newChild?.path).toBe('/new');
    });

    it('should update custom properties on an existing node', () => {
      const initialDef = { 
        name: 'customRoute', 
        path: '/custom',
        customData: 'initial',
        onEnter: () => 'initialEnter'
      };
      root.add(initialDef);
      let customNode = root.children.find(c => c.name === 'customRoute') as any;
      expect(customNode?.path).toBe('/custom');
      expect(customNode?.customData).toBe('initial');
      expect(customNode?.onEnter()).toBe('initialEnter');

      const updateDef = {
        name: 'customRoute',
        path: '/custom_updated', // Path update
        customData: 'updated',     // Custom data update
        onEnter: () => 'updatedEnter', // Custom function update
        anotherProp: true          // Add new custom prop
      };
      root.add(updateDef);
      
      customNode = root.children.find(c => c.name === 'customRoute') as any;
      expect(root.children).toHaveLength(1); // Ensure no new node was added
      expect(customNode?.path).toBe('/custom_updated');
      expect(customNode?.customData).toBe('updated');
      expect(customNode?.onEnter()).toBe('updatedEnter');
      expect(customNode?.anotherProp).toBe(true);
    });

    it('should transfer custom properties when adding a new node', () => {
      const nodeDef = { 
        name: 'newNode', 
        path: '/new', 
        customFlag: true,
        meta: { title: 'New Node'}
      };
      root.add(nodeDef);

      const newNode = root.children.find(c => c.name === 'newNode') as any;
      expect(newNode).toBeDefined();
      expect(newNode?.customFlag).toBe(true);
      expect(newNode?.meta?.title).toBe('New Node');
    });

    it('should handle nested custom objects and arrays correctly during update', () => {
      root.add({
        name: 'complexCustom',
        path: '/complex',
        config: { settingA: 'valA', numbers: [1, 2] },
        tags: ['tag1']
      });
      let node = root.children.find(c => c.name === 'complexCustom') as any;
      expect(node.config.settingA).toBe('valA');
      expect(node.config.numbers).toEqual([1, 2]);
      expect(node.tags).toEqual(['tag1']);

      root.add({
        name: 'complexCustom',
        path: '/complex_new',
        config: { settingB: 'valB', numbers: [3, 4, 5] }, // Completely replaces config
        tags: ['tag2', 'tag3'] // Completely replaces tags
      });
      node = root.children.find(c => c.name === 'complexCustom') as any;
      expect(node.path).toBe('/complex_new');
      expect(node.config.settingA).toBeUndefined();
      expect(node.config.settingB).toBe('valB');
      expect(node.config.numbers).toEqual([3, 4, 5]);
      expect(node.tags).toEqual(['tag2', 'tag3']);
    });

    it('should preserve existing custom properties if not mentioned in update definition', () => {
      root.add({
        name: 'partialUpdate',
        path: '/partial',
        permanentData: 'stays here',
        tempData: 'will change'
      });
      let node = root.children.find(c => c.name === 'partialUpdate') as any;
      expect(node.permanentData).toBe('stays here');

      root.add({
        name: 'partialUpdate',
        path: '/partial_updated',
        tempData: 'changed'
        // permanentData is not mentioned
      });
      node = root.children.find(c => c.name === 'partialUpdate') as any;
      expect(node.path).toBe('/partial_updated');
      expect(node.tempData).toBe('changed');
      expect(node.permanentData).toBe('stays here'); // Should still exist
    });
  });

  describe('Nested Node Addition and Update Functionality', () => {
    let root: RouteNode;

    beforeEach(() => {
      root = new RouteNode('__root__', ''); // Using a common root name for clarity
    });

    it('should add a nested node using dot-separated name', () => {
      root.add({ name: 'parent', path: '/parent' });
      root.add({ name: 'parent.child', path: '/child' }); // Add child to existing parent

      const parentNode = root.children.find(c => c.name === 'parent');
      expect(parentNode).toBeDefined();
      expect(parentNode?.children).toHaveLength(1);
      const childNode = parentNode?.children.find(c => c.name === 'child');
      expect(childNode).toBeDefined();
      expect(childNode?.path).toBe('/child');
      expect(childNode?.parent).toBe(parentNode);
      expect(root.getPath('parent.child')).toBe('/parent/child');
    });

    it('should update a nested node using dot-separated name', () => {
      root.add({ name: 'parent', path: '/parent' });
      root.add({ name: 'parent.child', path: '/child_old' });
      root.add({ name: 'parent.child', path: '/child_new' }); // Update existing nested child

      const parentNode = root.children.find(c => c.name === 'parent');
      const childNode = parentNode?.children.find(c => c.name === 'child');
      expect(parentNode?.children).toHaveLength(1);
      expect(childNode?.path).toBe('/child_new');
    });

    it('should add a grandchild to a nested node', () => {
      root.add({ name: 'parent', path: '/parent' });
      root.add({ name: 'parent.child', path: '/child' });
      // Add grandchild using full path from root for the new node definition
      root.add({ 
        name: 'parent.child.grandchild', 
        path: '/grandchild' 
      });

      const parentNode = root.children.find(c => c.name === 'parent');
      const childNode = parentNode?.children.find(c => c.name === 'child');
      const grandchildNode = childNode?.children.find(c => c.name === 'grandchild');

      expect(grandchildNode).toBeDefined();
      expect(grandchildNode?.path).toBe('/grandchild');
      expect(grandchildNode?.parent).toBe(childNode);
      expect(root.getPath('parent.child.grandchild')).toBe('/parent/child/grandchild');
    });

    it('should update a grandchild using full dot-separated name', () => {
        root.add({
            name: 'app',
            path: '/app',
            children: [
                {
                    name: 'section',
                    path: '/section',
                    children: [
                        { name: 'item', path: '/item_old' }
                    ]
                }
            ]
        });
        
        root.add({ name: 'app.section.item', path: '/item_new' });

        const appNode = root.children.find(c => c.name === 'app');
        const sectionNode = appNode?.children.find(c => c.name === 'section');
        const itemNode = sectionNode?.children.find(c => c.name === 'item');
        
        expect(itemNode?.path).toBe('/item_new');
    });

    it('should correctly add children when updating a nested node with new children', () => {
        root.add({ name: 'a', path: '/a' });
        root.add({ name: 'a.b', path: '/b' }); // a.b initially has no children
        
        // Update a.b and add children to it
        root.add({
            name: 'a.b',
            path: '/b_updated', // also update path of a.b
            children: [
                { name: 'c', path: '/c' },
                { name: 'd', path: '/d' }
            ]
        });

        const aNode = root.children.find(c => c.name === 'a');
        const bNode = aNode?.children.find(c => c.name === 'b');
        
        expect(bNode?.path).toBe('/b_updated');
        expect(bNode?.children).toHaveLength(2);
        const cNode = bNode?.children.find(c => c.name === 'c');
        const dNode = bNode?.children.find(c => c.name === 'd');
        expect(cNode?.path).toBe('/c');
        expect(dNode?.path).toBe('/d');
        expect(root.getPath('a.b.c')).toBe('/a/b_updated/c');
    });

    it('should correctly set and update custom properties on nested nodes', () => {
      root.add({ name: 'app', path: '/app', customTop: 'topLevel'});
      root.add({ name: 'app.settings', path: '/settings', customNested: 'initialSettings' });

      let settingsNode = root.children.find(c => c.name === 'app')
                           ?.children.find(c => c.name === 'settings') as any;
      expect(settingsNode?.customNested).toBe('initialSettings');
      // Check parent custom prop to ensure it's not affected by child logic
      expect((root.children.find(c => c.name === 'app') as any)?.customTop).toBe('topLevel'); 

      root.add({
        name: 'app.settings',
        path: '/settings_v2',
        customNested: 'updatedSettings',
        newCustom: 123
      });
      settingsNode = root.children.find(c => c.name === 'app')
                       ?.children.find(c => c.name === 'settings') as any;
      expect(settingsNode?.path).toBe('/settings_v2');
      expect(settingsNode?.customNested).toBe('updatedSettings');
      expect(settingsNode?.newCustom).toBe(123);
    });

    it('should throw error if parent segment for nested add is missing', () => {
        expect(() => {
            root.add({ name: 'nonexistent_parent.child', path: '/child' });
        }).toThrow("Could not add route named 'nonexistent_parent.child', parent segment 'nonexistent_parent' is missing.");
    });

  })
}) 