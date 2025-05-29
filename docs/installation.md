# Installation & Setup

This guide will walk you through installing `@riogz/router` and its related packages, as well as configuring its core options.

## Installation

`@riogz/router` is a modular library. You typically start by installing the core router and then add any plugins or integrations you need.

### Core Router

This is the main package required for all setups.

```bash
npm install @riogz/router
# or
yarn add @riogz/router
# or
pnpm add @riogz/router
```

### React Integration

If you are using React, you'll want the `@riogz/react-router` package which provides hooks and components for seamless integration.

```bash
npm install @riogz/react-router
# or
yarn add @riogz/react-router
# or
pnpm add @riogz/react-router
```

### Browser Plugin

For applications running in a browser environment, the `router-plugin-browser` is essential for integrating with the browser's History API or hash-based routing.

```bash
npm install @riogz/router-plugin-browser
# or
yarn add @riogz/router-plugin-browser
# or
pnpm add @riogz/router-plugin-browser
```

### Other Useful Packages

-   **`@riogz/router-plugin-logger`**: For debugging route transitions.
    ```bash
    npm install @riogz/router-plugin-logger
    ```
-   **`@riogz/router-plugin-persistent-params`**: To persist URL parameters across navigations.
    ```bash
    npm install @riogz/router-plugin-persistent-params
    ```
-   **`@riogz/router-helpers`**: Utility functions for working with routes.
    ```bash
    npm install @riogz/router-helpers
    ```
-   **`@riogz/router-transition-path`**: For computing transition paths between states.
    ```bash
    npm install @riogz/router-transition-path
    ```

## Basic Setup

Once you have installed the necessary packages, you can create and configure your router instance.

```typescript
import createRouter, { Route, Router } from '@riogz/router';
import browserPlugin from '@riogz/router-plugin-browser';

// 1. Define your routes
const routes: Route[] = [
  { name: 'home', path: '/' },
  { name: 'users', path: '/users' },
  { 
    name: 'users.view', 
    path: '/:id', 
    // You can add more route-specific options here
    // e.g., canActivate, onEnterNode, etc.
  }
];

// 2. Define router options (see details below)
const options = {
  defaultRoute: 'home',
  strictTrailingSlash: true,
  // ... other options
};

// 3. (Optional) Define dependencies to inject
const dependencies = {
  api: /* your API service instance */,
  logger: console
};

// 4. Create the router instance
const router: Router = createRouter(routes, options, dependencies);

// 5. (Optional) Use plugins
router.usePlugin(browserPlugin({
  // Browser plugin specific options, e.g.:
  // useHash: true
}));

// 6. Start the router
router.start((err, state) => {
  if (err) {
    console.error('Router start error:', err);
  } else {
    console.log('Router started, initial state:', state);
  }
});

// Now you can navigate, e.g.:
// router.navigate('users.view', { id: 123 });
```

## `createRouter` Options

The `createRouter` function accepts an optional second argument for configuration options. Here's a detailed breakdown of available options:

```typescript
interface Options {
    /** 
     * Default route to navigate to if no route is matched or on initial load 
     * if no path is specified.
     */
    defaultRoute?: string;
    /** 
     * Default parameters to be applied to all routes. 
     * These can be overridden by route-specific `defaultParams` or navigation params.
     */
    defaultParams?: Params;
    /** 
     * If `true`, a route like `/path/` will only match if the URL also has a trailing slash, 
     * and `/path` will only match if the URL does not.
     * If `false`, both `/path` and `/path/` might match the same route 
     * depending on `trailingSlashMode`.
     * Default: `false`
     */
    strictTrailingSlash: boolean;
    /** 
     * Defines how to handle trailing slashes in URLs.
     * - `'default'`: Keeps the trailing slash as is in the matched path.
     * - `'never'`: Always removes the trailing slash from the matched path.
     * - `'always'`: Always adds a trailing slash to the matched path.
     * Default: `'default'`
     */
    trailingSlashMode: TrailingSlashMode; // 'default' | 'never' | 'always'
    /** 
     * Defines how query parameters are handled during navigation and matching.
     * - `'default'`: Query parameters are parsed and included in the state. They are also part of URL generation.
     * - `'strict'`: Similar to 'default', but unknown query parameters might cause issues or be ignored based on `queryParams.ignoreUnknown`.
     * - `'loose'`: Query parameters are generally ignored for route matching but might be available in the state.
     * - `'none'`: Query parameters are completely ignored.
     * Default: `'default'`
     */
    queryParamsMode: QueryParamsMode; // 'default' | 'strict' | 'loose' | 'none'
    /** 
     * If `true`, the router will automatically clean up internal listeners 
     * (e.g., for `canActivate` guards) when they are no longer needed or when the router stops.
     * Default: `true`
     */
    autoCleanUp: boolean;
    /** 
     * If `false` (default), navigating to a path that does not match any route 
     * will result in an error or a `ROUTE_NOT_FOUND` state (if `defaultRoute` is not set).
     * If `true`, the router might allow such navigations, potentially leading to a 
     * specific "not found" state that your application can handle.
     * Default: `false`
     */
    allowNotFound: boolean;
    /** 
     * If `true`, performs stronger, more optimized matching of route segments.
     * It's generally recommended to keep this enabled for performance.
     * Default: `true`
     */
    strongMatching: boolean;
    /** 
     * If `true`, the matched path (after considering `trailingSlashMode`, etc.) 
     * will be used to update the browser URL if the browser plugin is used. 
     * If `false`, the original navigated path might be retained in the URL.
     * Default: `true`
     */
    rewritePathOnMatch: boolean;
    /** 
     * Advanced options for query parameter parsing and stringification.
     * See `QueryParamsOptions` interface for details (e.g., arrayFormat, booleanFormat, ignoreUnknown).
     */
    queryParams?: QueryParamsOptions;
    /** 
     * If `true`, route matching will be case-sensitive (e.g., `/Users` will not match a route defined with `/users`).
     * If `false`, matching is case-insensitive.
     * Default: `false`
     */
    caseSensitive: boolean;
    /** 
     * Specifies how URL parameters (e.g., `/users/:id`) are encoded and decoded.
     * - `'default'`: Uses standard `encodeURIComponent` / `decodeURIComponent`.
     * - `'uri'`: Uses `encodeURI` / `decodeURI`.
     * - `'uriComponent'`: Same as `'default'`.
     * - `'none'`: No encoding/decoding is applied.
     * Default: `'default'`
     */
    urlParamsEncoding?: URLParamsEncodingType; // 'default' | 'uri' | 'uriComponent' | 'none'
}
```

### Default Options

If you don't provide an options object or omit certain properties, `@riogz/router` will use the following defaults:

```typescript
const defaultOptions: Options = {
    trailingSlashMode: 'default',
    queryParamsMode: 'default',
    strictTrailingSlash: false,
    autoCleanUp: true,
    allowNotFound: false,
    strongMatching: true,
    rewritePathOnMatch: true,
    caseSensitive: false,
    urlParamsEncoding: 'default',
    // defaultRoute: undefined
    // defaultParams: undefined
    // queryParams: undefined (uses internal defaults for QueryParamsOptions)
};
```

Understanding and utilizing these options allows you to fine-tune the router's behavior to precisely match your application's requirements.

## Dependencies

The third argument to `createRouter` is an optional `dependencies` object. This object can contain any values (services, instances, functions, etc.) that you want to make available to your route guards (`canActivate`, `canDeactivate`) and middleware functions.

```typescript
const dependencies = {
  apiService: new APIService(),
  authService: new AuthService(),
  logger: console
};

const router = createRouter(routes, options, dependencies);

// Example usage in a canActivate guard:
const routes = [
  {
    name: 'profile',
    path: '/profile',
    canActivate: (router, deps) => (toState, fromState, done) => {
      // deps.authService is available here!
      if (deps.authService.isAuthenticated()) {
        return done();
      }
      return done({ redirect: { name: 'login' } });
    }
  }
];
```
This dependency injection mechanism helps keep your route logic clean and decoupled from how services are instantiated or accessed.

## Using Plugins

Plugins extend the router's functionality. You can add them using the `router.usePlugin()` method. Most plugins are functions that you call to get the plugin instance, and they might accept their own options.

```typescript
import createRouter, { Router } from '@riogz/router';
import browserPlugin from '@riogz/router-plugin-browser';
import loggerPlugin from '@riogz/router-plugin-logger'; // Assuming you have this installed

// ... routes, options, dependencies setup ...
const router: Router = createRouter(routes, options, dependencies);

// Example: Adding the browser plugin (essential for web apps)
router.usePlugin(browserPlugin({
  useHash: false, // Set to true for hash-based routing, e.g., /#/path
  // base: '/my-app' // If your app is not at the root of the domain
}));

// Example: Adding a logger plugin for development
// Make sure @riogz/router-plugin-logger is installed
if (process.env.NODE_ENV === 'development') {
  router.usePlugin(loggerPlugin);
}

router.start();
```

To use a plugin:
1.  **Install** the plugin package (e.g., `npm install @riogz/router-plugin-browser`).
2.  **Import** it into your router setup file.
3.  **Call** `router.usePlugin()` with the plugin factory, potentially passing plugin-specific options.

Each plugin can hook into various lifecycle events of the router. Refer to the documentation for each specific plugin to learn about its capabilities and configuration options. For more general information on the plugin system, see the [Plugins documentation](./advanced/plugins.md).

## Using Middleware

Middleware functions allow you to execute custom logic during navigation attempts. They are added using `router.useMiddleware()`.

A middleware factory is a function that receives the `router` instance and any `dependencies` you've injected. This factory should return the actual middleware function, which then processes `toState`, `fromState`, and a `done` callback.

```typescript
import createRouter, { Router, MiddlewareFactory, State, DoneFn } from '@riogz/router';

// ... routes, options, dependencies setup ...
// Assume `dependencies` includes `logger` and `authService`
const router: Router = createRouter(routes, options, dependencies);

// Example: Basic logging middleware
const simpleLoggerMiddleware: MiddlewareFactory = (routerInstance, deps) => 
  (toState: State, fromState: State | null, done: DoneFn) => {
    deps.logger.log(`Navigating to ${toState.name}`);
    done(); // IMPORTANT: Always call done() to proceed or handle the transition.
  };

router.useMiddleware(simpleLoggerMiddleware);

// Example: An authentication check middleware (simplified)
const checkAuthMiddleware: MiddlewareFactory = (routerInstance, deps) => 
  (toState: State, fromState: State | null, done: DoneFn) => {
    const requiresAuth = toState.meta?.requiresAuth; // Assume routes can have a meta field
    if (requiresAuth && !deps.authService.isAuthenticated()) {
      // Redirect to login, preserving the intended destination
      return done({ redirect: { name: 'login', params: { redirectPath: toState.path } } });
    }
    done();
  };

router.useMiddleware(checkAuthMiddleware);

router.start();
```

To use middleware:
1.  **Define** a middleware factory. This factory function will receive the `router` and `dependencies`.
2.  The factory should **return** the middleware function itself, which takes `(toState, fromState, done)`.
3.  **Call** `router.useMiddleware()` with your middleware factory.

Middleware functions are executed in the order they are added. The `done` callback is crucial for controlling the navigation flow:
-   `done()`: Continues to the next middleware or proceeds with the navigation.
-   `done(error)`: Stops the navigation and can trigger an error state.
-   `done({ redirect: { name: 'routeName', params: {...} } })`: Initiates a redirect to a different route.
-   `done(false)`: Silently cancels the current navigation attempt.

For more comprehensive details on creating and using middleware, please refer to the [Middleware documentation](./advanced/middleware.md).
