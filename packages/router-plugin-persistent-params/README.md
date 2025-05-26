# @riogz/router-plugin-persistent-params

A router plugin that maintains persistent parameters across route transitions, making them "sticky" throughout the navigation session.

## Installation

```bash
npm install @riogz/router-plugin-persistent-params
```

## Overview

This plugin ensures that specified parameters are automatically included in all route transitions. It's particularly useful for maintaining user preferences, theme settings, locale information, or debug flags across your entire application.

## Quick Start

```typescript
import { createRouter } from '@riogz/router'
import persistentParamsPlugin from '@riogz/router-plugin-persistent-params'

const router = createRouter([
  { name: 'home', path: '/' },
  { name: 'profile', path: '/profile/:userId' },
  { name: 'settings', path: '/settings' }
])

// Make theme and locale persistent
router.usePlugin(persistentParamsPlugin(['theme', 'locale']))

router.start()

// Navigate with persistent parameters
router.navigate('profile', { userId: '123', theme: 'dark' })
// URL: /profile/123?theme=dark

// Later navigation automatically includes theme
router.navigate('settings')
// URL: /settings?theme=dark
```

## API Reference

### `persistentParamsPlugin(config)`

Creates a persistent parameters plugin factory.

#### Parameters

- **config** (`PersistentParamsConfig`): Configuration for persistent parameters
  - `string[]`: Array of parameter names (parameters start as undefined)
  - `Record<string, any>`: Object with parameter names as keys and default values

#### Returns

- `PluginFactory`: A plugin factory function for use with `router.usePlugin()`

## Configuration Options

### Array Format

When using an array, parameters will be undefined initially and only become persistent when first set during navigation.

```typescript
router.usePlugin(persistentParamsPlugin(['theme', 'locale', 'debug']))

// Parameters start as undefined
router.navigate('home') // URL: /

// Set a parameter
router.navigate('profile', { userId: '123', theme: 'dark' })
// URL: /profile/123?theme=dark

// Theme is now persistent
router.navigate('settings')
// URL: /settings?theme=dark
```

### Object Format

When using an object, parameters have default values and are included in all routes from the start.

```typescript
router.usePlugin(persistentParamsPlugin({
  theme: 'light',
  locale: 'en',
  debug: false
}))

// All routes include default parameters
router.navigate('home')
// URL: /?theme=light&locale=en&debug=false

// Override specific parameters
router.navigate('profile', { userId: '123', theme: 'dark' })
// URL: /profile/123?theme=dark&locale=en&debug=false
```

## Common Use Cases

### Theme Persistence

```typescript
// Simple theme switching
router.usePlugin(persistentParamsPlugin({ theme: 'auto' }))

// Toggle theme
function toggleTheme() {
  const currentRoute = router.getState()
  const newTheme = currentRoute.params.theme === 'dark' ? 'light' : 'dark'
  router.navigate(currentRoute.name, { 
    ...currentRoute.params, 
    theme: newTheme 
  })
}
```

### Internationalization

```typescript
// Locale persistence
router.usePlugin(persistentParamsPlugin({ locale: 'en' }))

// Change language
function setLanguage(locale: string) {
  const currentRoute = router.getState()
  router.navigate(currentRoute.name, { 
    ...currentRoute.params, 
    locale 
  })
}
```

### Debug Flags

```typescript
// Development/debug parameters
router.usePlugin(persistentParamsPlugin({
  debug: process.env.NODE_ENV === 'development',
  verbose: false,
  showGrid: false
}))

// Enable debug mode
router.navigate('current-route', { debug: true })
```

### User Preferences

```typescript
// UI state persistence
router.usePlugin(persistentParamsPlugin([
  'sortBy',      // Table sorting
  'filterBy',    // Active filters  
  'viewMode',    // List/grid view
  'pageSize'     // Items per page
]))

// Set user preferences
router.navigate('products', {
  sortBy: 'price',
  filterBy: 'electronics',
  viewMode: 'grid',
  pageSize: '20'
})

// Preferences persist across navigation
router.navigate('categories') // Still has sortBy, filterBy, etc.
```

## How It Works

The plugin operates by:

1. **Modifying the root path**: Adds persistent parameters as query parameters to the router's root path
2. **Decorating navigation methods**: Automatically merges persistent parameters into `buildPath` and `buildState` calls
3. **Listening to transitions**: Updates persistent parameter values when they change during successful transitions

### Internal Behavior

```typescript
// Before plugin
router.navigate('profile', { userId: '123' })
// URL: /profile/123

// After plugin with persistent theme
router.navigate('profile', { userId: '123' })
// URL: /profile/123?theme=light (theme automatically added)

// Update persistent parameter
router.navigate('profile', { userId: '123', theme: 'dark' })
// URL: /profile/123?theme=dark (theme value updated)

// Navigate elsewhere
router.navigate('settings')
// URL: /settings?theme=dark (theme persists)
```

## TypeScript Support

The plugin includes full TypeScript definitions:

```typescript
import persistentParamsPlugin, { 
  PersistentParamsConfig,
  persistentParamsPluginFactory 
} from '@riogz/router-plugin-persistent-params'

// Type-safe configuration
const config: PersistentParamsConfig = {
  theme: 'light' as 'light' | 'dark',
  locale: 'en' as string,
  debug: false as boolean
}

router.usePlugin(persistentParamsPlugin(config))
```

## Integration Examples

### React Integration

```typescript
// hooks/useTheme.ts
import { useRouter } from '@riogz/react-router'

export function useTheme() {
  const router = useRouter()
  const state = router.getState()
  
  const setTheme = (theme: string) => {
    router.navigate(state.name, { 
      ...state.params, 
      theme 
    })
  }
  
  return {
    theme: state.params.theme || 'light',
    setTheme
  }
}

// components/ThemeToggle.tsx
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

### URL Synchronization

```typescript
// Sync with localStorage
router.usePlugin(persistentParamsPlugin({
  theme: localStorage.getItem('theme') || 'light'
}))

// Listen for changes and update localStorage
router.subscribe((toState) => {
  if (toState.params.theme) {
    localStorage.setItem('theme', toState.params.theme)
  }
})
```

## Best Practices

### Parameter Naming

Use descriptive, consistent parameter names:

```typescript
// ✅ Good
router.usePlugin(persistentParamsPlugin([
  'uiTheme',
  'userLocale', 
  'debugMode'
]))

// ❌ Avoid
router.usePlugin(persistentParamsPlugin([
  't',
  'l',
  'd'
]))
```

### Default Values

Provide sensible defaults for better UX:

```typescript
// ✅ Good - users see consistent UI immediately
router.usePlugin(persistentParamsPlugin({
  theme: 'light',
  locale: navigator.language.split('-')[0] || 'en',
  animations: true
}))

// ❌ Avoid - undefined values can cause UI flicker
router.usePlugin(persistentParamsPlugin(['theme', 'locale']))
```

### Performance Considerations

- Limit the number of persistent parameters (recommended: < 10)
- Use simple values (strings, numbers, booleans) rather than complex objects
- Consider URL length limitations for many parameters

## Troubleshooting

### Parameters Not Persisting

Ensure the plugin is registered before starting the router:

```typescript
// ✅ Correct order
router.usePlugin(persistentParamsPlugin(['theme']))
router.start()

// ❌ Wrong order
router.start()
router.usePlugin(persistentParamsPlugin(['theme'])) // Too late!
```

### URL Too Long

If you have many persistent parameters, consider using shorter names or storing complex state in localStorage:

```typescript
// Instead of many URL parameters
router.usePlugin(persistentParamsPlugin({
  sessionId: generateSessionId() // Store complex state by ID
}))
```

## License

MIT

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/riogod/router).
