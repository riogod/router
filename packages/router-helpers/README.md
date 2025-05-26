# @riogz/router-helpers

[![npm version](https://badge.fury.io/js/%40riogz%2Frouter-helpers.svg)](https://badge.fury.io/js/%40riogz%2Frouter-helpers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Router helpers for comparing and checking routes in hierarchical router systems. This package provides efficient utility functions for pattern matching against route segments with support for both string and object route representations.

## Features

- 🚀 **High Performance**: Regex caching for optimal performance
- 🔄 **Flexible API**: Support for both direct and curried function calls
- 📝 **TypeScript Support**: Full type definitions included
- 🎯 **Pattern Matching**: Efficient segment-based route matching
- 🔗 **Framework Agnostic**: Works with any hierarchical routing system

## Installation

```bash
npm install @riogz/router-helpers
```

## Quick Start

```typescript
import { startsWithSegment, endsWithSegment, includesSegment } from '@riogz/router-helpers';

// Check if route starts with a segment
startsWithSegment('users.profile.edit', 'users'); // true

// Check if route ends with a segment  
endsWithSegment('users.profile.edit', 'edit'); // true

// Check if route includes a segment anywhere
includesSegment('users.profile.edit', 'profile'); // true
```

## API Reference

### Types

#### `State`

Represents a router state object containing route information.

```typescript
interface State {
    /** The hierarchical route name (e.g., 'users.profile.edit') */
    name: string;
    /** Optional route parameters */
    params?: { [key: string]: any };
    /** Additional state properties */
    [key: string]: any;
}
```

#### `SegmentTestFunction`

Function interface for segment testing utilities that supports both direct usage and curried form.

```typescript
interface SegmentTestFunction {
    /** Direct usage: test if route matches segment */
    (route: string | State, segment: string): boolean;
    /** Curried usage: returns a function that tests segments against the route */
    (route: string | State): (segment: string) => boolean;
}
```

### Functions

#### `startsWithSegment(route, segment)`

Tests if a route starts with a specific segment. Useful for checking if a route is within a particular section of your application.

**Parameters:**
- `route` (`string | State`) - The route to test
- `segment` (`string`) - The segment to check for at the start

**Returns:** `boolean` - True if the route starts with the segment

**Examples:**

```typescript
// Direct usage
startsWithSegment('users.profile.edit', 'users');        // true
startsWithSegment('users.profile.edit', 'users.profile'); // true
startsWithSegment('admin.dashboard', 'users');           // false

// With State object
startsWithSegment({ name: 'users.profile.edit' }, 'users'); // true

// Curried usage
const checkUserRoutes = startsWithSegment('users.profile.edit');
checkUserRoutes('users');         // true
checkUserRoutes('admin');         // false
```

#### `endsWithSegment(route, segment)`

Tests if a route ends with a specific segment. Useful for checking the final destination or action of a route.

**Parameters:**
- `route` (`string | State`) - The route to test
- `segment` (`string`) - The segment to check for at the end

**Returns:** `boolean` - True if the route ends with the segment

**Examples:**

```typescript
// Direct usage
endsWithSegment('users.profile.edit', 'edit');           // true
endsWithSegment('users.profile.edit', 'profile.edit');   // true
endsWithSegment('users.profile.view', 'edit');           // false

// With State object
endsWithSegment({ name: 'users.profile.edit' }, 'edit'); // true

// Curried usage
const checkEditRoutes = endsWithSegment('users.profile.edit');
checkEditRoutes('edit');          // true
checkEditRoutes('view');          // false
```

#### `includesSegment(route, segment)`

Tests if a route includes a specific segment anywhere in its hierarchy. Useful for checking if a route is related to a particular feature or section.

**Parameters:**
- `route` (`string | State`) - The route to test
- `segment` (`string`) - The segment to check for anywhere in the route

**Returns:** `boolean` - True if the route includes the segment

**Examples:**

```typescript
// Direct usage
includesSegment('users.profile.edit', 'profile');        // true
includesSegment('users.profile.edit', 'users');          // true
includesSegment('users.profile.edit', 'edit');           // true
includesSegment('users.profile.edit', 'admin');          // false

// With State object
includesSegment({ name: 'users.profile.edit' }, 'profile'); // true

// Curried usage
const checkProfileRoutes = includesSegment('users.profile.edit');
checkProfileRoutes('profile');    // true
checkProfileRoutes('settings');   // false
```

## Usage Patterns

### Navigation Guards

```typescript
import { startsWithSegment } from '@riogz/router-helpers';

function requiresAuth(route: string): boolean {
    return startsWithSegment(route, 'admin') || 
           startsWithSegment(route, 'user.profile');
}

// Usage
if (requiresAuth('admin.dashboard')) {
    // Redirect to login
}
```

### Route-based Component Rendering

```typescript
import { includesSegment, endsWithSegment } from '@riogz/router-helpers';

function getLayoutType(route: string): string {
    if (startsWithSegment(route, 'admin')) return 'admin-layout';
    if (includesSegment(route, 'profile')) return 'profile-layout';
    return 'default-layout';
}

function showSidebar(route: string): boolean {
    return !endsWithSegment(route, 'fullscreen') && 
           !startsWithSegment(route, 'auth');
}
```

### Functional Programming with Currying

```typescript
import { startsWithSegment, includesSegment } from '@riogz/router-helpers';

const routes = [
    'users.profile.edit',
    'users.profile.view', 
    'admin.dashboard',
    'admin.users.list'
];

// Create reusable predicates
const isUserRoute = startsWithSegment('users');
const isAdminRoute = startsWithSegment('admin');
const hasProfile = includesSegment('profile');

// Filter routes functionally
const userRoutes = routes.filter(isUserRoute);
const adminRoutes = routes.filter(isAdminRoute);
const profileRoutes = routes.filter(hasProfile);
```

### Integration with React Router

```typescript
import { useLocation } from 'react-router-dom';
import { startsWithSegment } from '@riogz/router-helpers';

function useIsAdminRoute(): boolean {
    const location = useLocation();
    const routeName = location.pathname.replace(/\//g, '.');
    return startsWithSegment(routeName, 'admin');
}

// Usage in component
function Navigation() {
    const isAdmin = useIsAdminRoute();
    
    return (
        <nav>
            {isAdmin && <AdminMenu />}
            <MainMenu />
        </nav>
    );
}
```

## Performance

The package includes several performance optimizations:

- **Regex Caching**: Compiled regular expressions are cached to avoid recompilation
- **Efficient Pattern Matching**: Uses optimized regex patterns for segment matching
- **Minimal Memory Footprint**: Lightweight implementation with no external dependencies

## Browser Support

This package works in all modern browsers and Node.js environments that support:
- ES2015+ features
- Regular expressions
- Map objects

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Vyacheslav Krasnyanskiy](https://github.com/riogod)

## Related Packages

- [@riogz/router](https://www.npmjs.com/package/@riogz/router) - Core router implementation
- [@riogz/router-transition-path](https://www.npmjs.com/package/@riogz/router-transition-path) - Route transition utilities
- [@riogz/router-plugin-browser](https://www.npmjs.com/package/@riogz/router-plugin-browser) - Browser history plugin
