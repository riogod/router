import { Path } from '../../lib/path-parser'

describe('Path Parser', () => {
  describe('Basic functionality', () => {
    it('should create a path instance', () => {
      const path = new Path('/users/:id')
      expect(path.path).toBe('/users/:id')
      expect(path.hasUrlParams).toBe(true)
      expect(path.urlParams).toEqual(['id'])
    })

    it('should handle static paths', () => {
      const path = new Path('/about')
      expect(path.hasUrlParams).toBe(false)
      expect(path.urlParams).toEqual([])
    })

    it('should handle query parameters', () => {
      const path = new Path('/search?q&category')
      expect(path.hasQueryParams).toBe(true)
      expect(path.queryParams).toEqual(['q', 'category'])
    })

    it('should handle splat parameters', () => {
      const path = new Path('/files/*filepath')
      expect(path.hasSpatParam).toBe(true)
      expect(path.spatParams).toEqual(['filepath'])
    })

    it('should handle matrix parameters', () => {
      const path = new Path('/users;id')
      expect(path.hasMatrixParams).toBe(true)
      expect(path.urlParams).toEqual(['id'])
    })
  })

  describe('Path testing', () => {
    it('should test exact matches', () => {
      const path = new Path('/users/:id')
      const result = path.test('/users/123')
      expect(result).toEqual({ id: '123' })
    })

    it('should return null for non-matches', () => {
      const path = new Path('/users/:id')
      const result = path.test('/posts/123')
      expect(result).toBeNull()
    })

    it('should handle query parameters in test', () => {
      const path = new Path('/search?q&category')
      const result = path.test('/search?q=test&category=books')
      expect(result).toEqual({ q: 'test', category: 'books' })
    })

    it('should handle case sensitivity', () => {
      const path = new Path('/Users/:id')
      const resultInsensitive = path.test('/users/123', { caseSensitive: false })
      const resultSensitive = path.test('/users/123', { caseSensitive: true })
      
      expect(resultInsensitive).toEqual({ id: '123' })
      expect(resultSensitive).toBeNull()
    })

    it('should handle trailing slash options', () => {
      const path = new Path('/users/:id')
      const result1 = path.test('/users/123/', { strictTrailingSlash: false })
      const result2 = path.test('/users/123/', { strictTrailingSlash: true })
      
      expect(result1).toEqual({ id: '123' })
      expect(result2).toBeNull()
    })

    it('should handle splat parameters', () => {
      const path = new Path('/files/*filepath')
      const result = path.test('/files/docs/readme.txt')
      expect(result).toEqual({ filepath: 'docs/readme.txt' })
    })
  })

  describe('Partial testing', () => {
    it('should test partial matches', () => {
      const path = new Path('/users/:id')
      const result = path.partialTest('/users/123/posts')
      expect(result).toEqual({ id: '123' })
    })

    it('should handle delimited option', () => {
      const path = new Path('/users/:id')
      const result1 = path.partialTest('/users/123posts', { delimited: true })
      const result2 = path.partialTest('/users/123posts', { delimited: false })
      
      expect(result1).toEqual({ id: '123posts' })
      expect(result2).toEqual({ id: '123posts' })
    })

    it('should handle query parameters in partial test', () => {
      const path = new Path('/search?q&category')
      const result = path.partialTest('/search?q=test&category=books&extra=ignored')
      expect(result).toEqual({ q: 'test', category: 'books' })
    })
  })

  describe('Path building', () => {
    it('should build simple paths', () => {
      const path = new Path('/users/:id')
      const result = path.build({ id: '123' })
      expect(result).toBe('/users/123')
    })

    it('should build paths with query parameters', () => {
      const path = new Path('/search?q&category')
      const result = path.build({ q: 'test', category: 'books' })
      expect(result).toBe('/search?q=test&category=books')
    })

    it('should build paths with splat parameters', () => {
      const path = new Path('/files/*filepath')
      const result = path.build({ filepath: 'docs/readme.txt' })
      expect(result).toBe('/files/docs/readme.txt')
    })

    it('should handle missing required parameters', () => {
      const path = new Path('/users/:id')
      expect(() => path.build({})).toThrow("Cannot build path: '/users/:id' requires missing parameters { id }")
    })

    it('should handle optional query parameters', () => {
      const path = new Path('/search?q&category')
      const result = path.build({ q: 'test' })
      expect(result).toBe('/search?q=test')
    })

    it('should ignore search when requested', () => {
      const path = new Path('/search?q&category')
      const result = path.build({ q: 'test', category: 'books' }, { ignoreSearch: true })
      expect(result).toBe('/search')
    })

    it('should handle array parameters', () => {
      const path = new Path('/search?tags')
      const result = path.build({ tags: ['javascript', 'react'] })
      expect(result).toBe('/search?tags=javascript&tags=react')
    })

    it('should handle boolean parameters', () => {
      const path = new Path('/search?active')
      const result = path.build({ active: true })
      expect(result).toBe('/search?active=true')
    })
  })

  describe('URL encoding', () => {
    it('should handle default encoding', () => {
      const path = new Path('/search/:query')
      const result = path.build({ query: 'hello world' })
      expect(result).toBe('/search/hello%20world')
    })

    it('should handle uriComponent encoding', () => {
      const path = new Path('/search/:query', { urlParamsEncoding: 'uriComponent' })
      const result = path.build({ query: 'hello+world' })
      expect(result).toBe('/search/hello%2Bworld')
    })

    it('should handle no encoding', () => {
      const path = new Path('/search/:query', { urlParamsEncoding: 'none' })
      const result = path.build({ query: 'hello world' }, { ignoreConstraints: true })
      expect(result).toBe('/search/hello world')
    })

    it('should decode parameters correctly', () => {
      const path = new Path('/search/:query')
      const result = path.test('/search/hello%20world')
      expect(result).toEqual({ query: 'hello world' })
    })
  })

  describe('Parameter validation', () => {
    it('should identify query parameters', () => {
      const path = new Path('/search?q&category')
      expect(path.isQueryParam('q')).toBe(true)
      expect(path.isQueryParam('category')).toBe(true)
      expect(path.isQueryParam('id')).toBe(false)
    })

    it('should identify splat parameters', () => {
      const path = new Path('/files/*filepath')
      expect(path.isSpatParam('filepath')).toBe(true)
      expect(path.isSpatParam('id')).toBe(false)
    })
  })

  describe('Static factory method', () => {
    it('should create path using static method', () => {
      const path = Path.createPath('/users/:id')
      expect(path).toBeInstanceOf(Path)
      expect(path.path).toBe('/users/:id')
    })
  })

  describe('Error handling', () => {
    it('should throw error for empty path', () => {
      expect(() => new Path('')).toThrow('Missing path in Path constructor')
    })

    it('should handle invalid path patterns', () => {
      // Test patterns that the tokenizer cannot parse
      expect(() => new Path('invalid')).not.toThrow()
    })
  })

  describe('Complex scenarios', () => {
    it('should handle nested parameters', () => {
      const path = new Path('/users/:userId/posts/:postId')
      const result = path.test('/users/123/posts/456')
      expect(result).toEqual({ userId: '123', postId: '456' })
    })

    it('should handle mixed parameter types', () => {
      const path = new Path('/files/*filepath?version&format')
      const result = path.test('/files/docs/readme.txt?version=1.0&format=md')
      expect(result).toEqual({
        filepath: 'docs/readme.txt',
        version: '1.0',
        format: 'md'
      })
    })

    it('should handle matrix parameters correctly', () => {
      const path = new Path('/users;id')
      const result = path.test('/users;id=123')
      expect(result).toEqual({ id: '123' })
    })

    it('should build complex paths', () => {
      const path = new Path('/users/:userId/posts/:postId?sort&filter')
      const result = path.build({
        userId: '123',
        postId: '456',
        sort: 'date',
        filter: 'published'
      })
      expect(result).toBe('/users/123/posts/456?sort=date&filter=published')
    })
  })

  describe('Performance considerations', () => {
    it('should handle large parameter sets efficiently', () => {
      const params = Array.from({ length: 50 }, (_, i) => `param${i}`).join('&')
      const path = new Path(`/search?${params}`)
      
      const testParams = Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => [`param${i}`, `value${i}`])
      )
      
      const start = performance.now()
      const result = path.build(testParams)
      const end = performance.now()
      
      expect(result).toContain('param0=value0')
      expect(result).toContain('param49=value49')
      expect(end - start).toBeLessThan(10)
    })

    it('should test paths efficiently', () => {
      const path = new Path('/users/:id/posts/:postId')
      
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        path.test(`/users/${i}/posts/${i * 2}`)
      }
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100)
    })
  })
}) 