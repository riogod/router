# @riogz/router-plugin-logger

[![npm version](https://badge.fury.io/js/%40riogz%2Frouter-plugin-logger.svg)](https://badge.fury.io/js/%40riogz%2Frouter-plugin-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A logging plugin for [@riogz/router](https://www.npmjs.com/package/@riogz/router) that provides detailed console output for router lifecycle events and state transitions. Perfect for debugging and development workflows.

## Features

- 🔍 **Detailed Logging**: Comprehensive logging of router lifecycle events
- 📊 **Organized Output**: Uses console groups for clean, collapsible logs
- 🎯 **State Tracking**: Logs both source and destination states during transitions
- ⚠️ **Error Handling**: Captures and logs transition errors and cancellations
- 🔧 **Graceful Degradation**: Works even when advanced console features aren't available
- 🚀 **Zero Configuration**: Works out of the box with sensible defaults

## Installation

```bash
npm install @riogz/router-plugin-logger
```

## Quick Start

```typescript
import { createRouter } from '@riogz/router';
import loggerPlugin from '@riogz/router-plugin-logger';

const router = createRouter(routes);

// Add the logger plugin
router.usePlugin(loggerPlugin);

// Start the router
router.start();

// Navigate to see logs in action
router.navigate('users', { id: '42' });
```

## Console Output Example

When you use the logger plugin, you'll see organized output like this in your browser console:

```
ℹ Router started

▼ Router transition
  Transition started from state
  { name: 'home', params: {} }
  To state
  { name: 'users', params: { id: '42' } }
  Transition success

▼ Router transition  
  Transition started from state
  { name: 'users', params: { id: '42' } }
  To state
  { name: 'users.profile', params: { id: '42' } }
  ⚠ Transition cancelled

ℹ Router stopped
```

## API Reference

### `loggerPlugin`

The main export is a plugin factory function that creates a logger plugin instance.

```typescript
const loggerPlugin: PluginFactory
```

**Returns:** A router plugin object with lifecycle event handlers

**Usage:**
```typescript
import loggerPlugin from '@riogz/router-plugin-logger';

router.usePlugin(loggerPlugin);
```

### Plugin Lifecycle Events

The logger plugin implements the following router lifecycle events:

#### `onStop()`
Called when the router is stopped. Logs a simple info message.

**Console Output:** `"Router started"` (on plugin initialization) and `"Router stopped"` (on router stop)

#### `onTransitionStart(toState, fromState)`
Called when a route transition begins. Creates a console group and logs both states.

**Parameters:**
- `toState` - The target state being navigated to
- `fromState` - The current state being navigated from

**Console Output:**
```
▼ Router transition
  Transition started from state
  { name: 'current-route', params: {...} }
  To state
  { name: 'target-route', params: {...} }
```

#### `onTransitionSuccess()`
Called when a route transition completes successfully.

**Console Output:** `"Transition success"` (closes the transition group)

#### `onTransitionCancel()`
Called when a route transition is cancelled.

**Console Output:** `"Transition cancelled"`

#### `onTransitionError(toState, fromState, err)`
Called when a route transition encounters an error.

**Parameters:**
- `toState` - The target state that failed to be reached
- `fromState` - The state the transition started from  
- `err` - The error object containing failure details

**Console Output:** `"Transition error with code [error-code]"` (closes the transition group)

## Console Feature Detection

The plugin automatically detects available console features and adapts accordingly:

| Feature Available | Behavior |
|------------------|----------|
| `console.groupCollapsed` | Uses collapsed groups (preferred) |
| `console.group` | Uses regular expanded groups |
| Neither | Logs without grouping |

This ensures the plugin works across all environments, from modern browsers to limited console implementations.

## Integration Examples

### Basic Setup

```typescript
import { createRouter } from '@riogz/router';
import loggerPlugin from '@riogz/router-plugin-logger';

const routes = [
    { name: 'home', path: '/' },
    { name: 'users', path: '/users/:id' },
    { name: 'users.profile', path: '/profile' }
];

const router = createRouter(routes);
router.usePlugin(loggerPlugin);
router.start();
```

### Development vs Production

```typescript
import { createRouter } from '@riogz/router';
import loggerPlugin from '@riogz/router-plugin-logger';

const router = createRouter(routes);

// Only use logger in development
if (process.env.NODE_ENV === 'development') {
    router.usePlugin(loggerPlugin);
}

router.start();
```

### With Multiple Plugins

```typescript
import { createRouter } from '@riogz/router';
import loggerPlugin from '@riogz/router-plugin-logger';
import browserPlugin from '@riogz/router-plugin-browser';

const router = createRouter(routes);

// Order matters - logger should typically be last to capture all events
router.usePlugin(browserPlugin());
router.usePlugin(loggerPlugin);

router.start();
```

### Custom Logging Wrapper

```typescript
import { createRouter } from '@riogz/router';
import loggerPlugin from '@riogz/router-plugin-logger';

// Create a conditional logger
const conditionalLogger = () => {
    if (!window.location.search.includes('debug=true')) {
        return null; // Don't add logger
    }
    return loggerPlugin;
};

const router = createRouter(routes);
const logger = conditionalLogger();
if (logger) {
    router.usePlugin(logger);
}
router.start();
```

## Debugging Tips

### Enable Detailed Logging
Add `?debug=true` to your URL and conditionally enable the logger:

```typescript
const shouldLog = window.location.search.includes('debug=true') || 
                  process.env.NODE_ENV === 'development';

if (shouldLog) {
    router.usePlugin(loggerPlugin);
}
```

### Filter Console Output
Most browser dev tools allow filtering console output. Use these filters:
- `Router` - See all router-related logs
- `Transition` - See only transition events
- `error` - See only errors and warnings

### Understanding State Objects
The logged state objects contain:
```typescript
{
    name: string,        // Route name (e.g., 'users.profile')
    params: object,      // Route parameters (e.g., { id: '42' })
    // ... other router state properties
}
```

## Browser Support

This plugin works in all environments that support:
- Basic console logging (`console.log`, `console.info`, `console.warn`)
- Optional: Console grouping (`console.group`, `console.groupCollapsed`, `console.groupEnd`)

## Performance Considerations

- **Development Only**: Consider using this plugin only in development builds
- **Minimal Overhead**: The plugin has minimal performance impact
- **Memory Usage**: Console logs may accumulate in memory; clear console periodically during long debugging sessions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Vyacheslav Krasnyanskiy](https://github.com/riogod)

## Related Packages

- [@riogz/router](https://www.npmjs.com/package/@riogz/router) - Core router implementation
- [@riogz/router-plugin-browser](https://www.npmjs.com/package/@riogz/router-plugin-browser) - Browser history integration
- [@riogz/router-helpers](https://www.npmjs.com/package/@riogz/router-helpers) - Route comparison utilities
- [@riogz/router-transition-path](https://www.npmjs.com/package/@riogz/router-transition-path) - Route transition utilities
