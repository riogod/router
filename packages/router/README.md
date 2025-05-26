[![npm version](https://badge.fury.io/js/@riogz%2Frouter.svg)](https://badge.fury.io/js/@riogz%2Frouter)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

# @riogz/router

A simple, lightweight, powerful, view-agnostic, modular and extensible router for JavaScript applications.

## Features

- 🚀 **Lightweight**: Minimal footprint with no external dependencies (except for transition utilities)
- 🔧 **View-agnostic**: Works with any framework or vanilla JavaScript
- 🧩 **Modular**: Plugin-based architecture for extensibility
- 🔄 **Reactive**: Observable pattern for state management
- 🛡️ **Type-safe**: Full TypeScript support with comprehensive type definitions
- 🌐 **Universal**: Works in both browser and Node.js environments
- ⚡ **Performance**: Efficient route matching and state management

## Installation

```bash
npm install @riogz/router
```

## Quick Start

```typescript
import createRouter from '@riogz/router'

// Define your routes
const routes = [
  { name: 'home', path: '/' },
  { name: 'users', path: '/users' },
  { name: 'user', path: '/users/:id' },
  { name: 'posts', path: '/posts/:id?' }
]

// Create router instance
const router = createRouter(routes)

// Subscribe to route changes
router.subscribe(({ route, previousRoute }) => {
  console.log('Navigated to:', route.name)
  console.log('Route params:', route.params)
})

// Start the router
router.start()

// Navigate programmatically
router.navigate('user', { id: '123' })
```

## Core Concepts

### Routes

Routes define the structure of your application's navigation:

```typescript
import { Route } from '@riogz/router'

const routes: Route[] = [
  {
    name: 'home',
    path: '/',
    browserTitle: 'Home Page'
  },
  {
    name: 'users',
    path: '/users',
    children: [
      {
        name: 'user',
        path: '/:id',
        browserTitle: (state) => Promise.resolve(`User ${state.params.id}`)
      }
    ]
  }
]
```

### Router Options

Configure router behavior with options:

```typescript
import createRouter, { Options } from '@riogz/router'

const options: Partial<Options> = {
  defaultRoute: 'home',
  strictTrailingSlash: false,
  queryParamsMode: 'default',
  autoCleanUp: true,
  allowNotFound: true,
  caseSensitive: false
}

const router = createRouter(routes, options)
```

### Navigation

Navigate between routes programmatically:

```typescript
// Navigate to a route
router.navigate('user', { id: '123' })

// Navigate with options
router.navigate('user', { id: '123' }, { 
  replace: true,
  reload: false 
})

// Navigate with callback
router.navigate('user', { id: '123' }, (err) => {
  if (err) {
    console.error('Navigation failed:', err)
  } else {
    console.log('Navigation successful')
  }
})
```

### State Management

Access and manage router state:

```typescript
// Get current state
const currentState = router.getState()

// Check if route is active
const isActive = router.isActive('user', { id: '123' })

// Build path for route
const path = router.buildPath('user', { id: '123' }) // '/users/123'

// Match path to route
const matchedState = router.matchPath('/users/123')
```

## Advanced Features

### Route Guards

Protect routes with activation guards:

```typescript
const routes = [
  {
    name: 'admin',
    path: '/admin',
    canActivate: (router, dependencies) => (toState, fromState, done) => {
      if (dependencies.auth.isAuthenticated()) {
        done()
      } else {
        router.navigate('login')
        done(new Error('Not authenticated'))
      }
    }
  }
]
```

### Route Lifecycle Hooks

Handle route lifecycle events:

```typescript
const routes = [
  {
    name: 'user',
    path: '/users/:id',
    onEnterRoute: async (state, fromState) => {
      console.log('Entering user route:', state.params.id)
      // Load user data
    },
    onExitRoute: async (state, fromState) => {
      console.log('Exiting user route:', state.params.id)
      // Cleanup
    }
  }
]
```

### Middleware

Add middleware for cross-cutting concerns:

```typescript
// Authentication middleware
const authMiddleware = (router, dependencies) => 
  (toState, fromState, done) => {
    if (toState.name.startsWith('admin') && !dependencies.auth.isAuthenticated()) {
      router.navigate('login')
      done(new Error('Authentication required'))
    } else {
      done()
    }
  }

router.useMiddleware(authMiddleware)
```

### Plugins

Extend router functionality with plugins:

```typescript
// Logger plugin
const loggerPlugin = (router) => ({
  onTransitionStart: (toState, fromState) => {
    console.log(`Navigating from ${fromState?.name} to ${toState.name}`)
  },
  onTransitionSuccess: (toState, fromState) => {
    console.log(`Successfully navigated to ${toState.name}`)
  },
  onTransitionError: (toState, fromState, error) => {
    console.error(`Navigation failed:`, error)
  }
})

router.usePlugin(loggerPlugin)
```

### Dependencies Injection

Inject dependencies into route handlers:

```typescript
const dependencies = {
  api: new ApiService(),
  auth: new AuthService(),
  logger: new Logger()
}

const router = createRouter(routes, options, dependencies)

// Access dependencies in route guards
const canActivate = (router, dependencies) => (toState, fromState, done) => {
  if (dependencies.auth.isAuthenticated()) {
    done()
  } else {
    done(new Error('Not authenticated'))
  }
}
```

## API Reference

### createRouter(routes, options, dependencies)

Creates a new router instance.

**Parameters:**
- `routes` - Array of route definitions or RouteNode instance
- `options` - Router configuration options (optional)
- `dependencies` - Dependencies to inject (optional)

**Returns:** Router instance

### Router Methods

#### Navigation
- `navigate(routeName, params?, options?, done?)` - Navigate to a route
- `navigateToDefault(options?, done?)` - Navigate to default route
- `start(startPath?, done?)` - Start the router
- `stop()` - Stop the router
- `cancel()` - Cancel current navigation

#### State
- `getState()` - Get current router state
- `setState(state)` - Set router state
- `isActive(name, params?, strict?, ignoreQuery?)` - Check if route is active
- `buildPath(route, params?)` - Build path for route
- `matchPath(path, source?)` - Match path to route

#### Configuration
- `getOptions()` - Get router options
- `setOption(option, value)` - Set router option
- `setDependencies(deps)` - Set dependencies
- `getDependencies()` - Get dependencies

#### Lifecycle
- `canActivate(name, handler)` - Add activation guard
- `canDeactivate(name, handler)` - Add deactivation guard
- `useMiddleware(...middlewares)` - Add middleware
- `usePlugin(...plugins)` - Add plugins

#### Observability
- `subscribe(listener)` - Subscribe to state changes
- `addEventListener(event, callback)` - Add event listener
- `removeEventListener(event, callback)` - Remove event listener

## TypeScript Support

The router is fully typed with comprehensive TypeScript definitions:

```typescript
import createRouter, { Router, Route, State, Options } from '@riogz/router'

interface AppDependencies {
  api: ApiService
  auth: AuthService
}

const router: Router<AppDependencies> = createRouter<AppDependencies>(
  routes,
  options,
  dependencies
)
```

## Examples

### Basic SPA Router

```typescript
import createRouter from '@riogz/router'

const routes = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' }
]

const router = createRouter(routes)

router.subscribe(({ route }) => {
  // Update UI based on current route
  document.getElementById('app').innerHTML = `
    <h1>Current Route: ${route.name}</h1>
    <p>Path: ${route.path}</p>
  `
})

router.start()
```

### Nested Routes

```typescript
const routes = [
  {
    name: 'app',
    path: '/app',
    children: [
      { name: 'dashboard', path: '/dashboard' },
      {
        name: 'users',
        path: '/users',
        children: [
          { name: 'userList', path: '' },
          { name: 'userDetail', path: '/:id' }
        ]
      }
    ]
  }
]
```

### Route Parameters

```typescript
const routes = [
  { name: 'user', path: '/users/:id' },
  { name: 'post', path: '/posts/:postId/comments/:commentId?' }
]

router.navigate('user', { id: '123' }) // /users/123
router.navigate('post', { postId: '456', commentId: '789' }) // /posts/456/comments/789
```

## Browser Integration

For browser-based routing, use with a browser plugin:

```typescript
import createRouter from '@riogz/router'
import browserPlugin from '@riogz/router-plugin-browser'

const router = createRouter(routes)
router.usePlugin(browserPlugin)
router.start()
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## Related Packages

- `@riogz/router-plugin-browser` - Browser integration plugin
- `@riogz/router-plugin-logger` - Logging plugin
- `@riogz/router-helpers` - Utility functions for router
- `@riogz/router-transition-path` - Path transition utilities


```javascript
import createRouter from '@riogz/router'
import browserPlugin from '@riogz/router-plugin-browser'

const routes = [
  { name: 'home', path: '/' },
  { name: 'profile', path: '/profile' }
]

const router = createRouter(routes)

router.usePlugin(browserPlugin())

router.start()
```

**With React \(hooks\)**

```javascript
import React from 'react'
import ReactDOM from 'react-dom'
import { RouterProvider, RouteNode } from '@riogz/react-router'

function App() {
  
  return 
  <>
  <RouteNode nodeName="home">
    Home Page
  </RouteNode>
  <RouteNode nodeName="profile">
    {({ route }) => <Profile userId={route.params.userId} />}
  </RouteNode>
  </>
}

ReactDOM.render(
  <RouterProvider router={router}>
    <App />
  </RouterProvider>,
  document.getElementById('root')
)
```


