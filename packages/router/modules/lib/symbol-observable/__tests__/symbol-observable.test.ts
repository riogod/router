import symbolObservable from '../index';
import ponyfill from '../ponyfill';

describe('symbol-observable', () => {
  describe('ponyfill', () => {
    it('should return Symbol.observable if Symbol exists and has observable', () => {
      const testObservable = Symbol('test-observable');
      const mockSymbol = function() { return Symbol('new'); };
      mockSymbol.observable = testObservable;
      const mockRoot = { Symbol: mockSymbol };
      
      const result = ponyfill(mockRoot);
      
      expect(result).toBe(testObservable);
    });

    it('should create and set Symbol.observable if Symbol exists but no observable', () => {
      const mockSymbol = jest.fn().mockReturnValue(Symbol('new-observable'));
      const mockRoot = { Symbol: mockSymbol };
      
      const result = ponyfill(mockRoot);
      
      expect(mockSymbol).toHaveBeenCalledWith('observable');
      expect((mockRoot.Symbol as any).observable).toBe(result);
    });

    it('should return string fallback if Symbol does not exist', () => {
      const mockRoot = { Symbol: undefined };
      
      const result = ponyfill(mockRoot);
      
      expect(result).toBe('@@observable');
    });

    it('should return string fallback if Symbol is not a function', () => {
      const mockRoot = { Symbol: 'not-a-function' };
      
      const result = ponyfill(mockRoot);
      
      expect(result).toBe('@@observable');
    });
  });

  describe('main export', () => {
    it('should export a symbol or string', () => {
      expect(typeof symbolObservable === 'symbol' || typeof symbolObservable === 'string').toBe(true);
    });

    it('should be consistent between calls', () => {
      const first = symbolObservable;
      const second = symbolObservable;
      
      expect(first).toBe(second);
    });
  });
}); 