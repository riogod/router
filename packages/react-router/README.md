# @riogz/react-router

React integration for the @riogz/router library, providing hooks, components, and higher-order components for seamless router integration in React applications.

## Installation

```bash
npm install @riogz/react-router @riogz/router
```

## Quick Start

```tsx
import React from 'react';
import { createRouter } from '@riogz/router';
import { RouterProvider, useRoute, useRouter } from '@riogz/react-router';

// Create your router
const router = createRouter(routes);

// App component with router provider
function App() {
  return (
    <RouterProvider router={router}>
      <Navigation />
      <RouteContent />
    </RouterProvider>
  );
}

// Navigation component using hooks
function Navigation() {
  const router = useRouter();
  const route = useRoute();
  
  return (
    <nav>
      <button onClick={() => router.navigate('home')}>
        Home {route.name === 'home' && '(current)'}
      </button>
      <button onClick={() => router.navigate('about')}>
        About {route.name === 'about' && '(current)'}
      </button>
    </nav>
  );
}

// Route content component
function RouteContent() {
  const route = useRoute();
  
  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'about':
      return <AboutPage />;
    default:
      return <NotFoundPage />;
  }
}
```

## API Reference

### Components

#### RouterProvider

The root provider component that makes the router available to all child components.

```tsx
import { RouterProvider } from '@riogz/react-router';

<RouterProvider router={router}>
  <App />
</RouterProvider>
```

**Props:**
- `router: Router` - The router instance to provide
- `children: ReactNode` - Child components

#### BaseLink

A foundational link component with router integration and active state detection.

```tsx
import { BaseLink } from '@riogz/react-router';

<BaseLink 
  routeName="user.profile" 
  routeParams={{ userId: '123' }}
  activeClassName="current"
  router={router}
>
  View Profile
</BaseLink>
```

**Props:**
- `routeName: string` - Target route name
- `routeParams?: object` - Route parameters
- `routeOptions?: NavigationOptions` - Navigation options
- `activeClassName?: string` - CSS class for active state (default: 'active')
- `activeStrict?: boolean` - Use strict active matching (default: false)
- `ignoreQueryParams?: boolean` - Ignore query params in active detection (default: true)
- `successCallback?: (state) => void` - Called on successful navigation
- `errorCallback?: (error) => void` - Called on navigation error
- `router: Router` - Router instance
- Plus all standard anchor element props

#### RouteNode

A render prop component for selective route node updates with performance optimization.

```tsx
import { RouteNode } from '@riogz/react-router';

<RouteNode nodeName="user">
  {(node, route) => (
    <div>
      Current user: {node?.params?.userId}
      Full route: {route.name}
    </div>
  )}
</RouteNode>
```

**Props:**
- `nodeName: string` - Name of the route node to watch
- `children: (node, route) => ReactNode` - Render function

### Hooks

#### useRouter()

Access the router instance without reactive updates. Use for imperative navigation.

```tsx
import { useRouter } from '@riogz/react-router';

function NavigationButton() {
  const router = useRouter();
  
  const handleClick = () => {
    router.navigate('dashboard', { userId: '123' });
  };
  
  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

**Returns:** `Router` - The router instance

**Note:** This hook does NOT trigger re-renders when the route changes. Use `useRoute()` for reactive updates.

#### useRoute()

Access the current route state with reactive updates. Components re-render when the route changes.

```tsx
import { useRoute } from '@riogz/react-router';

function CurrentRoute() {
  const route = useRoute();
  
  return (
    <div>
      <h1>Current Route: {route.name}</h1>
      <p>Params: {JSON.stringify(route.params)}</p>
      <p>Meta: {JSON.stringify(route.meta)}</p>
    </div>
  );
}
```

**Returns:** `State` - Current route state

#### useRouteNode(nodeName)

Access a specific route node with selective updates. Only re-renders when the specified node changes.

```tsx
import { useRouteNode } from '@riogz/react-router';

function UserSection() {
  const userNode = useRouteNode('user');
  
  if (!userNode) {
    return <div>No user context</div>;
  }
  
  return (
    <div>
      <h2>User: {userNode.params?.userId}</h2>
      <p>Section: {userNode.params?.section}</p>
    </div>
  );
}
```

**Parameters:**
- `nodeName: string` - Name of the route node to watch

**Returns:** `RouteNode | undefined` - The route node or undefined if not found

### Higher-Order Components (HOCs)

#### withRouter(Component)

Injects the router instance as a prop without reactive updates.

```tsx
import { withRouter } from '@riogz/react-router';

interface Props {
  router: Router;
  // ... other props
}

function NavigationComponent({ router, ...props }: Props) {
  return (
    <button onClick={() => router.navigate('home')}>
      Home
    </button>
  );
}

export default withRouter(NavigationComponent);
```

#### withRoute(Component)

Injects the current route state as a prop with reactive updates.

```tsx
import { withRoute } from '@riogz/react-router';

interface Props {
  route: State;
  // ... other props
}

function RouteDisplay({ route, ...props }: Props) {
  return <div>Current route: {route.name}</div>;
}

export default withRoute(RouteDisplay);
```

#### routeNode(nodeName)(Component)

Creates an HOC that injects a specific route node as a prop.

```tsx
import { routeNode } from '@riogz/react-router';

interface Props {
  node?: RouteNode;
  // ... other props
}

function UserComponent({ node, ...props }: Props) {
  if (!node) return <div>No user context</div>;
  
  return <div>User ID: {node.params?.userId}</div>;
}

export default routeNode('user')(UserComponent);
```

## Performance Optimization

### Selective Updates

Use `useRouteNode()` or the `RouteNode` component when you only need to react to changes in specific parts of the route tree:

```tsx
// ✅ Only re-renders when 'user' node changes
function UserInfo() {
  const userNode = useRouteNode('user');
  return <div>User: {userNode?.params?.userId}</div>;
}

// ❌ Re-renders on any route change
function UserInfo() {
  const route = useRoute();
  const userNode = route.route?.user;
  return <div>User: {userNode?.params?.userId}</div>;
}
```

### Non-Reactive Router Access

Use `useRouter()` for components that need router access but don't need to re-render on route changes:

```tsx
// ✅ No unnecessary re-renders
function NavigationButton() {
  const router = useRouter();
  return <button onClick={() => router.navigate('home')}>Home</button>;
}

// ❌ Re-renders on every route change
function NavigationButton() {
  const route = useRoute();
  const router = route.router;
  return <button onClick={() => router.navigate('home')}>Home</button>;
}
```

## Integration Patterns

### Route-Based Component Rendering

```tsx
function AppRouter() {
  const route = useRoute();
  
  // Simple route matching
  const renderRoute = () => {
    switch (route.name) {
      case 'home':
        return <HomePage />;
      case 'user.profile':
        return <UserProfile userId={route.params?.userId} />;
      case 'user.settings':
        return <UserSettings userId={route.params?.userId} />;
      default:
        return <NotFoundPage />;
    }
  };
  
  return (
    <div className="app">
      <Header />
      <main>{renderRoute()}</main>
      <Footer />
    </div>
  );
}
```

### Nested Route Components

```tsx
function UserLayout() {
  const userNode = useRouteNode('user');
  
  if (!userNode) {
    return <Redirect to="login" />;
  }
  
  return (
    <div className="user-layout">
      <UserSidebar userId={userNode.params?.userId} />
      <UserContent />
    </div>
  );
}

function UserContent() {
  const route = useRoute();
  
  // Handle nested user routes
  if (route.name.startsWith('user.profile')) {
    return <UserProfile />;
  }
  if (route.name.startsWith('user.settings')) {
    return <UserSettings />;
  }
  
  return <UserDashboard />;
}
```

### Active Link Styling

```tsx
function Navigation() {
  const route = useRoute();
  const router = useRouter();
  
  const isActive = (routeName: string) => {
    return router.isActive(routeName);
  };
  
  return (
    <nav>
      <a 
        href="#" 
        className={isActive('home') ? 'active' : ''}
        onClick={(e) => {
          e.preventDefault();
          router.navigate('home');
        }}
      >
        Home
      </a>
      <a 
        href="#" 
        className={isActive('about') ? 'active' : ''}
        onClick={(e) => {
          e.preventDefault();
          router.navigate('about');
        }}
      >
        About
      </a>
    </nav>
  );
}
```

## TypeScript Support

All components and hooks are fully typed. The library exports all necessary types:

```tsx
import { 
  RouteContext, 
  RouteState, 
  UnsubscribeFn,
  BaseLinkProps 
} from '@riogz/react-router';

// Custom hook with proper typing
function useCustomRoute(): RouteState {
  const route = useRoute();
  return {
    ...route,
    customProperty: 'value'
  };
}

// Custom component with proper props
interface CustomLinkProps extends BaseLinkProps {
  variant: 'primary' | 'secondary';
}

function CustomLink({ variant, ...props }: CustomLinkProps) {
  return (
    <BaseLink 
      {...props} 
      className={`link link--${variant} ${props.className || ''}`}
    />
  );
}
```

## Best Practices

1. **Use RouterProvider at the root** of your application
2. **Use useRoute() for reactive components** that need to respond to route changes
3. **Use useRouter() for navigation-only components** to avoid unnecessary re-renders
4. **Use useRouteNode() for performance** when you only care about specific route segments
5. **Prefer hooks over HOCs** in modern React applications
6. **Use BaseLink as a foundation** for building custom link components
7. **Implement proper error boundaries** around route components

## Migration from Other Routers

### From React Router

```tsx
// React Router
import { useNavigate, useLocation } from 'react-router-dom';

function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return <button onClick={() => navigate('/home')}>Home</button>;
}

// @riogz/react-router
import { useRouter, useRoute } from '@riogz/react-router';

function Component() {
  const router = useRouter();
  const route = useRoute();
  
  return <button onClick={() => router.navigate('home')}>Home</button>;
}
```

### From Reach Router

```tsx
// Reach Router
import { navigate, useLocation } from '@reach/router';

function Component() {
  const location = useLocation();
  
  return <button onClick={() => navigate('/home')}>Home</button>;
}

// @riogz/react-router
import { useRouter, useRoute } from '@riogz/react-router';

function Component() {
  const router = useRouter();
  const route = useRoute();
  
  return <button onClick={() => router.navigate('home')}>Home</button>;
}
```

## License

MIT
