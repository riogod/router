interface GlobalRoot {
  Symbol?: SymbolConstructor & { observable?: symbol };
}

declare function ponyfill(root: GlobalRoot): symbol | string;
export default ponyfill;