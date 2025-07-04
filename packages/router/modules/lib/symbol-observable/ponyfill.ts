interface GlobalRoot {
  Symbol?: SymbolConstructor & { observable?: symbol };
}

export default function ponyfill(root: GlobalRoot): symbol | string {
  let result: symbol | string;
  const Symbol = root.Symbol;

  if (typeof Symbol === 'function') {
    if (Symbol.observable) {
      result = Symbol.observable;
    } else {
      result = Symbol('observable');
      Symbol.observable = result;
    }
  } else {
    result = '@@observable';
  }

  return result;
} 