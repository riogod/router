import ponyfill from './ponyfill';

// Типы для глобальных объектов
interface GlobalEnvironment {
  Symbol?: SymbolConstructor & { observable?: symbol };
  [key: string]: unknown;
}

// Определяем типы для глобальных объектов
declare const self: GlobalEnvironment | undefined;
declare const window: GlobalEnvironment | undefined;
declare const global: GlobalEnvironment | undefined;
declare const module: GlobalEnvironment | undefined;

let root: GlobalEnvironment;

if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  // Fallback для получения глобального объекта
  root = Function('return this')() as GlobalEnvironment;
}

const result = ponyfill(root);
export default result;