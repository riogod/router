import { parse, build, omit, keep } from '../../lib/search-params'

describe('Search Params', () => {
  describe('parse function', () => {
    it('should parse simple query string', () => {
      const result = parse('?name=john&age=30')
      expect(result).toEqual({ name: 'john', age: '30' })
    })

    it('should parse query string without leading ?', () => {
      const result = parse('name=john&age=30')
      expect(result).toEqual({ name: 'john', age: '30' })
    })

    it('should handle empty query string', () => {
      const result = parse('')
      expect(result).toEqual({ '': null })
    })

    it('should handle array parameters', () => {
      const result = parse('tags[]=js&tags[]=react')
      expect(result).toEqual({ tags: ['js', 'react'] })
    })

    it('should handle boolean parameters', () => {
      const result = parse('active=true&disabled=false')
      expect(result).toEqual({ active: 'true', disabled: 'false' })
    })

    it('should handle parameters without values', () => {
      const result = parse('debug&verbose')
      expect(result).toEqual({ debug: null, verbose: null })
    })

    it('should handle URL encoded values', () => {
      const result = parse('message=hello%20world&special=%21%40%23')
      expect(result).toEqual({ message: 'hello world', special: '!@#' })
    })

    it('should handle duplicate parameters as arrays', () => {
      const result = parse('tag=js&tag=react&tag=node')
      expect(result).toEqual({ tag: ['js', 'react', 'node'] })
    })

    it('should handle complex nested structures', () => {
      const result = parse('user[name]=john&user[age]=30&user[tags][]=js')
      expect(result).toEqual({ 
        user: ['john', '30', 'js']
      })
    })

    it('should handle mixed parameter formats', () => {
      const result = parse('simple=value&array[]=item1&array[]=item2&flag')
      expect(result).toEqual({
        simple: 'value',
        array: ['item1', 'item2'],
        flag: null
      })
    })
  })

  describe('build function', () => {
    it('should build simple query string', () => {
      const result = build({ name: 'john', age: 30 })
      expect(result).toBe('name=john&age=30')
    })

    it('should handle array values', () => {
      const result = build({ tags: ['js', 'react'] })
      expect(result).toBe('tags=js&tags=react')
    })

    it('should handle boolean values', () => {
      const result = build({ active: true, disabled: false })
      expect(result).toBe('active=true&disabled=false')
    })

    it('should handle null and undefined values', () => {
      const result = build({ name: 'john', age: null, city: undefined })
      expect(result).toBe('name=john&age')
    })

    it('should handle empty string values', () => {
      const result = build({ name: 'john', description: '' })
      expect(result).toBe('name=john&description=')
    })

    it('should handle special characters', () => {
      const result = build({ message: 'hello world', special: '!@#$%' })
      expect(result).toBe('message=hello%20world&special=!%40%23%24%25')
    })

    it('should handle nested objects (as strings)', () => {
      const result = build({ 'user[name]': 'john', 'user[age]': 30 })
      expect(result).toBe('user%5Bname%5D=john&user%5Bage%5D=30')
    })

    it('should handle number values', () => {
      const result = build({ count: 42, price: 19.99 })
      expect(result).toBe('count=42&price=19.99')
    })

    it('should handle array with mixed types', () => {
      const result = build({ values: ['string', 123, true, null] })
      expect(result).toBe('values=string&values=123&values=true&values=null')
    })
  })

  describe('omit function', () => {
    it('should omit specified parameters', () => {
      const result = omit('name=john&age=30&city=NY', ['age'])
      expect(result.querystring).toBe('name=john&city=NY')
      expect(result.removedParams).toEqual({ age: '30' })
    })

    it('should omit multiple parameters', () => {
      const result = omit('name=john&age=30&city=NY&country=US', ['age', 'country'])
      expect(result.querystring).toBe('name=john&city=NY')
      expect(result.removedParams).toEqual({ age: '30', country: 'US' })
    })

    it('should handle array parameters', () => {
      const result = omit('tags=js&tags=react&name=john', ['tags'])
      expect(result.querystring).toBe('name=john')
      expect(result.removedParams).toEqual({ tags: ['js', 'react'] })
    })

    it('should handle non-existent parameters', () => {
      const result = omit('name=john&age=30', ['nonexistent'])
      expect(result.querystring).toBe('name=john&age=30')
      expect(result.removedParams).toEqual({ '': null })
    })

    it('should handle query string with leading ?', () => {
      const result = omit('?name=john&age=30', ['age'])
      expect(result.querystring).toBe('?name=john')
      expect(result.removedParams).toEqual({ age: '30' })
    })
  })

  describe('keep function', () => {
    it('should keep only specified parameters', () => {
      const result = keep('name=john&age=30&city=NY', ['name', 'city'])
      expect(result.querystring).toBe('name=john&city=NY')
      expect(result.keptParams).toEqual({ name: 'john', city: 'NY' })
    })

    it('should handle array parameters', () => {
      const result = keep('tags=js&tags=react&name=john&age=30', ['tags'])
      expect(result.querystring).toBe('tags=js&tags=react')
      expect(result.keptParams).toEqual({ tags: ['js', 'react'] })
    })

    it('should handle non-existent parameters', () => {
      const result = keep('name=john&age=30', ['nonexistent'])
      expect(result.querystring).toBe('')
      expect(result.keptParams).toEqual({ '': null })
    })

    it('should handle empty keep list', () => {
      const result = keep('name=john&age=30', [])
      expect(result.querystring).toBe('')
      expect(result.keptParams).toEqual({ '': null })
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle multiple equals signs', () => {
      const result = parse('equation=x=y+z&url=http://example.com')
      expect(result).toEqual({ equation: 'x', url: 'http://example.com' })
    })

    it('should handle parameters with no values in build', () => {
      const result = build({ debug: '', verbose: null, active: undefined })
      expect(result).toBe('debug=&verbose')
    })

    it('should handle very long query strings', () => {
      const longValue = 'a'.repeat(1000)
      const result = parse(`data=${longValue}`)
      expect(result).toEqual({ data: longValue })
    })

    it('should handle special URL characters', () => {
      const result = parse('path=/users/123&redirect=http%3A//example.com')
      expect(result).toEqual({ 
        path: '/users/123', 
        redirect: 'http://example.com' 
      })
    })

    it('should handle empty parameter names', () => {
      const result = parse('=value&name=john')
      expect(result).toEqual({ '': 'value', name: 'john' })
    })

    it('should handle malformed brackets', () => {
      const result = parse('data[incomplete&normal=value')
      expect(result).toEqual({ 
        data: [null],
        normal: 'value'
      })
    })
  })

  describe('Performance considerations', () => {
    it('should handle large parameter sets efficiently', () => {
      const params = Array.from({ length: 100 }, (_, i) => `param${i}=value${i}`).join('&')
      
      const start = performance.now()
      const result = parse(params)
      const end = performance.now()
      
      expect(Object.keys(result)).toHaveLength(100)
      expect(result.param0).toBe('value0')
      expect(result.param99).toBe('value99')
      expect(end - start).toBeLessThan(50)
    })

    it('should build large query strings efficiently', () => {
      const params = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`param${i}`, `value${i}`])
      )
      
      const start = performance.now()
      const result = build(params)
      const end = performance.now()
      
      expect(result).toContain('param0=value0')
      expect(result).toContain('param99=value99')
      expect(end - start).toBeLessThan(20)
    })
  })
}) 