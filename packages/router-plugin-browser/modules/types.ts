import { State } from '@riogz/router'

export interface BrowserPluginOptions {
    forceDeactivate?: boolean
    useHash?: boolean
    hashPrefix?: string
    base?: string | null
    mergeState?: boolean
    preserveHash?: boolean
}

export interface Browser {
    getBase(): string
    pushState(state: HistoryState, title: string | null, path: string): void
    replaceState(state: HistoryState, title: string | null, path: string): void
    addPopstateListener(fn, opts): any
    getLocation(opts: BrowserPluginOptions): string
    getState(): HistoryState
    getHash(): string
}

export type HistoryState = (State & { [key: string]: any }) | null;
