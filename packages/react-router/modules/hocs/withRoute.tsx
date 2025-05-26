/**
 * @fileoverview Higher-Order Component for injecting route context with reactive updates.
 * Provides router instance and route state to components with automatic re-rendering
 * on route changes.
 * 
 * @module @riogz/react-router/hocs/withRoute
 */

import React, { ComponentType, FC } from 'react'
import { routeContext } from '../context'
import { RouteContext } from '../types'

/**
 * Higher-Order Component that injects route context as props with reactive updates.
 * 
 * This HOC provides access to the router instance, current route, and previous route
 * with automatic re-rendering when route changes occur. It's the class component
 * equivalent of the useRoute() hook.
 * 
 * @template P - The props type of the wrapped component
 * @param {ComponentType<P & RouteContext>} BaseComponent - Component to wrap
 * @returns {FC<P>} Enhanced component with route context props injected
 * 
 * @example
 * ```typescript
 * import React from 'react'
 * import { withRoute } from '@riogz/react-router'
 * import { RouteContext } from '@riogz/react-router'
 * 
 * // Component that receives route context as props
 * interface PageHeaderProps extends RouteContext {
 *   title?: string
 * }
 * 
 * function PageHeader({ router, route, previousRoute, title }: PageHeaderProps) {
 *   const pageTitle = title || route.name
 *   
 *   return (
 *     <header>
 *       <h1>{pageTitle}</h1>
 *       <nav>
 *         <button onClick={() => router.navigate('home')}>Home</button>
 *         <button onClick={() => router.navigate('about')}>About</button>
 *       </nav>
 *       {previousRoute && (
 *         <p>Previous page: {previousRoute.name}</p>
 *       )}
 *     </header>
 *   )
 * }
 * 
 * // Enhanced component with route context injected
 * const PageHeaderWithRoute = withRoute(PageHeader)
 * 
 * // Usage - route context props are automatically provided
 * function App() {
 *   return (
 *     <div>
 *       <PageHeaderWithRoute title="My App" />
 *       <main>
 *         <RouteContent />
 *       </main>
 *     </div>
 *   )
 * }
 * 
 * // Class component example
 * interface RouteDisplayProps extends RouteContext {
 *   className?: string
 * }
 * 
 * class RouteDisplay extends React.Component<RouteDisplayProps> {
 *   handleNavigate = (routeName: string) => {
 *     this.props.router.navigate(routeName)
 *   }
 *   
 *   render() {
 *     const { route, previousRoute, className } = this.props
 *     
 *     return (
 *       <div className={className}>
 *         <h2>Current Route: {route.name}</h2>
 *         <p>Parameters: {JSON.stringify(route.params)}</p>
 *         {previousRoute && (
 *           <p>Came from: {previousRoute.name}</p>
 *         )}
 *         
 *         <button onClick={() => this.handleNavigate('users')}>
 *           Go to Users
 *         </button>
 *       </div>
 *     )
 *   }
 * }
 * 
 * const EnhancedRouteDisplay = withRoute(RouteDisplay)
 * 
 * // Usage
 * <EnhancedRouteDisplay className="route-info" />
 * ```
 */
function withRoute<P>(BaseComponent: ComponentType<P & RouteContext>): FC<P> {
    return function withRoute(props) {
        return (
            <routeContext.Consumer>
                {routeContext => <BaseComponent {...props} {...routeContext} />}
            </routeContext.Consumer>
        )
    }
}

export default withRoute
