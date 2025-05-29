# Observing Router State

`@riogz/router` provides several ways to observe and react to changes in its state. This is crucial for updating your UI, fetching data, or performing other actions based on the current route.

## 1. `router.subscribe()`

The primary method for observing route changes is `router.subscribe()`. It allows you to register a listener function that will be called after every successful navigation.

```typescript
import createRouter, { Router, State, SubscribeState } from '@riogz/router';

const router: Router = createRouter([/* your routes */]);

const unsubscribe = router.subscribe((subscriptionState: SubscribeState) => {
  const { route, previousRoute } = subscriptionState;
  
  console.log('Navigation successful!');
  console.log('Current route name:', route.name);
  console.log('Current route params:', route.params);
  console.log('Current path:', route.path);
  
  if (previousRoute) {
    console.log('Previous route name:', previousRoute.name);
  }
  
  // Here you would typically update your UI based on the new `route` state.
  // For example, in React, you might call a `setState` function.
});

router.start();

// To stop listening to updates:
// unsubscribe();
```

The listener function receives a `SubscribeState` object which contains:
-   `route`: The new current `State` object after the navigation.
-   `previousRoute`: The `State` object from before the navigation (can be `null` on initial load).

`router.subscribe()` returns an `unsubscribe` function. Call this function when your component unmounts or when you no longer need to listen to state changes to prevent memory leaks.

### RxJS-style Observer

`router.subscribe()` also accepts an observer object (compatible with RxJS) with a `next` method:

```typescript
const subscription = router.subscribe({
  next: (subscriptionState: SubscribeState) => {
    console.log('New route via observer:', subscriptionState.route.name);
  },
  error: (err) => {
    // Note: router.subscribe primarily notifies on successful transitions.
    // For transition errors, use router.addEventListener(constants.TRANSITION_ERROR, ...).
    console.error('Subscription error (should not happen here typically):', err);
  },
  complete: () => {
    // This would be called if the observable source completes, 
    // which for the router means it has been stopped.
    console.log('Router observable completed (router stopped).');
  }
});

// To stop listening:
// subscription.unsubscribe();
```

## 2. `router.getState()`

At any point, you can synchronously get the current router state using `router.getState()`.

```typescript
const currentState: State | null = router.getState();

if (currentState) {
  console.log('Current active route:', currentState.name);
} else {
  console.log('Router has not been started or has no state yet.');
}
```

This is useful for one-time checks but should not be used for reactive updates, as it doesn't notify you of changes. For reactive updates, always use `router.subscribe()`.

## 3. `router.addEventListener()`

For more fine-grained control over observing different stages of the router's lifecycle (not just successful state changes), you can use `router.addEventListener()`. The router emits various events:

-   `constants.ROUTER_START`: When `router.start()` is called and initialization begins.
-   `constants.ROUTER_STOP`: When `router.stop()` is called.
-   `constants.TRANSITION_START`: When a navigation attempt begins.
-   `constants.TRANSITION_SUCCESS`: When a navigation successfully completes (this is what `router.subscribe()` primarily listens to).
-   `constants.TRANSITION_ERROR`: When a navigation fails (e.g., a guard prevents it, or an error occurs in middleware).
-   `constants.TRANSITION_CANCEL`: When a navigation is explicitly cancelled (e.g., by another navigation starting before the current one finishes).

```typescript
import { constants } from '@riogz/router'; // Or from '@riogz/router/dist/constants'

router.addEventListener(constants.TRANSITION_START, (toState, fromState) => {
  console.log(`Transition starting to ${toState.name} from ${fromState?.name}`);
  // Show a loading indicator, perhaps?
});

router.addEventListener(constants.TRANSITION_ERROR, (toState, fromState, err) => {
  console.error(`Error transitioning to ${toState.name}:`, err);
  if (err.redirect) {
    console.log('Transition error led to a redirect to:', err.redirect.name);
  }
  // Show an error message, perhaps?
});

const removeStopListener = router.addEventListener(constants.ROUTER_STOP, () => {
  console.log('Router has been stopped.');
});

// To remove a specific listener:
// removeStopListener();
```

`router.addEventListener()` also returns a function that can be called to remove that specific listener.

## 4. Observable Interface (`$$observable`)

`@riogz/router` implements the [Observable specification](https://github.com/tc39/proposal-observable) by exposing a `Symbol.observable` (imported as `$$observable`) method. This makes it directly usable with reactive libraries like RxJS.

```typescript
import { from } from 'rxjs'; // Example with RxJS
import $$observable from 'symbol-observable'; // Or router[Symbol.observable]

const routerObservable = from(router); // router itself is an Observable

const rxjsSubscription = routerObservable.subscribe(
  (subscriptionState: SubscribeState) => {
    console.log('RxJS - New route:', subscriptionState.route.name);
  },
  (error) => {
    console.error('RxJS - Error in observable stream:', error);
  },
  () => {
    console.log('RxJS - Router observable stream completed.');
  }
);

// Later, to unsubscribe:
// rxjsSubscription.unsubscribe();
```

This allows you to integrate `@riogz/router` into more complex reactive data flows using the rich operator set provided by libraries like RxJS.

Choose the method that best fits your needs:
-   `router.subscribe()`: For most common use cases of reacting to successful route changes.
-   `router.getState()`: For synchronous, one-off reads of the current state.
-   `router.addEventListener()`: For observing specific lifecycle events beyond just successful transitions.
-   `$$observable`: For integration with RxJS or other Observable-compliant libraries.
