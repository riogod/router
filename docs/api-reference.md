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

### `router.config`

An internal configuration object that holds the resolved options for the router instance. This object is typically read-only for users, and router behavior should be configured via `createRouter` options or `router.setOption()`.

**Type:** `Config` (Represents the resolved router options)

**Usage:**

```typescript
// Note: Direct modification of router.config is not recommended.
// Use router.getOptions() to view current options.
const currentConfig = router.config;
console.log('Current router trailing slash mode:', currentConfig.trailingSlashMode);
```

### `router.rootNode`

The root node of the route tree structure. This property provides access to the hierarchical organization of routes defined in the router. Each node in the tree is an instance of `RouteNode`.

**Type:** `RouteNode`

**Usage:**

```typescript
const root = router.rootNode;
console.log('Root node name:', root.name); // Usually a default root name like '__root__'
console.log('Children of root:', root.children);

// You can traverse the route tree starting from rootNode
root.children.forEach(childNode => {
  console.log('Child route:', childNode.name, 'Path:', childNode.path);
});
```

### `router.add`

Adds one or more routes to the router instance after it has been created. This is useful for dynamically adding routes, for example, based on user permissions or feature flags.

**Signature:**

```typescript
add(
    routes: Array<Route<Dependencies>> | Route<Dependencies>,
    finalSort?: boolean
): Router<Dependencies>;
```

**Parameters:**

-   `routes`: `Array<Route<Dependencies>> | Route<Dependencies>`
    A single route definition object or an array of route definition objects. Refer to [Route Node Configuration](./route-configuration.md) for details on the `Route` structure.
-   `finalSort?`: `boolean`
    An optional boolean (defaulting to `true` internally if not adding incrementally) that indicates whether to re-sort the entire route tree after adding the new routes. For incrementally adding routes, this might be handled differently internally.

**Returns:**

-   `Router<Dependencies>`: The router instance, allowing for method chaining.

**Example:**

```typescript
// Assume router is already created
// const router = createRouter([...initialRoutes]);

const newAdminRoute: Route = {
  name: 'admin',
  path: '/admin',
  children: [
    { name: 'admin.dashboard', path: '/dashboard' }
  ]
};

router.add(newAdminRoute);
console.log('Added admin route.');

// Add multiple routes
const moreRoutes: Route[] = [
  { name: 'reports', path: '/reports' },
  { name: 'settings', path: '/settings' }
];
router.add(moreRoutes);
console.log('Added more routes.');

// Navigate to a newly added route
router.navigate('admin.dashboard');
```

### `router.addNode`

Adds a single route node programmatically. This is a lower-level way to add a route compared to `router.add()`, which takes a route definition object.

**Signature:**

```typescript
addNode(
    name: string,
    path: string,
    canActivateHandler?: ActivationFnFactory<Dependencies>
): Router<Dependencies>;
```

**Parameters:**

-   `name`: `string`
    The unique name for the new route (e.g., `'categories.view'`).
-   `path`: `string`
    The path pattern for the route (e.g., `'/view/:id'`).
-   `canActivateHandler?`: `ActivationFnFactory<Dependencies>`
    An optional `canActivate` guard factory function for the route.

**Returns:**

-   `Router<Dependencies>`: The router instance for method chaining.

**Example:**

```typescript
// Assume router is already created
// const router = createRouter([]);

router.addNode('products', '/products');
router.addNode('products.detail', '/:id', (router, deps) => (toState, fromState, done) => {
  console.log('Checking access to product details:', toState.params.id);
  // Example: const product = await deps.api.fetchProduct(toState.params.id); if (product) done(); else done({ error: 'NOT_FOUND'});
  done(); 
});

console.log('Programmatically added product routes.');
router.navigate('products.detail', { id: 'abc' });
```

### `router.isActive`

Checks if a specific route, optionally with specific parameters, is currently active. This is useful for highlighting active links in navigation menus or conditionally rendering UI elements based on the current route.

**Signature:**

```typescript
isActive(
    name: string,
    params?: Params,
    strictEquality?: boolean,
    ignoreQueryParams?: boolean
): boolean;
```

**Parameters:**

-   `name`: `string`
    The name of the route to check (e.g., `'users.profile'`).
-   `params?`: `Params`
    An optional object of route parameters to match. If provided, the route is only considered active if the names match AND the parameters match.
-   `strictEquality?`: `boolean`
    (Default: `false`) If `true`, performs a strict equality check on parameter values. Otherwise, a looser comparison is used (e.g., `'123'` might match `123`).
-   `ignoreQueryParams?`: `boolean`
    (Default: `false`) If `true`, query parameters will be ignored when checking for active state. If `false` (default), query parameters are considered for the match if present in the current state.

**Returns:**

-   `boolean`: `true` if the specified route (and parameters, if provided) is active, `false` otherwise.

**Example:**

```typescript
// In a navigation component
const isHomeActive = router.isActive('home');
const isUserProfileActive = router.isActive('profile', { id: '123' });
const isSettingsActiveStrict = router.isActive('settings', { tab: 'general' }, true);

console.log('Is Home active?', isHomeActive);
console.log('Is Profile 123 active?', isUserProfileActive);

if (router.isActive('articles', { category: 'tech' }, false, true)) {
  console.log('Tech articles are being viewed, ignoring other query params.');
}
```

### `router.buildPath`

Builds a URL path string for a given route name and parameters. This is useful for generating links or for server-side redirects.

**Signature:**

```typescript
buildPath(routeName: string, params?: Params): string;
```

**Parameters:**

-   `routeName`: `string`
    The name of the route for which to build the path (e.g., `'users.profile'`).
-   `params?`: `Params`
    An optional object of parameters to populate the path segments and query string (e.g., `{ id: '123', tab: 'settings' }`).

**Returns:**

-   `string`: The generated URL path (e.g., `'/users/123?tab=settings'`). If the route cannot be found or parameters are invalid, it may throw an error or return a specific error path depending on router configuration.

**Example:**

```typescript
const userProfilePath = router.buildPath('profile', { id: '456' });
console.log('User Profile Path:', userProfilePath); // Example: /profile/456

const productPathWithQuery = router.buildPath('products.detail', { 
  productId: 'abc', 
  variant: 'xl', 
  color: 'blue' 
});
console.log('Product Path with Query:', productPathWithQuery); // Example: /products/abc?variant=xl&color=blue

// Assuming a route 'search' with path '/search'
const searchPath = router.buildPath('search', { query: 'awesome router', page: 2 });
console.log('Search path:', searchPath); // Example: /search?query=awesome%20router&page=2
```

### `router.matchPath`

Attempts to match a given URL path string against the defined routes and returns the corresponding router `State` object if a match is found. This is primarily used internally by the router when a navigation occurs (e.g., via browser URL change or `router.navigate()`) but can also be used directly for testing or specific use cases.

**Signature:**

```typescript
matchPath(path: string, source?: string): State | null;
```

**Parameters:**

-   `path`: `string`
    The URL path string to match (e.g., `'/users/789/edit?debug=true'`).
-   `source?`: `string`
    An optional string indicating the source of the path matching attempt (e.g., `'popstate'`, `'navigate'`). Used internally for debugging and logging.

**Returns:**

-   `State | null`: A `State` object if the path successfully matches a defined route, otherwise `null`. The `State` object includes `name`, `params`, `path`, and `meta` properties.

**Example:**

```typescript
const matchedState1 = router.matchPath('/profile/my-user-id');
if (matchedState1) {
  console.log('Matched route:', matchedState1.name, 'Params:', matchedState1.params);
} else {
  console.log('No route matched for /profile/my-user-id');
}

const matchedState2 = router.matchPath('/products/xyz?variant=large#details');
if (matchedState2) {
  console.log('Matched route for products:', matchedState2.name, 'Query Params:', matchedState2.params);
  // Note: The hash (#details) is typically handled by the browser plugin and might not be part of `matchPath`'s direct concern for route definition matching.
}

// Example of a non-matching path
const nonExistentMatch = router.matchPath('/this/path/does/not/exist');
console.log('Match for non-existent path:', nonExistentMatch); // null
```

### `router.setRootPath`

Sets the root path for the router. This is particularly useful when the application is not served from the root of the domain (e.g., `https://example.com/my-app/`). The root path will be prepended to all generated paths and considered when matching paths.

**Signature:**

```typescript
setRootPath(rootPath: string): void;
```

**Parameters:**

-   `rootPath`: `string`
    The root path to set (e.g., `'/my-app'`). It should typically start with a `/` and not end with one, unless it's just `'/'`.

**Returns:**

-   `void`

**Example:**

```typescript
// In an application served from /my-cool-app/
router.setRootPath('/my-cool-app');

// Now, building a path for a route { name: 'home', path: '/' }
const homePath = router.buildPath('home');
console.log(homePath); // Output: /my-cool-app/

// And for a route { name: 'users', path: '/users' }
const usersPath = router.buildPath('users');
console.log(usersPath); // Output: /my-cool-app/users

// When router.matchPath is called, it will expect paths relative to this rootPath if used with browser plugin.
```

**Note:** This setting is often handled by the `base` option in the `browserPlugin` if you are using it for browser integration, which synchronizes this aspect.

### `router.getOptions`

Retrieves the current configuration options of the router instance. This includes both default options and any options overridden during router creation or via `router.setOption()`.

**Signature:**

```typescript
getOptions(): Options;
```

**Returns:**

-   `Options`: An object containing all current router options.

**Example:**

```typescript
const currentOptions = router.getOptions();
console.log('Current default route:', currentOptions.defaultRoute);
console.log('Trailing slash mode:', currentOptions.trailingSlashMode);
console.log('Is case sensitive matching enabled?', currentOptions.caseSensitive);
```

### `router.setOption`

Sets or updates a specific router configuration option after the router has been initialized. Not all options might be dynamically updatable, or changes might only affect subsequent navigations.

**Signature:**

```typescript
setOption(option: keyof Options, value: any): Router<Dependencies>;
```

**Parameters:**

-   `option`: `keyof Options`
    The name of the option to set (e.g., `'defaultRoute'`, `'trailingSlashMode'`). This should be a valid key from the `Options` type.
-   `value`: `any`
    The new value for the specified option.

**Returns:**

-   `Router<Dependencies>`: The router instance, allowing for method chaining.

**Example:**

```typescript
// Initially, allowNotFound might be false
console.log('Allow not found (before):', router.getOptions().allowNotFound);

router.setOption('allowNotFound', true);
console.log('Allow not found (after):', router.getOptions().allowNotFound);

router.setOption('defaultRoute', 'dashboard')
      .setOption('caseSensitive', true);

console.log('New default route:', router.getOptions().defaultRoute);
console.log('Case sensitive (after):', router.getOptions().caseSensitive);
```

**Note:** While many options can be changed, altering fundamental options like `strongMatching` on a live router might have complex implications and should be done with caution.

### `router.makeState`

A utility function to create a router `State` object. This is typically used internally but can be useful for testing or for plugins that need to construct state objects.

**Signature:**

```typescript
makeState(
    name: string,
    params?: Params,
    path?: string, // Usually calculated internally or provided by matchPath
    meta?: any,    // Meta information associated with the state
    forceId?: number // Internal usage for transition IDs
): State;
```

**Parameters:**

-   `name`: `string`
    The name of the route for this state.
-   `params?`: `Params`
    Route parameters (including query parameters).
-   `path?`: `string`
    The URL path corresponding to this state. If not provided, the router might attempt to build it based on `name` and `params`.
-   `meta?`: `any`
    An object to store any meta-information related to this state, such as transition options, error details, or custom data. The `meta.params` sub-object often stores the distinct path, query, and matrix parameters.
-   `forceId?`: `number`
    Typically used internally by the router to assign a transition ID to the state.

**Returns:**

-   `State`: A new `State` object.

**Example:**

```typescript
const homeState = router.makeState('home', {}, '/');
console.log('Created state:', homeState);

const userDetailState = router.makeState(
  'users.detail',
  { id: '777', tab: 'activity' },
  '/users/777?tab=activity',
  { source: 'manual' }
);
console.log('User detail state:', userDetailState);
```

### `router.makeNotFoundState`

Creates a special `State` object representing a "route not found" condition. This is used internally when a navigation attempt fails to match any defined routes and `allowNotFound` option is true or a `defaultRoute` is not applicable.

**Signature:**

```typescript
makeNotFoundState(path: string, options?: NavigationOptions): State;
```

**Parameters:**

-   `path`: `string`
    The path that could not be matched.
-   `options?`: `NavigationOptions`
    Navigation options associated with the attempt that led to the not found state.

**Returns:**

-   `State`: A `State` object with a special name (e.g., `constants.UNKNOWN_ROUTE`) and meta-information about the unmatched path.

**Example:**

```typescript
const notFoundPath = '/this/is/not/a/route';
const notFoundState = router.makeNotFoundState(notFoundPath, { replace: true });

console.log('Not Found State Name:', notFoundState.name); // e.g., '@@router5/UNKNOWN_ROUTE'
console.log('Original Path:', notFoundState.path);
console.log('Params (contains path):', notFoundState.params); // e.g., { path: '/this/is/not/a/route' }
```

### `router.getState`

Synchronously retrieves the current `State` of the router. This state object represents the currently active route, its parameters, path, and any associated metadata.

**Signature:**

```typescript
getState(): State;
```

**Returns:**

-   `State`: The current router state. If the router hasn't been started or no route is active, it might return an initial or default state, or potentially `null` or a state indicating no route is active (behavior can depend on router version and initial setup).

**Example:**

```typescript
// After router has started and navigated
const currentState = router.getState();

if (currentState) {
  console.log('Current active route name:', currentState.name);
  console.log('Current params:', currentState.params);
  console.log('Current full path:', currentState.path);
} else {
  console.log('Router has no active state yet.');
}
```

### `router.setState`

Sets the current state of the router. This is a low-level method and is **typically used internally** by the router during transitions or by plugins that need to directly manipulate the router state. Manually setting the state might bypass parts of the navigation lifecycle (like guards or middleware) and should be used with extreme caution.

**Signature:**

```typescript
setState(state: State): void;
```

**Parameters:**

-   `state`: `State`
    The new `State` object to set as the current router state.

**Returns:**

-   `void`

**Example (Illustrative - Use with caution):**

```typescript
// This is generally not recommended for application-level code.
const newStateManually = {
  name: 'home',
  params: { section: 'featured' },
  path: '/?section=featured',
  meta: { navigatedBy: 'manualSetState' }
};

// router.setState(newStateManually); 
// console.log('Manually set router state to:', router.getState());

// A more legitimate use case might be in a plugin that restores state after async operation.
```

### `router.areStatesEqual`

Compares two `State` objects to determine if they represent the same route and parameters. This is useful for checking if a navigation would result in a change of state or if the target state is identical to the current one.

**Signature:**

```typescript
areStatesEqual(
    state1: State,
    state2: State,
    ignoreQueryParams?: boolean
): boolean;
```

**Parameters:**

-   `state1`: `State`
    The first state object to compare.
-   `state2`: `State`
    The second state object to compare.
-   `ignoreQueryParams?`: `boolean`
    (Default: `false`) If `true`, query parameters will be excluded from the comparison. Only the route name and path parameters will be considered.

**Returns:**

-   `boolean`: `true` if the states are considered equal (same name and parameters, respecting `ignoreQueryParams`), `false` otherwise.

**Example:**

```typescript
const stateA = { name: 'users', params: { sort: 'name' }, path: '/users?sort=name' };
const stateB = { name: 'users', params: { sort: 'name' }, path: '/users?sort=name' };
const stateC = { name: 'users', params: { sort: 'date' }, path: '/users?sort=date' };
const stateD = { name: 'orders', params: { sort: 'name' }, path: '/orders?sort=name' };
const stateE = { name: 'users', params: {}, path: '/users' };

console.log('A equals B:', router.areStatesEqual(stateA, stateB)); // true
console.log('A equals C:', router.areStatesEqual(stateA, stateC)); // false
console.log('A equals D:', router.areStatesEqual(stateA, stateD)); // false

// Ignoring query params
const stateF = { name: 'users', params: { id: '1', filter: 'active'}, path: '/users/1?filter=active' };
const stateG = { name: 'users', params: { id: '1', view: 'card'}, path: '/users/1?view=card' };
console.log('F equals G (ignore query)?', router.areStatesEqual(stateF, stateG, true)); // true, if only path params are considered (name 'users' matches, id '1' could match implicitly based on path structure)
// Note: The exact behavior of areStatesEqual with ignoreQueryParams and how it handles path vs query params should be verified against implementation details if path params are also in `params` object.
// Typically, `ignoreQueryParams` means `state1.name === state2.name` and path parameters derived from route definition match.

const currentState = router.getState();
const targetState = router.makeState('profile', { id: 'current' }, '/profile/current');
if (router.areStatesEqual(currentState, targetState)) {
  console.log('Already on the target profile page.');
}
```

### `router.areStatesDescendants`

Checks if one state is a descendant of another in the route hierarchy. This is useful for determining if the current route is within a specific section of the application (e.g., if `product.edit` is a descendant of `product`).

**Signature:**

```typescript
areStatesDescendants(parentState: State, childState: State): boolean;
```

**Parameters:**

-   `parentState`: `State`
    The potential parent state.
-   `childState`: `State`
    The potential child state.

**Returns:**

-   `boolean`: `true` if `childState` is a descendant of `parentState` (i.e., `childState.name` starts with `parentState.name` followed by a dot, and they share the same root segments), `false` otherwise.

**Example:**

```typescript
const sParent = { name: 'admin', params: {}, path: '/admin' };
const sChild = { name: 'admin.users', params: {}, path: '/admin/users' };
const sGrandChild = { name: 'admin.users.edit', params: {id: 1}, path: '/admin/users/1/edit' };
const sOther = { name: 'dashboard', params: {}, path: '/dashboard' };

console.log('admin.users is descendant of admin:', router.areStatesDescendants(sParent, sChild)); // true
console.log('admin.users.edit is descendant of admin:', router.areStatesDescendants(sParent, sGrandChild)); // true
console.log('admin.users.edit is descendant of admin.users:', router.areStatesDescendants(sChild, sGrandChild)); // true
console.log('admin is descendant of admin.users:', router.areStatesDescendants(sChild, sParent)); // false
console.log('dashboard is descendant of admin:', router.areStatesDescendants(sParent, sOther)); // false

// Practical example
const current = router.getState();
const settingsBaseState = router.makeState('settings', {}, '/settings');
if(router.areStatesDescendants(settingsBaseState, current)) {
    console.log("Currently in a settings sub-section.");
}
```

### `router.forwardState`

This method seems to be related to the `forwardTo` property in route definitions or a programmatic way to declare that one route state essentially acts as an alias or forwards to another. Its exact public API usage might be more internal or for advanced scenarios. The name suggests it might prepare a `SimpleState` object for a forwarding target.

**Signature:**

```typescript
forwardState(routeName: string, routeParams: Params): SimpleState;
```

**Parameters:**

-   `routeName`: `string`
    The name of the route to which to forward.
-   `routeParams`: `Params`
    The parameters for the target forwarded route.

**Returns:**

-   `SimpleState`: A simplified state object, likely containing just `name` and `params`, representing the target of a forward.

**Usage Note:** The primary way to achieve forwarding is typically via the `forwardTo: 'targetRouteName'` property in a route's definition. This method might be an internal helper or for specialized plugin use.

**Example (Conceptual):**

```typescript
// If a route 'old-profile' should forward to 'profile.view' with same ID
// This might be used internally when processing a route with `forwardTo`.

// const currentParams = { id: '123' };
// const targetForwardState = router.forwardState('profile.view', currentParams);
// console.log('Forwarding to:', targetForwardState); // { name: 'profile.view', params: { id: '123' } }

// This is more commonly handled declaratively:
// const routes = [
//   { name: 'old-profile', path: '/old-profile/:id', forwardTo: 'profile.view' },
//   { name: 'profile.view', path: '/profile/:id' }
// ];
```

### `router.buildState`

Builds a full `RouteNodeState` object for a given route name and parameters. This is more comprehensive than `makeState` as it involves looking up the route definition in the route tree and constructing a state that includes path components and other details derived from the route node itself.

**Signature:**

```typescript
buildState(routeName: string, routeParams: Params): RouteNodeState | null;
```

**Parameters:**

-   `routeName`: `string`
    The name of the route.
-   `routeParams`: `Params`
    The parameters for the route.

**Returns:**

-   `RouteNodeState | null`: A `RouteNodeState` object if the route name is valid and a state can be constructed, otherwise `null`. `RouteNodeState` is a more detailed internal representation of a state tied to its node.

**Example:**

```typescript
const userRouteState = router.buildState('users.detail', { id: '999', filter: 'active' });

if (userRouteState) {
  console.log('Built state name:', userRouteState.name);
  console.log('Built state params:', userRouteState.params); 
  // userRouteState will also contain information about the route node itself,
  // path segments, etc., which are not in a simple State object made by makeState.
} else {
  console.log('Could not build state for users.detail, route might not exist.');
}

const nonExistentRouteState = router.buildState('this.route.does.not.exist', {});
console.log(nonExistentRouteState); // null
```

### `router.canDeactivate`

Programmatically registers a `canDeactivate` guard for a specific route. This guard function is called before navigating away from the specified route. It can prevent navigation if it returns `false` or a Promise resolving to `false`, or if it calls `done(err)` or `done(false)`

**Signature:**

```typescript
canDeactivate(
    name: string,
    canDeactivateHandlerFactory: ActivationFnFactory<Dependencies> | boolean
): Router<Dependencies>;
```

**Parameters:**

-   `name`: `string`
    The name of the route to which this `canDeactivate` guard applies.
-   `canDeactivateHandlerFactory`: `ActivationFnFactory<Dependencies> | boolean`
    A factory function that returns the actual guard function, or a boolean. 
    The factory receives `(router, dependencies)` and should return `(toState, fromState, done) => boolean | Promise<boolean> | void`.
    Passing `true` effectively means no guard, `false` means always prevent deactivation (rarely used programmatically).

**Returns:**

-   `Router<Dependencies>`: The router instance for method chaining.

**Example:**

```typescript
// In a component that has unsaved changes
const routeName = 'editor'; // Assuming current route is 'editor'

router.canDeactivate(routeName, (routerInstance, deps) => (toState, fromState, done) => {
  if (hasUnsavedChanges()) { // hasUnsavedChanges() is a hypothetical function
    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
      done(); // Allow navigation
    } else {
      done(false); // Prevent navigation
    }
  } else {
    done(); // Allow navigation
  }
});

// To later navigate away:
// router.navigate('home'); // The guard will be triggered.
```

**Note:** `canDeactivate` guards can also be defined directly in the route configuration. This programmatic way is useful for dynamically adding or managing guards, perhaps based on component lifecycle.

### `router.clearCanDeactivate`

Removes a previously registered `canDeactivate` guard for a specific route.

**Signature:**

```typescript
clearCanDeactivate(name: string): Router<Dependencies>; // Corrected: returns Router, not just Router<Dependencies>
```

**Parameters:**

-   `name`: `string`
    The name of the route from which to remove the `canDeactivate` guard.

**Returns:**

-   `Router<Dependencies>`: The router instance.

**Example:**

```typescript
// After changes are saved or component is unmounted
const routeName = 'editor';
router.clearCanDeactivate(routeName);
console.log(`canDeactivate guard for ${routeName} has been cleared.`);
```

### `router.canActivate`

Programmatically registers a `canActivate` guard for a specific route. This guard function is called before navigating to the specified route. It can prevent navigation if it returns `false`, a Promise resolving to `false`, or calls `done(err)` / `done(false)` / `done({ redirect: ... })`.

**Signature:**

```typescript
canActivate(
    name: string,
    canActivateHandlerFactory: ActivationFnFactory<Dependencies> | boolean
): Router<Dependencies>;
```

**Parameters:**

-   `name`: `string`
    The name of the route to which this `canActivate` guard applies.
-   `canActivateHandlerFactory`: `ActivationFnFactory<Dependencies> | boolean`
    A factory function that returns the actual guard function, or a boolean value. 
    The factory receives `(router, dependencies)` and should return `(toState, fromState, done) => boolean | Promise<boolean> | void | NavigationResponse`.

**Returns:**

-   `Router<Dependencies>`: The router instance for method chaining.

**Example:**

```typescript
const adminRouteName = 'admin.dashboard';

router.canActivate(adminRouteName, (routerInstance, deps) => (toState, fromState, done) => {
  // const { authService } = deps; // Assuming authService is injected
  // if (authService.isAdmin()) {
  //   done();
  // } else {
  //   done({ redirect: { name: 'login', params: { redirectedFrom: toState.name } } });
  // }
  // Simplified for example:
  const isAdmin = true; // Replace with actual auth check
  if (isAdmin) {
    console.log('Access granted to admin dashboard by programmatic guard.');
    done();
  } else {
    console.log('Access denied to admin dashboard, redirecting.');
    done({ redirect: { name: 'login' } });
  }
});

// router.navigate(adminRouteName); // This would trigger the guard.
```

**Note:** Like `canDeactivate`, `canActivate` guards are often defined in route configurations. This programmatic method is for dynamic scenarios.

### `router.getLifecycleFactories`

Retrieves the registered `canActivate` and `canDeactivate` guard *factories*. These are the functions you provide that, when called, return the actual guard functions.

**Signature:**

```typescript
getLifecycleFactories(): [
    { [key: string]: ActivationFnFactory<Dependencies> }, // canActivate factories
    { [key: string]: ActivationFnFactory<Dependencies> }  // canDeactivate factories
];
```

**Returns:**

-   An array containing two objects: the first for `canActivate` factories and the second for `canDeactivate` factories, keyed by route name.

**Usage:** Primarily for internal use or advanced debugging/plugin development to inspect registered guard factories.

### `router.getLifecycleFunctions`

Retrieves the actual `canActivate` and `canDeactivate` guard *functions* (the functions returned by the factories). These are the functions that are executed during the transition process.

**Signature:**

```typescript
getLifecycleFunctions(): [
    { [key: string]: ActivationFn }, // canActivate functions
    { [key: string]: ActivationFn }  // canDeactivate functions
];
```

**Returns:**

-   An array containing two objects: the first for `canActivate` functions and the second for `canDeactivate` functions, keyed by route name.

**Usage:** Primarily for internal use or advanced debugging/plugin development to inspect the resolved guard functions.

### `router.getRouteLifecycleFactories`

Retrieves factories for route-level lifecycle hooks like `onEnterNode`, `onExitNode`, and `onNodeInActiveChain` that might have been defined directly on route configurations.

**Signature (Conceptual - actual return type might be more specific):**

```typescript
getRouteLifecycleFactories(): {
    onEnterNode: { [key: string]: (router: Router, deps: Dependencies) => (state: State, fromState: State) => Promise<void> },
    onExitNode: { [key: string]: (router: Router, deps: Dependencies) => (state: State, fromState: State) => Promise<void> },
    onNodeInActiveChain: { [key: string]: (router: Router, deps: Dependencies) => (state: State, fromState: State) => Promise<void> }
};
```

**Usage:** Internal mechanism for the router to access and invoke these lifecycle hooks during transitions. Not typically called directly by application code.

### `router.getRouteLifecycleFunctions`

Retrieves the actual resolved functions for route-level lifecycle hooks like `onEnterNode`, `onExitNode`.

**Signature (Conceptual):**

```typescript
getRouteLifecycleFunctions(): {
    onEnterNode: { [key: string]: (state: State, fromState: State) => Promise<void> },
    onExitNode: { [key: string]: (state: State, fromState: State) => Promise<void> },
    onNodeInActiveChain: { [key: string]: (state: State, fromState: State) => Promise<void> }
};
```

**Usage:** Internal mechanism. These are the functions executed by the router when a route node is entered, exited, or part of the active chain.

### `router.getBrowserTitleFunctions`

Retrieves functions responsible for determining the browser/document title for routes that have a `browserTitle` property defined (either as a string or a function) in their configuration.

**Signature:**

```typescript
getBrowserTitleFunctions(): { [key: string]: string | ((state: State, deps: Dependencies) => Promise<string>) };
```

**Returns:**

-   An object where keys are route names and values are either the static title string or a function that resolves to the title string.

**Usage:** Used internally, often by a browser plugin, to update the document title upon successful navigation.

### `router.registerOnEnterNode` / `router.registerOnExitNode` / `router.registerOnNodeInActiveChain` / `router.registerBrowserTitle`

These methods are **internal** mechanisms for the router to register lifecycle hooks and browser title handlers that are typically defined declaratively within the route objects during `createRouter` or `router.add()`. They are not intended for direct public use. Their purpose is to populate the internal collections that `getRouteLifecycleFunctions` and `getBrowserTitleFunctions` would later retrieve for execution.

**Example (Conceptual - Illustrating internal registration):**

```typescript
// When a route like this is processed:
// { 
//   name: 'myRoute', 
//   path: '/my-route', 
//   onEnterNode: async (toState, fromState, deps) => { console.log('Entering!'); },
//   browserTitle: (state, deps) => `Page: ${state.params.title}`
// }

// Internally, something like this might happen:
// router.registerOnEnterNode('myRoute', onEnterNodeHandlerFromConfig);
// router.registerBrowserTitle('myRoute', browserTitleHandlerFromConfig);
```

### `router.findFirstAccessibleChild`

An **internal** method used to implement the `redirectToFirstAllowNode` functionality. When a route with `redirectToFirstAllowNode: true` is activated, this method is called to find the first child route that can be activated (i.e., its `canActivate` guards pass).

**Signature (Conceptual):**

```typescript
findFirstAccessibleChild(routeName: string, params?: any): Promise<string | null>;
```

**Parameters:**

- `routeName`: The name of the parent route that has `redirectToFirstAllowNode: true`.
- `params?`: Current parameters that might be relevant for child route activation.

**Returns:**

- A Promise that resolves to the name of the first accessible child route, or `null` if none are found or accessible.

**Usage:** This is an internal helper for the redirection logic and not for direct public invocation.

### `router.usePlugin`

Registers one or more plugin factories with the router instance. Plugins extend the router's functionality, for example, by adding browser integration, logging, or specific state handling logic. This method typically calls the plugin factory, allowing the plugin to initialize itself and attach to the router.

**Signature:**

```typescript
usePlugin(...pluginFactories: Array<PluginFactory<Dependencies>>): Unsubscribe;
```

**Parameters:**

-   `...pluginFactories`: `Array<PluginFactory<Dependencies>>`
    A rest parameter for one or more plugin factory functions. A `PluginFactory` is a function that usually takes `(router: Router, dependencies?: Dependencies)` as arguments and returns a `Plugin` object (or void if it self-registers listeners). The `Plugin` object often has `onStart`, `onStop`, `onTransitionSuccess`, etc., lifecycle methods that the router will call.

**Returns:**

-   `Unsubscribe`: A function that, when called, will attempt to unregister all plugins added in this `usePlugin` call. This typically involves calling an `onStop` or `teardown` method on each plugin if provided by the plugin.

**Example:**

```typescript
import browserPlugin from '@riogz/router-plugin-browser';
import loggerPlugin from '@riogz/router-plugin-logger';

// const router = createRouter(routes);

// Register the browser plugin for HTML5 history API integration
const unsubscribeBrowserPlugin = router.usePlugin(browserPlugin({ useHash: false }));

// Register a logger plugin for debugging transitions
const unsubscribeLoggerPlugin = router.usePlugin(loggerPlugin());

router.start();

// Later, to stop and clean up a specific plugin (if its factory supports it via the returned unsubscribe)
// For example, if browserPlugin returned its own specific unsubscribe for its listeners:
// unsubscribeBrowserPlugin(); // This is conceptual; `usePlugin` returns a general unsubscribe for what it added.

// To attempt to tear down all plugins added via a specific usePlugin call (if supported):
// const unsubscribeAll = router.usePlugin(pluginA, pluginB);
// unsubscribeAll(); // This would call teardown logic for pluginA and pluginB 
```

**Note:** The `Unsubscribe` function returned by `usePlugin` is a general one for the batch of plugins added. Individual plugins might also offer their own more specific teardown if they manage resources outside of what `usePlugin` can track.

### `router.addPlugin`

Adds an already instantiated plugin object to the router. This is a lower-level method compared to `usePlugin` which expects plugin factories. `addPlugin` is typically used by `usePlugin` internally after the factory has created the plugin instance, or in scenarios where plugin instances are managed externally.

**Signature:**

```typescript
addPlugin(plugin: Plugin): Router<Dependencies>;
```

**Parameters:**

-   `plugin`: `Plugin`
    A plugin object, which should conform to the `Plugin` interface (typically having methods like `onStart`, `onStop`, `onTransitionStart`, `onTransitionSuccess`, `onTransitionError`, `onTransitionCancel`).

**Returns:**

-   `Router<Dependencies>`: The router instance for method chaining.

**Usage:** Generally for internal use by `usePlugin` or advanced plugin development.

```typescript
// Conceptual example - usually you use router.usePlugin(pluginFactory)
// const myCustomPluginInstance = { 
//   name: 'my-custom-plugin', 
//   onStart: () => console.log('My plugin started'), 
//   onStop: () => console.log('My plugin stopped'),
//   onTransitionSuccess: (toState, fromState) => { /* ... */ }
// };
// router.addPlugin(myCustomPluginInstance);
```

### `router.getPlugins`

Retrieves an array of the plugin *factories* that have been registered with the router via `usePlugin`.

**Signature:**

```typescript
getPlugins(): Array<PluginFactory<Dependencies>>;
```

**Returns:**

-   `Array<PluginFactory<Dependencies>>`: An array of the plugin factory functions.

**Usage:** For introspection or debugging, to see which plugin factories are configured on the router.

```typescript
const registeredPluginFactories = router.getPlugins();
console.log('Registered plugin factories count:', registeredPluginFactories.length);
registeredPluginFactories.forEach(factory => {
  // console.log(factory.name); // May not always have a useful name property
});
```

### `router.useMiddleware`

Registers one or more middleware factory functions with the router. Middleware functions are invoked in sequence for every navigation attempt (before `canActivate` guards). They can inspect, modify, or augment the transition process, or trigger side effects.

**Signature:**

```typescript
useMiddleware(...middlewareFactories: Array<MiddlewareFactory<Dependencies>>): Unsubscribe;
```

**Parameters:**

-   `...middlewareFactories`: `Array<MiddlewareFactory<Dependencies>>`
    A rest parameter for one or more middleware factory functions. A `MiddlewareFactory` is a function like `(router: Router, dependencies?: Dependencies) => MiddlewareFn`. The `MiddlewareFn` itself is typically `(toState, fromState, done) => Promise<any> | any | void`. The `done` callback in middleware is crucial for controlling the flow: `done()` to proceed, `done(err)` to error, `done(false)` to cancel, or `done({ redirect: ...})` to redirect.

**Returns:**

-   `Unsubscribe`: A function that, when called, removes all middleware added in this specific `useMiddleware` call.

**Example:**

```typescript
// Logging middleware factory
const loggingMiddlewareFactory: MiddlewareFactory<any> = (router, deps) => 
  (toState, fromState, done) => {
    console.log(`Attempting to navigate from ${fromState?.name || 'N/A'} to ${toState.name}`, toState.params);
    done(); // Proceed with the transition
  };

// Data fetching middleware factory (conceptual)
const fetchDataMiddlewareFactory: MiddlewareFactory<any> = (router, deps) => 
  async (toState, fromState, done) => {
    if (toState.meta?.needsData) {
      try {
        // const data = await deps.api.fetchDataForRoute(toState.name, toState.params);
        // toState.meta.data = data; // Augment state with fetched data
        done();
      } catch (error) {
        done(error); // Signal an error in transition
      }
    } else {
      done();
    }
  };

const unsubscribeLogging = router.useMiddleware(loggingMiddlewareFactory);
// const unsubscribeDataFetching = router.useMiddleware(fetchDataMiddlewareFactory);

// To remove the logging middleware later:
// unsubscribeLogging();
```

### `router.clearMiddleware`

Removes all registered middleware functions from the router.

**Signature:**

```typescript
clearMiddleware(): Router<Dependencies>;
```

**Returns:**

-   `Router<Dependencies>`: The router instance for method chaining.

**Example:**

```typescript
router.clearMiddleware();
console.log('All middleware have been cleared.');
```

### `router.getMiddlewareFactories`

Retrieves an array of the middleware *factories* that have been registered with the router via `useMiddleware`. These are the functions you provided which return the actual middleware functions.

**Signature:**

```typescript
getMiddlewareFactories: () => Array<MiddlewareFactory<Dependencies>>;
```

**Returns:**

-   `Array<MiddlewareFactory<Dependencies>>`: An array of the registered middleware factory functions.

**Usage:** For introspection or debugging.

```typescript
const factories = router.getMiddlewareFactories();
console.log(`There are ${factories.length} middleware factories registered.`);
```

### `router.getMiddlewareFunctions`

Retrieves an array of the actual resolved middleware *functions* (the functions returned by the factories) that are currently active on the router.

**Signature:**

```typescript
getMiddlewareFunctions: () => Middleware[]; // Middleware is (toState, fromState, done) => ...
```

**Returns:**

-   `Middleware[]`: An array of the middleware functions that will be executed during transitions.

**Usage:** For introspection or advanced debugging to inspect the exact middleware pipeline.

```typescript
const middlewarePipeline = router.getMiddlewareFunctions();
console.log(`Current middleware pipeline has ${middlewarePipeline.length} functions.`);
```

### `router.setDependency`

Sets or updates a single dependency in the router's dependency injection container. Dependencies are made available to middleware, plugins, and route lifecycle functions (like `canActivate`, `onEnterNode`).

**Signature:**

```typescript
setDependency(dependencyName: string, dependency: any): Router<Dependencies>;
```

**Parameters:**

-   `dependencyName`: `string`
    The name (key) of the dependency to set.
-   `dependency`: `any`
    The actual dependency instance or value (e.g., an API service instance, a configuration object).

**Returns:**

-   `Router<Dependencies>`: The router instance for method chaining.

**Example:**

```typescript
// const router = createRouter(routes, options); // Initialized without some dependencies

const apiService = { fetchData: async (id) => ({ id, data: "Sample data" }) };
router.setDependency('apiService', apiService);

const authService = { getCurrentUser: async () => ({ name: "Admin" }) };
router.setDependency('authService', authService);

console.log('Dependencies set programmatically.');

// These dependencies can now be accessed in guards/middleware if they were defined to receive them.
// e.g., in a guard factory: (router, deps) => { const user = deps.authService.getCurrentUser(); ... }
```

### `router.setDependencies`

Sets or replaces the entire dependencies object in the router's dependency injection container. This overwrites any previously existing dependencies.

**Signature:**

```typescript
setDependencies(dependencies: Dependencies): Router<Dependencies>;
```

**Parameters:**

-   `dependencies`: `Dependencies`
    An object where keys are dependency names and values are the dependency instances. The type `Dependencies` is generic and defined when creating the router.

**Returns:**

-   `Router<Dependencies>`: The router instance for method chaining.

**Example:**

```typescript
interface MyAppDeps {
  logger: Console;
  config: { apiUrl: string };
}

// const router = createRouter<MyAppDeps>(routes, options);

const myAppDependencies: MyAppDeps = {
  logger: console,
  config: { apiUrl: 'https://api.example.com' }
};

router.setDependencies(myAppDependencies);
console.log('Entire dependencies object has been set.');

// To access:
// router.getDependencies().logger.log('Hello from injected logger!');
```

### `router.getDependencies`

Retrieves the complete dependencies object currently configured in the router.

**Signature:**

```typescript
getDependencies(): Dependencies;
```

**Returns:**

-   `Dependencies`: The object containing all registered dependencies.

**Example:**

```typescript
const allDependencies = router.getDependencies();
if (allDependencies.apiService) {
  // allDependencies.apiService.callSomething();
}
console.log('Current dependencies:', allDependencies);
```

### `router.getInjectables`

Returns a tuple containing the router instance itself and its dependencies object. This is often used internally by factory functions (for guards, middleware, plugins) to receive both `router` and `dependencies` as arguments.

**Signature:**

```typescript
getInjectables(): [Router<Dependencies>, Dependencies];
```

**Returns:**

-   `[Router<Dependencies>, Dependencies]`: A tuple where the first element is the router instance and the second is the dependencies object.

**Example:**

```typescript
const [routerInstance, deps] = router.getInjectables();

// This is how factories typically receive them:
// const myGuardFactory = (routerFromInjectables, dependenciesFromInjectables) => {
//   // ... use routerFromInjectables and dependenciesFromInjectables
//   return (toState, fromState, done) => { /* ... */ };
// };

// const actualGuard = myGuardFactory(...router.getInjectables());
```

### `router.executeFactory`

Executes a given factory function, providing it with the router instance and its dependencies as arguments. This is a utility for invoking factories in a context where they need access to these injectables.

**Signature:**

```typescript
executeFactory(
    factory: (router?: Router<Dependencies>, dependencies?: Dependencies) => any
): any;
```

**Parameters:**

-   `factory`: `(router?: Router<Dependencies>, dependencies?: Dependencies) => any`
    The factory function to execute. It will be called with `router` and `dependencies`. 

**Returns:**

-   `any`: The result returned by the executed factory function.

**Example:**

```typescript
const myCustomFactory = (rtr, dps) => {
  console.log('Factory executed! Router started?', rtr.isStarted());
  // if (dps.configService) { console.log(dps.configService.getSomeValue()); }
  return 'FactoryResult';
};

const result = router.executeFactory(myCustomFactory);
console.log('Result from executed factory:', result); // FactoryResult
```

### `router.invokeEventListeners` (Internal)

This method is typically **internal** and used by the router or plugins to dispatch events to registered listeners for a specific event name.

**Signature (Conceptual):**

```typescript
invokeEventListeners(eventName: string, ...args: any[]): void;
```

**Usage:** Not meant for direct public use. Plugins might use it if they introduce custom events, or the router uses it for its own lifecycle events (e.g., `transitionStart`, `transitionSuccess`).

### `router.removeEventListener`

Removes a previously registered event listener for a specific event name.

**Signature:**

```typescript
removeEventListener(eventName: string, callback: (...args: any[]) => void): void;
```

**Parameters:**

-   `eventName`: `string`
    The name of the event from which to remove the listener (e.g., 'transitionSuccess', 'pluginError').
-   `callback`: `(...args: any[]) => void`
    The specific callback function that was originally passed to `addEventListener`. It must be the same function reference.

**Returns:**

- `void`

**Example:**

```typescript
const onTransitionStartCallback = (toState, fromState) => {
  console.log('Transition starting (from removeEventListener example):', toState.name);
};

router.addEventListener('transitionStart', onTransitionStartCallback);

// ... later ...
router.removeEventListener('transitionStart', onTransitionStartCallback);
console.log('Removed onTransitionStartCallback.');
```

### `router.addEventListener`

Registers an event listener for a specific router event. The router emits various events throughout its lifecycle and during transitions (e.g., `transitionStart`, `transitionSuccess`, `transitionError`, `transitionCancel`, `pluginError`).

**Signature:**

```typescript
addEventListener(eventName: string, callback: (...args: any[]) => void): Unsubscribe;
```

**Parameters:**

-   `eventName`: `string`
    The name of the event to listen to.
-   `callback`: `(...args: any[]) => void`
    The function to be called when the event is emitted. The arguments passed to the callback depend on the event.

**Returns:**

-   `Unsubscribe`: A function that, when called, will remove this specific event listener. `() => void`.

**Example:**

```typescript
const handleTransitionSuccess = (toState, fromState) => {
  console.log(`Successfully transitioned to ${toState.name} from ${fromState?.name || 'N/A'}`);
};

const unsubscribeSuccess = router.addEventListener('transitionSuccess', handleTransitionSuccess);

const handleTransitionError = (toState, fromState, err) => {
  console.error(`Error during transition to ${toState.name}:`, err);
  // Assuming errorCodes are available, e.g., from import { errorCodes } from '@riogz/router';
  // if (err.code === errorCodes.TRANSITION_CANCELLED) { 
  //     console.warn('Transition was cancelled by user or guard.');
  // }
};
const unsubscribeError = router.addEventListener('transitionError', handleTransitionError);

// router.navigate(...); // This would trigger the listeners

// To stop listening later:
// unsubscribeSuccess();
// unsubscribeError();
```

### `router.forward` (Potentially Deprecated or Internal)

This method's name suggests forwarding from one route to another, possibly as part of a transition. However, its direct public use is unclear without more context from the router's specific design. The `forwardTo` property in route definitions or `done({ redirect: ... })` in guards/middleware are the more common ways to achieve redirection or forwarding.

**Signature:**

```typescript
forward(fromRoute: string, toRoute: string): Router<Dependencies>;
```

**Parameters:**

-   `fromRoute`: `string`
    The name of the route to which to forward.
-   `toRoute`: `string`
    The name of the route to forward to.

**Returns:**

-   `Router<Dependencies>`: The router instance.

**Usage Note:** This might be an internal helper or part of an older API. Prefer declarative `forwardTo` or `redirect` objects for route forwarding logic.

### `router.transitionToState` (Core Internal Method)

This is a **core internal method** responsible for executing the actual transition process from a current state to a target state. It orchestrates the execution of middleware, `canDeactivate` guards for outgoing routes, `canActivate` guards for incoming routes, and finally, updating the router's current state and notifying subscribers and plugins.

**Signature (Conceptual):**

```typescript
transitionToState(
    toState: State,         // The target state to transition to
    fromState: State,       // The current state (or previous state)
    options: NavigationOptions, // Navigation options for this transition
    done: DoneFn            // Callback to be invoked upon completion or error
): void; // Or CancelFn if the process itself can be cancelled at this level
```

**Usage:** This method is the heart of the router's navigation logic and is **not intended for direct public invocation**. It is called internally by `router.navigate()`, `router.start()`, and potentially by plugins that trigger navigation.

### `router.subscribe`

Subscribes a listener function to router state changes. The listener is called after every successful navigation or when the router's state is updated programmatically (though the latter is rare for direct `setState` calls unless they also trigger the subscription flow).

**Signature:**

```typescript
subscribe(listener: SubscribeFn | Listener): Unsubscribe | Subscription;
```

**Parameters:**

-   `listener`: `SubscribeFn | Listener`
    A callback function or an observer object.
    -   `SubscribeFn`: `(state: SubscribeState) => void`. The `SubscribeState` object usually contains `route` (the new current state) and `previousRoute` (the state before the transition).
    -   `Listener`: An object with a `next(state: SubscribeState)` method (RxJS-like observer pattern).

**Returns:**

-   `Unsubscribe | Subscription`: 
    - If a simple `SubscribeFn` is passed, it returns an `Unsubscribe` function `() => void` to remove the listener.
    - If an RxJS-style `Listener` object is passed, it might return a `Subscription` object (also typically having an `unsubscribe()` method).

**Example:**

```typescript
const myStateListener = (subscriptionState) => {
  const { route, previousRoute } = subscriptionState;
  console.log('[Listener] Route changed!');
  console.log('  New route:', route.name, route.params);
  if (previousRoute) {
    console.log('  Old route:', previousRoute.name, previousRoute.params);
  }
  // Update UI, fetch data, etc., based on route
};

const unsubscribeListener = router.subscribe(myStateListener);

// Example with an RxJS-like observer
const myObserver = {
  next: (subscriptionState) => {
    console.log('[Observer] New state:', subscriptionState.route.name);
  },
  error: (err) => { /* ... */, // Optional: if router supports error notifications here
  complete: () => { /* ... */ } // Optional: if router supports completion notifications here
};

const subscriptionObject = router.subscribe(myObserver);

// To stop listening:
// unsubscribeListener();
// subscriptionObject.unsubscribe(); // If it returns a Subscription object