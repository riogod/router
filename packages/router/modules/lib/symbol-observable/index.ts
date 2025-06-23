/* global window */
import ponyfill from './ponyfill';

declare const self: any;
declare const window: any;
declare const global: any;
declare const module: any;

let root: any;

if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')();
}

const result = ponyfill(root);
export default result;