# @riogz/router-transition-path

A utility library for calculating transition paths between router states and optimizing component updates during navigation.

## Overview

This package provides essential utilities for router implementations that need to efficiently handle state transitions. It calculates which route segments need to be activated or deactivated when navigating between different routes, enabling optimized component rendering and lifecycle management.

## Installation

```bash
npm install @riogz/router-transition-path
```

## Key Features

- 🚀 **Efficient Transitions**: Calculate minimal set of route segments to update
- 🎯 **Smart Updates**: Determine which components need re-rendering
- 📊 **Parameter Handling**: Handle route parameter changes intelligently
- 🔄 **Reload Support**: Support for forced route reloading
- 📝 **TypeScript**: Full TypeScript support with comprehensive type definitions

## API Reference

### `transitionPath(toState, fromState)`

Calculates the transition path between two router states.

**Parameters:**
- `toState: State` - The target state to navigate to
- `fromState: State | null` - The current state (null for initial navigation)

**Returns:** `TransitionPath` object containing:
- `intersection: string` - The deepest common route segment
- `toDeactivate: string[]` - Route segments to deactivate (in reverse order)
- `toActivate: string[]` - Route segments to activate

**Example:**
```typescript
import transitionPath from '@riogz/router-transition-path';

const path = transitionPath(
  { name: 'users.profile.edit', params: { userId: '42' } },
  { name: 'users.settings', params: { userId: '42' } }
);

console.log(path);
// {
//   intersection: 'users',
//   toDeactivate: ['users.settings'],
//   toActivate: ['users.profile', 'users.profile.edit']
// }
```

### `shouldUpdateNode(nodeName)`

Creates a function that determines whether a specific route node should update during a transition.

**Parameters:**
- `nodeName: string` - The name of the route node to check

**Returns:** Function `(toState: State, fromState: State) => boolean`

**Example:**
```typescript
import { shouldUpdateNode } from '@riogz/router-transition-path';

const shouldUpdateProfile = shouldUpdateNode('users.profile');

const shouldUpdate = shouldUpdateProfile(
  { name: 'users.profile.edit', params: { userId: '42' } },
  { name: 'users.profile.view', params: { userId: '42' } }
);

console.log(shouldUpdate); // true - profile is the intersection point
```

### `nameToIDs(name)`

Converts a hierarchical route name into an array of route segment IDs.

**Parameters:**
- `name: string` - The hierarchical route name

**Returns:** `string[]` - Array of route segment IDs

**Example:**
```typescript
import { nameToIDs } from '@riogz/router-transition-path';

const segments = nameToIDs('users.profile.edit');
console.log(segments);
// ['users', 'users.profile', 'users.profile.edit']
```

## Type Definitions

### `State`

Represents a router state:

```typescript
interface State {
  name: string;                    // Route name (e.g., 'users.profile.edit')
  params?: { [key: string]: any }; // Route parameters
  meta?: {
    options?: { [key: string]: boolean };     // Transition options
    params?: { [key: string]: SegmentParams }; // Parameter schemas
  };
  [key: string]: any; // Additional properties
}
```

### `TransitionPath`

Result of transition path calculation:

```typescript
interface TransitionPath {
  intersection: string;    // Deepest common route segment
  toDeactivate: string[];  // Segments to deactivate
  toActivate: string[];    // Segments to activate
}
```

### `SegmentParams`

URL parameters for a route segment:

```typescript
interface SegmentParams {
  [key: string]: string;
}
```

## Usage Examples

### Basic Navigation

```typescript
import transitionPath from '@riogz/router-transition-path';

// Navigate from home to user profile
const path = transitionPath(
  { name: 'users.profile', params: { userId: '123' } },
  { name: 'home', params: {} }
);

// Result: {
//   intersection: '',
//   toDeactivate: ['home'],
//   toActivate: ['users', 'users.profile']
// }
```

### Parameter Changes

```typescript
// Same route, different parameters
const path = transitionPath(
  { 
    name: 'users.profile', 
    params: { userId: '456' },
    meta: { params: { 'users.profile': { userId: 'url' } } }
  },
  { 
    name: 'users.profile', 
    params: { userId: '123' },
    meta: { params: { 'users.profile': { userId: 'url' } } }
  }
);

// Result: {
//   intersection: 'users',
//   toDeactivate: ['users.profile'],
//   toActivate: ['users.profile']
// }
```

### Component Update Optimization

```typescript
import { shouldUpdateNode } from '@riogz/router-transition-path';

// Create update checkers for different components
const shouldUpdateHeader = shouldUpdateNode('');
const shouldUpdateSidebar = shouldUpdateNode('users');
const shouldUpdateProfile = shouldUpdateNode('users.profile');

// During navigation from users.profile.edit to users.settings
const toState = { name: 'users.settings', params: { userId: '42' } };
const fromState = { name: 'users.profile.edit', params: { userId: '42' } };

console.log(shouldUpdateHeader(toState, fromState));  // false
console.log(shouldUpdateSidebar(toState, fromState)); // true (intersection)
console.log(shouldUpdateProfile(toState, fromState)); // false
```

### Forced Reload

```typescript
// Force complete reload of route
const path = transitionPath(
  { 
    name: 'users.profile',
    params: { userId: '42' },
    meta: { options: { reload: true } }
  },
  { name: 'users.profile', params: { userId: '42' } }
);

// Result: {
//   intersection: '',
//   toDeactivate: ['users.profile', 'users'],
//   toActivate: ['users', 'users.profile']
// }
```

## Integration with Router

This package is designed to work with `@riogz/router` but can be used with any router implementation that follows similar state patterns:

```typescript
import transitionPath, { shouldUpdateNode } from '@riogz/router-transition-path';

class MyRouter {
  navigate(toState) {
    const fromState = this.currentState;
    const path = transitionPath(toState, fromState);
    
    // Deactivate components in reverse order
    path.toDeactivate.forEach(segment => {
      this.deactivateComponent(segment);
    });
    
    // Activate new components
    path.toActivate.forEach(segment => {
      this.activateComponent(segment);
    });
    
    this.currentState = toState;
  }
  
  createComponent(name) {
    const shouldUpdate = shouldUpdateNode(name);
    
    return {
      shouldComponentUpdate: (nextProps) => {
        return shouldUpdate(nextProps.toState, this.currentState);
      }
    };
  }
}
```

## License

MIT © Vyacheslav Krasnyanskiy

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/riogod/router).

## Related Packages

- [`@riogz/router`](../router) - Core router implementation
- [`@riogz/react-router`](../react-router) - React integration for the router
