# @riogz/router-plugin-browser

Browser integration plugin for [@riogz/router](https://github.com/riogod/router). Provides seamless integration between the router and browser navigation, supporting both HTML5 history API and hash-based routing.

## Features

- **HTML5 History API Support** - Modern pushState/replaceState navigation
- **Hash-based Routing** - Fallback for older browsers or specific requirements
- **Base Path Support** - Deploy apps in subdirectories
- **State Preservation** - Maintain router state in browser history
- **SSR Compatible** - Safe fallbacks for server-side rendering
- **TypeScript Support** - Full type definitions included

## Installation

```bash
npm install @riogz/router-plugin-browser
```

## Basic Usage

```typescript
import { createRouter } from '@riogz/router'
import browserPlugin from '@riogz/router-plugin-browser'

const routes = [
  { name: 'home', path: '/' },
  { name: 'users', path: '/users/:id' }
]

const router = createRouter(routes)

// Use the browser plugin
router.usePlugin(browserPlugin())

// Start the router
router.start()
```

## Configuration Options

### BrowserPluginOptions

```typescript
interface BrowserPluginOptions {
  forceDeactivate?: boolean    // Force route deactivation during transitions (default: true)
  useHash?: boolean           // Use hash-based routing (default: false)
  hashPrefix?: string         // Prefix after hash symbol (default: '')
  base?: string | null        // Base path for the application (default: '')
  mergeState?: boolean        // Merge with existing browser state (default: false)
  preserveHash?: boolean      // Preserve URL hash during navigation (default: true)
}
```

## Usage Examples

### HTML5 History Mode (Default)

```typescript
// URLs: /users/123, /profile, /settings
router.usePlugin(browserPlugin({
  useHash: false
}))
```

### Hash-based Routing

```typescript
// URLs: #/users/123, #/profile, #/settings
router.usePlugin(browserPlugin({
  useHash: true
}))

// With prefix: #!/users/123, #!/profile, #!/settings
router.usePlugin(browserPlugin({
  useHash: true,
  hashPrefix: '!'
}))
```

### Application in Subdirectory

```typescript
// URLs: /myapp/users/123, /myapp/profile
router.usePlugin(browserPlugin({
  base: '/myapp'
}))
```

### State Merging

```typescript
// Preserve additional properties in history.state
router.usePlugin(browserPlugin({
  mergeState: true
}))

// Now you can add custom data to history
history.replaceState({
  ...history.state,
  scrollPosition: window.scrollY,
  customData: 'value'
}, '', location.href)
```

## Extended Router Methods

The plugin adds several methods to the router instance:

### buildUrl(name, params)

Build a complete URL for a route:

```typescript
// With base path and hash prefix
const url = router.buildUrl('users.profile', { id: '123' })
// Result: /myapp#!/users/123/profile (depending on config)
```

### matchUrl(url)

Match a complete URL against routes:

```typescript
const state = router.matchUrl('https://example.com/users/123')
if (state) {
  console.log(state.name)   // 'users'
  console.log(state.params) // { id: '123' }
}
```

### replaceHistoryState(name, params, title)

Update browser history without navigation:

```typescript
// Update URL and history state without triggering route change
router.replaceHistoryState('users.profile', { id: '456' }, 'User Profile')
```

## Browser Abstraction

The plugin uses a browser abstraction layer that provides safe fallbacks for non-browser environments:

```typescript
import browser from '@riogz/router-plugin-browser/browser'

// Safe to use in any environment
const currentPath = browser.getLocation({ useHash: false, base: '' })
browser.pushState({ name: 'home' }, 'Home', '/home')
```

## Testing

For testing, you can provide a mock browser implementation:

```typescript
import browserPlugin from '@riogz/router-plugin-browser'

const mockBrowser = {
  getBase: () => '/test',
  pushState: jest.fn(),
  replaceState: jest.fn(),
  addPopstateListener: jest.fn(() => () => {}),
  getLocation: () => '/current/path',
  getState: () => null,
  getHash: () => ''
}

router.usePlugin(browserPlugin({}, mockBrowser))
```

## Advanced Configuration

### Custom Hash Prefix

```typescript
// Google-style hash routing: #!/users/123
router.usePlugin(browserPlugin({
  useHash: true,
  hashPrefix: '!'
}))
```

### Preserve Hash Fragments

```typescript
// Maintain #section anchors during navigation
router.usePlugin(browserPlugin({
  preserveHash: true  // default
}))

// Navigate from /page1#section1 to /page2#section1
router.navigate('page2')
```

### Force Route Deactivation

```typescript
// Control route lifecycle during transitions
router.usePlugin(browserPlugin({
  forceDeactivate: false  // Allow routes to stay active when possible
}))
```

## Browser Compatibility

- **Modern Browsers**: Full HTML5 history API support
- **Legacy Browsers**: Automatic fallback to hash-based routing
- **Internet Explorer**: Special handling for hashchange events
- **Server-Side Rendering**: Safe no-op implementations

## Error Handling

The plugin handles various error scenarios:

- **Navigation Blocking**: Respects route guards and canDeactivate hooks
- **Invalid URLs**: Graceful fallback to default routes
- **State Conflicts**: Prevents duplicate history entries
- **Browser Limitations**: Automatic detection and workarounds

## Integration with Other Plugins

The browser plugin works seamlessly with other router plugins:

```typescript
import browserPlugin from '@riogz/router-plugin-browser'
import loggerPlugin from '@riogz/router-plugin-logger'

router.usePlugin(browserPlugin())
router.usePlugin(loggerPlugin())
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import { BrowserPluginOptions, Browser, HistoryState } from '@riogz/router-plugin-browser'

const options: BrowserPluginOptions = {
  useHash: true,
  hashPrefix: '!'
}

const customBrowser: Browser = {
  // Implementation
}
```

## API Reference

### Types

- **BrowserPluginOptions** - Configuration options for the plugin
- **Browser** - Browser abstraction interface
- **HistoryState** - Extended router state with browser history data

### Functions

- **browserPluginFactory(options?, browser?)** - Create a browser plugin instance
- **default export** - The browserPluginFactory function

## License

MIT © [Vyacheslav Krasnyanskiy](https://github.com/riogod)
