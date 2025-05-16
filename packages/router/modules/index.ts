import createRouter from './createRouter'
import { RouteNode } from 'route-node'
import transitionPath from '@riogz/router-transition-path'
import { constants, errorCodes, ErrorCodes, Constants } from './constants'
import cloneRouter from './clone'

// Types
export type {
    Route,
    Options,
    ActivationFn,
    ActivationFnFactory,
    Router,
    Plugin,
    PluginFactory,
    Middleware,
    SubscribeState,
    SubscribeFn,
    Listener,
    Subscription
} from './types/router'
export type { State, StateMeta, NavigationOptions } from './types/base'

export {
    createRouter,
    cloneRouter,
    RouteNode,
    transitionPath,
    constants,
    errorCodes
}
export type { ErrorCodes, Constants } from './constants'

export default createRouter
