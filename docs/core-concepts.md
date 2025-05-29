# Core Concepts of @riogz/router

`@riogz/router` is built upon several core concepts that make it a flexible, powerful, and modern routing solution. Understanding these concepts will help you leverage the full potential of the router.

## 1. Framework Agnostic

The router is designed to be independent of any specific UI framework or library. This means you can use it with React, Vue, Angular, Svelte, or even with vanilla JavaScript. Its primary role is to manage route state and trigger updates, leaving the rendering and UI logic to your chosen framework or your own implementation.

## 2. View/State Separation

A fundamental principle is the clear separation between the router's state and the application's view layer. The router processes navigation instructions, resolves routes, and outputs a new router state. Your application then listens to these state changes and updates the UI accordingly. This separation simplifies state management and makes the router's logic predictable and testable.

## 3. Universal (Isomorphic)

`@riogz/router` can run both on the client-side (in the browser) and on the server-side (e.g., with Node.js). This universality is crucial for applications that require Server-Side Rendering (SSR) or Static Site Generation (SSG), ensuring consistent routing logic across environments.

## 4. Modular Architecture & Plugins

The core of `@riogz/router` is lightweight and focused on essential routing capabilities. Additional features are provided through a plugin system. This modular approach allows you to include only the functionality you need, keeping your application bundle size optimized. Examples include:
    -   `router-plugin-browser`: For History API and hash-based routing in browsers.
    -   `router-plugin-logger`: For debugging route transitions.
    -   `router-plugin-persistent-params`: For persisting parameters across navigations.

## 5. Hierarchical Routes (Route Nodes)

Routes in `@riogz/router` are organized hierarchically, forming a tree structure of "route nodes." Each node can have a name, a path segment, and children nodes. This allows for intuitive organization of complex application structures. For example, a route `users.detail` is a child of `users`. The router resolves paths by concatenating segments from the root to the target node.

## 6. Type-Safe (TypeScript)

The router is written entirely in TypeScript, providing strong typing for its API, route definitions, parameters, and state. This enhances developer experience with autocompletion and compile-time checks, reducing runtime errors and improving code maintainability.

## 7. Route Guards (Activation Control)

Route guards provide a mechanism to control access to routes or parts of your application. You can define `canActivate` functions for specific routes. These functions are executed before a transition to the route occurs and can be synchronous or asynchronous. If a guard returns `false` (or a Promise resolving to `false`), the transition is prevented. This is useful for implementing authentication, authorization, or data validation logic.

## 8. Middleware

Middleware functions allow you to intercept and process route transitions. They are executed for every navigation attempt and receive the `toState` (target state) and `fromState` (current state). Middleware can be used for various purposes, such as:
    -   Logging transitions for analytics.
    -   Modifying route parameters.
    -   Triggering side effects like data fetching.

## 9. High Performance

The router is optimized for performance, employing efficient algorithms for route matching and state updates. Caching mechanisms are also used where appropriate to speed up repeated operations.

## 10. State-Driven Transitions

Navigation in `@riogz/router` is state-driven. When you call `router.navigate(routeName, routeParams)`, the router calculates the target state (`toState`) and the transition path from the current state (`fromState`). This process involves resolving route segments, checking guards, and executing middleware. If successful, the router updates its internal state, and listeners are notified of the change.
