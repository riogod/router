# Route Node Configuration

In `@riogz/router`, routes are defined as an array of `Route` objects. Each object, often referred to as a "route node," describes a specific segment of your application's navigation structure. Understanding how to configure these nodes is key to building a robust routing system.

## Basic Structure

A minimal route definition requires a `name` and a `path`:

```typescript
import { Route } from '@riogz/router';

const routes: Route[] = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  {
    name: 'users',
    path: '/users',
    children: [
      { name: 'users.list', path: '' }, // Matches /users
      { name: 'users.view', path: '/:id' } // Matches /users/123
    ]
  }
];
```

-   `name` (string, required): A unique identifier for the route. Hierarchical names (e.g., `users.view`) are a common convention for nested routes, but not strictly enforced by the name itself; the `children` property defines hierarchy.
-   `path` (string, required): The URL path segment associated with this route. It can include parameters (e.g., `/:id`) and wildcards.

## Configuration Parameters

Beyond `name` and `path`, each route node can be configured with several optional parameters. Below is the interface definition, followed by a detailed description of each parameter:

```typescript
interface Route<Dependencies extends DefaultDependencies = DefaultDependencies> {
    name: string;
    path: string;
    browserTitle?: string | ((state: State, deps: Dependencies) => Promise<string>);
    canActivate?: ActivationFnFactory<Dependencies>;
    canDeactivate?: ActivationFnFactory<Dependencies>;
    forwardTo?: string;
    redirectToFirstAllowNode?: boolean;
    children?: Array<Route<Dependencies>> | RouteNode; // RouteNode is an internal representation
    encodeParams?: (params: Params) => Params;
    decodeParams?: (params: Params) => Params;
    defaultParams?: Params;
    onEnterNode?: (toState: State, fromState: State | null, deps: Dependencies) => Promise<void>;
    onExitNode?: (toState: State | null, fromState: State, deps: Dependencies) => Promise<void>;
    onNodeInActiveChain?: (toState: State, fromState: State | null, deps: Dependencies) => Promise<void>;
    // [key: string]: any; // Allows for custom properties, useful for meta-data
}
```

### Parameter Descriptions

-   **`browserTitle`**?: `string | ((state: State, deps: Dependencies) => Promise<string>)`
    Sets the document title when this route becomes active. It can be a static string or an asynchronous function that receives the target `state` and injected `dependencies`, and resolves to a string.
    *Example:* `browserTitle: 'User Profile'` or `browserTitle: async (state, deps) => \`Profile for ${await deps.api.getUserName(state.params.id)}\``

-   **`canActivate`**?: `ActivationFnFactory<Dependencies>`
    A factory function that returns an activation guard. The guard determines if a transition *to* this route is allowed. The factory receives the `router` instance and `dependencies`. The guard function itself receives `(toState, fromState, done)`. See [Route Guards documentation](./route-guards.md) for more details.
    *Example:* `canActivate: (router, deps) => (toState, fromState, done) => { if (deps.auth.isLoggedIn()) done(); else done({ redirect: { name: 'login' } }); }`

-   **`canDeactivate`**?: `ActivationFnFactory<Dependencies>`
    Similar to `canActivate`, but this guard determines if a transition *away from* this route is allowed. Useful for scenarios like preventing navigation away from a form with unsaved changes. See [Route Guards documentation](./route-guards.md).

-   **`children`**?: `Array<Route<Dependencies>> | RouteNode`
    An array of child `Route` objects, defining nested routes. This is how you create hierarchical routing structures (e.g., `/users/:id/edit` as a child of `/users/:id`).

-   **`decodeParams`**?: `(params: Params) => Params`
    A function to decode parameters specifically for this route *after* they are parsed from a URL and *before* they are passed to `canActivate` or become part of the route state. Useful for type conversion or complex parameter deserialization.
    *Example:* `decodeParams: (params) => ({ ...params, userId: parseInt(params.userId, 10) })`

-   **`defaultParams`**?: `Params`
    An object of default parameter values for this route. If a parameter is not supplied during navigation to this route, its value from `defaultParams` will be used.
    *Example:* `defaultParams: { sortBy: 'name', order: 'asc' }`

-   **`encodeParams`**?: `(params: Params) => Params`
    A function to encode parameters specifically for this route *before* they are used in URL generation (e.g., by `router.buildPath()`). This is the counterpart to `decodeParams`.
    *Example:* `encodeParams: (params) => ({ ...params, date: params.date.toISOString() })`

-   **`forwardTo`**?: `string`
    If specified, navigating to this route will instead forward the navigation to the route name provided in `forwardTo`. The router will attempt to navigate to the `forwardTo` route using the same parameters from the original navigation attempt. Useful for aliasing routes or redirecting from old paths.
    *Example:* `forwardTo: 'users.list'`

-   **`onEnterNode`**?: `(toState: State, fromState: State | null, deps: Dependencies) => Promise<void>`
    An asynchronous lifecycle hook called when this specific route node is part of the segment being *entered* during a transition (i.e., it was not active, but will become active). Receives the target state (`toState`), the previous state (`fromState`), and injected `dependencies`. Useful for loading data specific to this route segment.
    *Example:* `onEnterNode: async (toState, fromState, deps) => await deps.dataService.loadUserData(toState.params.id)`

-   **`onExitNode`**?: `(toState: State | null, fromState: State, deps: Dependencies) => Promise<void>`
    An asynchronous lifecycle hook called when this specific route node is part of the segment being *exited* during a transition (i.e., it was active, but will no longer be). Receives the target state (`toState`, which could be `null` if the router is stopping), the previous state (`fromState`), and `dependencies`. Useful for cleanup tasks associated with this route segment.

-   **`onNodeInActiveChain`**?: `(toState: State, fromState: State | null, deps: Dependencies) => Promise<void>`
    An asynchronous lifecycle hook called after every successful transition if this route node *remains in the active route chain* (i.e., it was active before and is still active after the transition, or it just became active as part of the current transition). Useful for actions that need to occur whenever a route or any of its children become active (e.g., setting a general layout component based on a parent route, or refreshing data that pertains to an active section).

-   **`redirectToFirstAllowNode`**?: `boolean`
    If `true`, when this route is navigated to directly, the router will attempt to find the first child route that can be activated (i.e., passes its `canActivate` guards) and will automatically redirect to it. Useful for parent routes that don't have their own content but act as containers for a set of children, ensuring the user always lands on a valid child view.
    *Example:* If a `/settings` route has this set to `true`, and has children `profile` and `account`, navigating to `/settings` might redirect to `/settings/profile` if `profile` is the first accessible child.

### Custom Properties (Metadata)

You can also add any other custom properties to your route definition objects. These will be available on the matched route definition within the router state (often accessed via `state.meta.currentRoute.yourCustomProperty` or similar, depending on how you access route details). This is a common way to add metadata to routes, such as roles required for access, layout information, breadcrumb text, or feature flags.

```typescript
const routes: Route[] = [
  {
    name: 'admin.dashboard',
    path: '/dashboard',
    canActivate: adminGuard, // Example guard defined elsewhere
    // Custom metadata:
    meta: {
      requiresRole: 'ADMIN',
      layout: 'admin-layout'
    }
  }
];

// Accessing metadata (example, exact path might vary based on router state structure):
// if (router.getState().meta.currentRoute.meta.requiresRole === 'ADMIN') { ... }
```

By combining these configuration options, you can define a detailed and powerful routing structure tailored to your application's needs.