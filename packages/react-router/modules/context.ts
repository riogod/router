import React from 'react'
import { RouteContext } from './types'
import { Router } from '@riogz/router'

const createContext = React.createContext
export const routeContext = createContext<RouteContext>(null)
export const routerContext = createContext<Router>(null)
