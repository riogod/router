# Symbol Observable

Local implementation of `Symbol.observable` ponyfill for @riogz/router.

## Description

This library provides a polyfill for `Symbol.observable` if `Symbol` exists, but will not polyfill `Symbol` if it doesn't exist. Meant to be used as a "ponyfill", meaning you're meant to use the module's exported symbol value as described below.

This is all done to ensure that everyone is using the same version of the symbol (or string depending on the environment), as per the nature of symbols in JavaScript.

## Basic Usage

```typescript
import symbolObservable from './lib/symbol-observable';

console.log(symbolObservable);
//=> Symbol(observable) or '@@observable'
```

## Making an object "observable"

You can use this symbol to create objects compatible with RxJS, XStream and Most.js:

```typescript
import symbolObservable from './lib/symbol-observable';

someObject[symbolObservable] = () => {
  return {
    subscribe(observer) {
      const handler = e => observer.next(e);
      someObject.addEventListener('data', handler);
      return {
        unsubscribe() {
          someObject.removeEventListener('data', handler);
        }
      }
    },
    [symbolObservable]() { return this }
  }
}
```

## File Structure

- `index.ts` - Main export, determines global environment and applies ponyfill
- `ponyfill.ts` - Core ponyfill logic
- `ponyfill.d.ts` - TypeScript types for ponyfill function
- `index.d.ts` - TypeScript types for main export

## Original

Based on [symbol-observable](https://github.com/benlesh/symbol-observable) by Ben Lesh and Sindre Sorhus.

## License

MIT 