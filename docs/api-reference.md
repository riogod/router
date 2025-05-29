# API Reference (`@riogz/router`)

This document provides a detailed API reference for the core `@riogz/router` library.

## Core API

The Core API provides the fundamental building blocks for routing.

### `createRouter`

Creates a new router instance. This is the main entry point for using the router.

**Signature:**

```typescript
function createRouter<Dependencies extends DefaultDependencies = DefaultDependencies>(
    routes: Array<Route<Dependencies>> | Route<Dependencies>,
    options?: Partial<Options>,
    dependencies?: Dependencies
): Router<Dependencies>;
```

**Parameters:**

-   `routes`: `Array<Route<Dependencies>> | Route<Dependencies>`
    An array of route definitions or a single route definition. Refer to [Route Node Configuration](./route-configuration.md) for details on how to define routes.
-   `options?`: `Partial<Options>`
    An optional object containing router configuration options. These options customize the router's behavior. See [Router Options](./router-options.md) for a detailed list and explanations (to be created).
-   `dependencies?`: `Dependencies` (extends `DefaultDependencies` which is `Record<string, any>`)
    An optional object of dependencies that you want to make available to middleware, plugins, and route lifecycle functions (`canActivate`, `canDeactivate`, `onEnterNode`, etc.). This is useful for injecting services like an API client, authentication service, etc. See [Dependency Injection](./dependency-injection.md) (to be created).

**Returns:**

-   `Router<Dependencies>`: A new router instance, configured with the provided routes, options, and dependencies.

**Example:**

```typescript
import { createRouter, Route } from '@riogz/router';

interface AppDependencies {
  api: {
    fetchData: (id: string) => Promise<any>;
  };
  authService: {
    isLoggedIn: () => boolean;
  };
}

const routes: Route<AppDependencies>[] = [
  { 
    name: 'home', 
    path: '/', 
    onEnterNode: async (toState, fromState, deps) => {
      console.log('Entering home');
      // deps.api.fetchData('some-id');
    }
  },
  { 
    name: 'profile', 
    path: '/profile',
    canActivate: (router, deps) => (toState, fromState, done) => {
      if (deps?.authService.isLoggedIn()) {
        done();
      } else {
        done({ redirect: { name: 'login' } });
      }
    }
  },
  { name: 'login', path: '/login' }
];

const routerOptions = {
  defaultRoute: 'home',
  trailingSlashMode: 'always',
};

const appDependencies: AppDependencies = {
  api: {
    fetchData: async (id: string) => { /* ... */ return { data: '...' }; }
  },
  authService: {
    isLoggedIn: () => true // or false
  }
};

const router = createRouter<AppDependencies>(
  routes,
  routerOptions,
  appDependencies
);

// Start the router (example)
// router.start(); 

### `router.start`

Starts the router. This typically involves matching the initial URL (e.g., from the browser address bar if using a browser plugin, or a provided start path/state) and transitioning to the matched route. Event listeners are activated.

**Signature:**

```typescript
// When a startPathOrState is provided
start(startPathOrState: string | State, done?: DoneFn): Router<Dependencies>;
// When relying on browser plugin to get current URL, or no specific start path
start(done?: DoneFn): Router<Dependencies>;
```

**Parameters:**

-   `startPathOrState?`: `string | State`
    An optional starting path (e.g., `'/home'`) or a `State` object. If not provided, and a browser plugin is used, the router will attempt to use the current browser URL. If no path/state is provided and no browser integration is active to determine it, the router might navigate to the `defaultRoute` if configured, or the behavior might depend on specific router setup.
-   `done?`: `DoneFn`
    An optional callback function `(err?: any, state?: State) => void` that is called when the initial transition is complete or if an error occurs.

**Returns:**

-   `Router<Dependencies>`: The router instance, allowing for method chaining.

**Example:**

```typescript
// Start with the current browser URL (assuming browser plugin is used)
router.start((err, state) => {
  if (err) {
    console.error('Router start error:', err);
  } else {
    console.log('Router started, current state:', state);
  }
});

// Start with a specific path
// router.start('/users/123');

// Start with a specific state object
// router.start({ name: 'profile', params: { id: '456' } });
```

### `router.stop`

Stops the router. This typically involves cleaning up event listeners and canceling any ongoing transitions. After stopping, the router will no longer respond to navigation events or URL changes.

**Signature:**

```typescript
stop(): void;
```

**Returns:**

- `void`

**Example:**

```typescript
router.stop();
console.log('Router stopped');
```

### `router.isStarted`

Checks if the router is currently in a started state.

**Signature:**

```typescript
isStarted(): boolean;
```

**Returns:**

-   `boolean`: `true` if the router has been started and not yet stopped, `false` otherwise.

**Example:**

```typescript
if (router.isStarted()) {
  console.log('Router is active.');
} else {
  console.log('Router is not active.');
}
```

### `router.navigate`

Navigates to a new route.

**Signature:**

```typescript
navigate(
    routeName: string,
    routeParams?: Params,
    options?: NavigationOptions,
    done?: DoneFn
): CancelFn;
navigate(routeName: string, routeParams?: Params, done?: DoneFn): CancelFn;
navigate(routeName: string, done?: DoneFn): CancelFn;
```

**Parameters:**

-   `routeName`: `string`
    The name of the route to navigate to (e.g., `'profile'`).
-   `routeParams?`: `Params`
    An optional object containing parameters for the route (e.g., `{ id: '123' }`).
-   `options?`: `NavigationOptions`
    Optional navigation options that can control the transition behavior. Common options include:
    *   `replace?: boolean`: If `true`, replaces the current history entry instead of pushing a new one.
    *   `reload?: boolean`: If `true`, forces a reload of the route even if it's already active with the same parameters.
    *   `force?: boolean`: If `true`, forces the navigation, potentially bypassing some `canDeactivate` guards (depending on router configuration and guard implementation).
    *   Other custom options can be passed and accessed by middleware or plugins.
-   `done?`: `DoneFn`
    An optional callback `(err?: any, state?: State) => void` executed when the navigation is complete or an error occurs.

**Returns:**

-   `CancelFn`: A function that can be called to attempt to cancel the ongoing transition. `() => void`.

**Example:**

```typescript
// Navigate to the 'profile' route with parameters
const cancelProfileNav = router.navigate('profile', { id: '123' }, (err, state) => {
  if (err) {
    if (err.cancelled) {
      console.log('Navigation to profile was cancelled');
    } else {
      console.error('Error navigating to profile:', err);
    }
  } else {
    console.log('Successfully navigated to profile:', state);
  }
});

// To attempt to cancel this navigation (e.g., from another part of the app):
// cancelProfileNav();

// Navigate with options
router.navigate('orders', { status: 'pending' }, { replace: true });
```

### `router.navigateToDefault`

Navigates to the default route, if one is configured in the router options (`defaultRoute`).

**Signature:**

```typescript
navigateToDefault(opts?: NavigationOptions, done?: DoneFn): CancelFn;
navigateToDefault(done?: DoneFn): CancelFn;
```

**Parameters:**

-   `opts?`: `NavigationOptions`
    Optional navigation options, similar to those in `router.navigate()`.
-   `done?`: `DoneFn`
    An optional callback `(err?: any, state?: State) => void`.

**Returns:**

-   `CancelFn`: A function to cancel the transition.

**Example:**

```typescript
if (!currentUser && router.getOptions().defaultRoute) {
  router.navigateToDefault({ replace: true }, () => {
    console.log('Redirected to default route.');
  });
}
```

### `router.cancel`

Attempts to cancel the currently ongoing transition, if any.

**Signature:**

```typescript
cancel(): Router<Dependencies>;
```

**Returns:**

-   `Router<Dependencies>`: The router instance.

**Example:**

```typescript
// Sometime after a navigation has started
if (someCondition) {
  router.cancel();
  console.log('Attempted to cancel the current navigation.');
}
```
