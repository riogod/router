import symbolObservable from '../index';
import ponyfill from '../ponyfill';

// Типы для тестов
interface GlobalRoot {
  Symbol?: SymbolConstructor & { observable?: symbol };
}

interface MockSymbolConstructor extends SymbolConstructor {
  observable?: symbol;
}

describe('symbol-observable', () => {
  describe('ponyfill', () => {
    it('should return Symbol.observable if Symbol exists and has observable', () => {
      const testObservable = Symbol('test-observable');
      const mockSymbol = function() { return Symbol('new'); } as MockSymbolConstructor;
      mockSymbol.observable = testObservable;
      const mockRoot: GlobalRoot = { Symbol: mockSymbol };
      
      const result = ponyfill(mockRoot);
      
      expect(result).toBe(testObservable);
    });

    it('should create and set Symbol.observable if Symbol exists but no observable', () => {
      const mockSymbol = jest.fn().mockReturnValue(Symbol('new-observable')) as unknown as MockSymbolConstructor;
      const mockRoot: GlobalRoot = { Symbol: mockSymbol };
      
      const result = ponyfill(mockRoot);
      
      expect(mockSymbol).toHaveBeenCalledWith('observable');
      expect(mockSymbol.observable).toBe(result);
    });

    it('should return string fallback if Symbol does not exist', () => {
      const mockRoot: GlobalRoot = {};
      
      const result = ponyfill(mockRoot);
      
      expect(result).toBe('@@observable');
    });

    it('should return string fallback if Symbol is not a function', () => {
      const mockRoot = { Symbol: 'not-a-function' as unknown as SymbolConstructor };
      
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