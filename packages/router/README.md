[![npm version](https://badge.fury.io/js/@riogz%2Frouter.svg)](https://badge.fury.io/js/@riogz%2Frouter)
[![CI](https://github.com/riogod/router/actions/workflows/ci.yml/badge.svg)](https://github.com/riogod/router/actions/workflows/ci.yml)
[![Deploy](https://github.com/riogod/router/actions/workflows/deploy.yml/badge.svg)](https://github.com/riogod/router/actions/workflows/deploy.yml)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router@latest&treeshake=[*])

# @riogz/router

**Modern, flexible and framework-agnostic router** — a continuation of router5 with improved architecture and TypeScript support.

## ✨ Key Features

- 🎯 **Framework Agnostic** — works with any frameworks and libraries
- 🔄 **View/State Separation** — router processes instructions and outputs state updates
- 🌍 **Universal** — works on client and server
- 🧩 **Modular Architecture** — use only what you need
- ⚡ **High Performance** — optimized algorithms and caching
- 🔒 **Type-Safe** — full TypeScript support
- 🛡️ **Route Guards** — access control and transition validation
- 🔗 **Hierarchical Routes** — nested routes and dynamic segments
- 🤹‍♀️ **Compatable with Router5** — use your existing router5 routes, plugins and middlewares

## 🚀 Quick Start

### Installation

```bash
# Core router
npm install @riogz/router

# For React applications
npm install @riogz/router @riogz/react-router

# For browser integration
npm install @riogz/router-plugin-browser

# For debugging
npm install @riogz/router-plugin-logger
```

### Basic Setup

```javascript
import createRouter from '@riogz/router'
import browserPlugin from '@riogz/router-plugin-browser'

const routes = [
  { name: 'home', path: '/' },
  { name: 'users', path: '/users' },
  { name: 'users.detail', path: '/:id' }
]

const router = createRouter(routes)
router.start()

// Navigation
router.navigate('users.detail', { id: '123' })
```

### With React

```jsx
import React from 'react'
import { createRouter, RouterProvider, useRouter } from '@riogz/router'
import browserPlugin from '@riogz/router-plugin-browser'

const routes = [
  { name: 'home', path: '/' },
  { name: 'users', path: '/users' },
  { name: 'users.detail', path: '/:id' }
]

const router = createRouter(routes)
router.usePlugin(browserPlugin())
router.start()

function App() {
  return (
    <RouterProvider router={router}>
      <Navigation />
         <RouteNode nodeName="home">
            <Home />
         </RouteNode>
         <RouteNode nodeName="users" children={Users} />
    </RouterProvider>
  )
}

function Navigation() {
  const router = useRouter()
  
  return (
    <nav>
      <button onClick={() => router.navigate('home')}>
        Home
      </button>
      { /* -or- */}
      <Link routeName="users">Users</Link>
    </nav>
  )

}
```


## 📚 Documentation
* Introduction
  - [About @riogz/router](./docs/README.md)
  - [Core Concepts](./docs/core-concepts.md)
  - [Installation & Setup](./docs/installation.md)
  - [Route configuration](./docs/route-configuration.md)
  - [Observing state](./docs/observing-state.md)
  - [API Reference](./docs/api-reference.md)
* Integration
  - [React] TBD
  - [Browser] TBD
  - [Node.js] TBD
* Advanced
  - [Route Guards] TBD
  - [Plugins] TBD
  - [Middleware] TBD
  - [Transition Path] TBD
  - [Route Helpers] TBD
  - [Listeners plugin] TBD
* Examples
  - Base examples are placed in the [examples](./examples) folder
  - Advanced examples are placed in the [Github: riogod/frontend-modules-mvvm](https://github.com/riogod/frontend-modules-mvvm)
  

  
## 📦 Package Ecosystem

### Core Packages

| Package | Description | Version | Bundle |
|---------|-------------|---------|----------|
| **[@riogz/router](./packages/router)** | Core router | [![npm](https://img.shields.io/npm/v/@riogz/router.svg)](https://www.npmjs.com/package/@riogz/router) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router@*&treeshake=[*]) |
| **[@riogz/react-router](./packages/react-router)** | React integration with hooks and components | [![npm](https://img.shields.io/npm/v/@riogz/react-router.svg)](https://www.npmjs.com/package/@riogz/react-router) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/react-router@*&treeshake=[*]) |

### Plugins

| Package | Description | Version | Bundle |
|---------|-------------|---------|----------|
| **[@riogz/router-plugin-browser](./packages/router-plugin-browser)** | Browser integration (History API, hash) | [![npm](https://img.shields.io/npm/v/@riogz/router-plugin-browser.svg)](https://www.npmjs.com/package/@riogz/router-plugin-browser) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-plugin-browser@*&treeshake=[*]) |
| **[@riogz/router-plugin-logger](./packages/router-plugin-logger)** | Transition logging for debugging | [![npm](https://img.shields.io/npm/v/@riogz/router-plugin-logger.svg)](https://www.npmjs.com/package/@riogz/router-plugin-logger) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-plugin-logger@*&treeshake=[*]) |
| **[@riogz/router-plugin-persistent-params](./packages/router-plugin-persistent-params)** | Parameter persistence between transitions | [![npm](https://img.shields.io/npm/v/@riogz/router-plugin-persistent-params.svg)](https://www.npmjs.com/package/@riogz/router-plugin-persistent-params) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-plugin-persistent-params@*&treeshake=[*]) |

### Utilities

| Package | Description | Version | Bundle |
|---------|-------------|---------|-----------|
| **[@riogz/router-helpers](./packages/router-helpers)** | Route manipulation utilities | [![npm](https://img.shields.io/npm/v/@riogz/router-helpers.svg)](https://www.npmjs.com/package/@riogz/router-helpers) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-helpers@*&treeshake=[*]) |
| **[@riogz/router-transition-path](./packages/router-transition-path)** | Transition path computation | [![npm](https://img.shields.io/npm/v/@riogz/router-transition-path.svg)](https://www.npmjs.com/package/@riogz/router-transition-path) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-transition-path@*&treeshake=[*]) |

## 🎯 Core Concepts

### Hierarchical Routes

```javascript
const routes = [
  { name: 'app', path: '/app' },
  { name: 'app.users', path: '/users' },
  { name: 'app.users.detail', path: '/:id' },
  { name: 'app.users.detail.edit', path: '/edit' }
]

// Resulting paths:
// app → /app
// app.users → /app/users  
// app.users.detail → /app/users/:id
// app.users.detail.edit → /app/users/:id/edit
```

### Route Guards

```javascript
const router = createRouter(routes, {
  defaultRoute: 'home'
})

// Guard for authorization check
router.canActivate('admin', (toState, fromState) => {
  return user.isAuthenticated && user.hasRole('admin')
})

// Async guard
router.canActivate('users.detail', async (toState) => {
  const user = await api.getUser(toState.params.id)
  return user.exists
})
```

### Middleware

```javascript
// Transition logging
router.useMiddleware((toState, fromState) => {
  console.log(`Transition: ${fromState?.name} → ${toState.name}`)
})

// Analytics
router.useMiddleware((toState) => {
  analytics.track('page_view', {
    route: toState.name,
    params: toState.params
  })
})
```

### Route Node Lifecycle

```TypeScript

const routes = [
  { name: 'app', path: '/app' },
  { 
    name: 'app.users', 
    browserTitle: 'Users',
    path: '/users',
    onEnterNode: (toState, fromState, deps) => {
      console.log('Entering users node')
    },
    onExitNode: (toState, fromState, deps) => {
      console.log('Leaving users node')
    },
    onNodeInActiveChain: (toState, fromState, deps) => {
      console.log('Users node is in the active chain')
    },
    children: [
      {
        name: 'app.users.detail',
        path: '/:id'
      }
    ]
  }
]
```

## 🤝 Compatibility

- **Node.js**: 14+
- **TypeScript**: 4.0+
- **React**: 17.0+ (for @riogz/react-router)
- **Browsers**: modern browsers with ES2018 support

## 📄 License

MIT © [Vyacheslav Krasnyanskiy](https://github.com/riogod)

## 🤝 Contributing

We welcome contributions from the community! Read the [contributor's guide](./CONTRIBUTING.md) for detailed information on how to contribute to the project.


## 🔗 Links

- [GitHub](https://github.com/riogod/router)
- [Issues](https://github.com/riogod/router/issues)
- [Contributing Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
