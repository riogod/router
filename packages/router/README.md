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

## 🚀 Quick Start

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
router.usePlugin(browserPlugin())
router.start()

// Navigation
router.navigate('users.detail', { id: '123' })
```

### With React

```jsx
import React from 'react'
import { RouterProvider, useRoute, useRouter } from '@riogz/react-router'

function App() {
  return (
    <RouterProvider router={router}>
      <Navigation />
      <RouteContent />
    </RouterProvider>
  )
}

function Navigation() {
  const router = useRouter()
  const route = useRoute()
  
  return (
    <nav>
      <button onClick={() => router.navigate('home')}>
        Home {route.name === 'home' && '(current)'}
      </button>
      <button onClick={() => router.navigate('users')}>
        Users {route.name.startsWith('users') && '(current)'}
      </button>
    </nav>
  )
}
```

## 📦 Package Ecosystem

### Core Packages

| Package | Description | Version | Bundle |
|---------|-------------|---------|----------|
| **[@riogz/router](./packages/router)** | Core router | [![npm](https://img.shields.io/npm/v/@riogz/router.svg)](https://www.npmjs.com/package/@riogz/router) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router@latest&treeshake=[*]) |
| **[@riogz/react-router](./packages/react-router)** | React integration with hooks and components | [![npm](https://img.shields.io/npm/v/@riogz/react-router.svg)](https://www.npmjs.com/package/@riogz/react-router) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/react-router@latest&treeshake=[*]) |

### Plugins

| Package | Description | Version | Bundle |
|---------|-------------|---------|----------|
| **[@riogz/router-plugin-browser](./packages/router-plugin-browser)** | Browser integration (History API, hash) | [![npm](https://img.shields.io/npm/v/@riogz/router-plugin-browser.svg)](https://www.npmjs.com/package/@riogz/router-plugin-browser) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-plugin-browser@latest&treeshake=[*]) |
| **[@riogz/router-plugin-logger](./packages/router-plugin-logger)** | Transition logging for debugging | [![npm](https://img.shields.io/npm/v/@riogz/router-plugin-logger.svg)](https://www.npmjs.com/package/@riogz/router-plugin-logger) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-plugin-logger@latest&treeshake=[*]) |
| **[@riogz/router-plugin-persistent-params](./packages/router-plugin-persistent-params)** | Parameter persistence between transitions | [![npm](https://img.shields.io/npm/v/@riogz/router-plugin-persistent-params.svg)](https://www.npmjs.com/package/@riogz/router-plugin-persistent-params) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-plugin-persistent-params@latest&treeshake=[*]) |

### Utilities

| Package | Description | Version | Bundle |
|---------|-------------|---------|-----------|
| **[@riogz/router-helpers](./packages/router-helpers)** | Route manipulation utilities | [![npm](https://img.shields.io/npm/v/@riogz/router-helpers.svg)](https://www.npmjs.com/package/@riogz/router-helpers) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-helpers@latest&treeshake=[*]) |
| **[@riogz/router-transition-path](./packages/router-transition-path)** | Transition path computation | [![npm](https://img.shields.io/npm/v/@riogz/router-transition-path.svg)](https://www.npmjs.com/package/@riogz/router-transition-path) | ![gzip](https://deno.bundlejs.com/badge?q=@riogz/router-transition-path@latest&treeshake=[*]) |

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

## 🔧 Installation

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

## 📚 Documentation

- **[Core Router](./packages/router/README.md)** — complete API and examples
- **[React Integration](./packages/react-router/README.md)** — hooks, components, HOCs
- **[Browser Plugin](./packages/router-plugin-browser/README.md)** — History API, hash routing
- **[Examples](./examples)** — ready-to-use examples

## 🤝 Compatibility

- **Node.js**: 14+
- **TypeScript**: 4.0+
- **React**: 17.0+ (for @riogz/react-router)
- **Browsers**: modern browsers with ES2018 support

## 📄 License

MIT © [Vyacheslav Krasnyanskiy](https://github.com/riogod)

## 🤝 Contributing

Мы приветствуем вклад от сообщества! Прочитайте [руководство для контрибьюторов](./CONTRIBUTING.md) для получения подробной информации о том, как внести свой вклад в проект.

**Быстрый старт для контрибьюторов:**
- Форкните репозиторий
- Создайте feature ветку от правильной base ветки
- Внесите изменения и добавьте тесты
- Создайте PR в соответствующую target ветку
- Большинство PR идут в `release/vX.Y.Z`

## 🔗 Links

- [GitHub](https://github.com/riogod/router)
- [Issues](https://github.com/riogod/router/issues)
- [Contributing Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
// Trigger CI tests
