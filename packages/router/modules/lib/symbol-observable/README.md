# Symbol Observable

Локальная реализация `Symbol.observable` ponyfill для @riogz/router.

## Описание

Эта библиотека предоставляет полифилл для `Symbol.observable`, если `Symbol` существует, но не полифиллит `Symbol`, если он не существует. Предназначена для использования как "ponyfill", что означает, что вы должны использовать экспортированное значение символа из модуля, как описано ниже.

Это сделано для обеспечения того, чтобы все использовали одну и ту же версию символа (или строки в зависимости от окружения), в соответствии с природой символов в JavaScript.

## Базовое использование

```typescript
import symbolObservable from './lib/symbol-observable';

console.log(symbolObservable);
//=> Symbol(observable) или '@@observable'
```

## Создание "observable" объекта

Вы можете использовать этот символ для создания объектов, совместимых с RxJS, XStream и Most.js:

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

## Структура файлов

- `index.ts` - Основной экспорт, определяет глобальное окружение и применяет ponyfill
- `ponyfill.ts` - Основная логика ponyfill
- `ponyfill.d.ts` - TypeScript типы для ponyfill функции
- `index.d.ts` - TypeScript типы для основного экспорта

## Оригинал

Основано на [symbol-observable](https://github.com/benlesh/symbol-observable) от Ben Lesh и Sindre Sorhus.

## Лицензия

MIT 