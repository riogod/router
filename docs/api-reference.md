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

// Example of updating an existing route and its children
const existingRouteUpdate: Route = {
  name: 'admin', // Assuming 'admin' was added before
  path: '/admin-new-path', // Update path
  meta: { title: 'New Admin Section' }, // Update meta
  children: [
    { name: 'admin.users', path: '/users-new' }, // Update existing child 'admin.users'
    { name: 'admin.audit', path: '/audit' }     // Add new child 'admin.audit'
  ]
};
router.add(existingRouteUpdate);
console.log('Updated admin route and its children.');
```

**Behavior when adding a route with an existing name:**

- If a route definition provided to `router.add()` has a `name` that already exists in the route tree:
    - The existing route node with that name will be **updated** with the properties from the new definition (e.g., `path`, `meta`, `canActivate`, `forwardTo`, etc.).
    - **Children Handling During Update**:
        - If the new route definition includes `children`, these children will be processed against the existing children of the updated node.
        - Children from the new definition that have names matching existing children will cause those existing children to be **updated** recursively using the same logic.
        - Children from the new definition that do not have names matching any existing children will be **added** as new child nodes to the updated parent.
        - Existing child nodes of the parent that are *not* mentioned by name in the `children` array of the new definition will be **preserved**.
    - Path conflicts: If updating a node's path results in a conflict with an existing sibling node (a child of the same parent), an error will be thrown.
- If a route definition uses a dot-separated name (e.g., `'parent.child'`) and the parent segment (e.g., `'parent'`) exists but the child segment does not, the child will be added to the parent.
- If a route definition uses a dot-separated name and the full name already exists, that specific nested route will be updated.
- If a parent segment in a dot-separated name does not exist, an error will be thrown.

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

### `router.removeNode`

Removes a route node and all its children from the router. This operation also cleans up any associated route guards (canActivate, canDeactivate), lifecycle hooks (onEnterNode, onExitNode), browser title configurations, forwarding rules, and other settings tied to the removed node and its descendants.

**Signature:**

```typescript
removeNode(name: string): Router<Dependencies>;
```

**Parameters:**

-   `name`: `string`
    The full name of the route node to remove (e.g., `'users.profile'`, `'admin'`).

**Returns:**

-   `Router<Dependencies>`: The router instance, allowing for method chaining.

**Example:**

```typescript
// Assume router is already created with routes:
// home, users, users.list, users.profile, users.profile.view, about

// Remove a top-level node
router.removeNode('about');

// Attempting to build a path for 'about' will now fail (or return null/throw based on router.buildPath behavior)
try {
  const path = router.buildPath('about'); 
  console.log('Path for about:', path); // This line might not be reached if buildPath throws
} catch (e) {
  console.error('Error building path for removed route 'about':', e.message);
}

// Attempting to navigate to 'about' will result in a ROUTE_NOT_FOUND error
router.navigate('about', {}, (err, state) => {
  if (err && err.code === 'ROUTE_NOT_FOUND') { // Assuming errorCodes.ROUTE_NOT_FOUND
    console.log('Navigation to 'about' failed as expected: Route not found.');
  } else if (err) {
    console.error('Unexpected error navigating to 'about':', err);
  }
});

// Remove a nested node and its children
router.removeNode('users.profile');

// Routes 'users.profile' and 'users.profile.view' are now removed.
// Any canActivate, onEnterNode, etc., handlers for these routes are cleared.

try {
  router.buildPath('users.profile', { id: '123' });
} catch (e) {
  console.error('Error building path for removed route 'users.profile':', e.message);
}

try {
  router.buildPath('users.profile.view', { id: '123' });
} catch (e) {
  console.error('Error building path for removed route 'users.profile.view':', e.message);
}

// The parent 'users' and sibling 'users.list' should still exist if not removed
const usersPath = router.buildPath('users');
console.log('Path for users (should still exist):', usersPath); // e.g., /users

const usersListPath = router.buildPath('users.list'); 
console.log('Path for users.list (should still exist):', usersListPath); // e.g., /users/list

// Attempting to remove a non-existent node will not throw an error
router.removeNode('nonexistent.route');
console.log('Attempted to remove a non-existent route, no error expected.');
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

-   An array containing two objects: the first for `canActivate` functions and the second for `canDeactivate`