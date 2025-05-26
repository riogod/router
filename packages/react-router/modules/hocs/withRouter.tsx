/**
 * @fileoverview Higher-Order Component for injecting router instance.
 * Provides router functionality to class components and components that need
 * router access without reactive updates.
 * 
 * @module @riogz/react-router/hocs/withRouter
 */

import type{ ComponentType, FC } from 'react'
import { Router } from '@riogz/router'
import { routerContext } from '../context'

/**
 * Higher-Order Component that injects the router instance as a prop.
 * 
 * This HOC provides access to the router instance without subscribing to route changes,
 * making it suitable for components that need router functionality but don't need
 * to re-render on route changes. For reactive updates, consider using withRoute() instead.
 * 
 * @template P - The props type of the wrapped component
 * @param {ComponentType<P & { router: Router }>} BaseComponent - Component to wrap
 * @returns {FC<Omit<P, 'router'>>} Enhanced component with router prop injected
 * 
 * @example
 * ```typescript
 * import React from 'react'
 * import { withRouter } from '@riogz/react-router'
 * import { Router } from '@riogz/router'
 * 
 * // Component that receives router as prop
 * interface NavigationProps {
 *   router: Router
 *   className?: string
 * }
 * 
 * function Navigation({ router, className }: NavigationProps) {
 *   const handleHomeClick = () => {
 *     router.navigate('home')
 *   }
 *   
 *   const handleAboutClick = () => {
 *     router.navigate('about')
 *   }
 *   
 *   return (
 *     <nav className={className}>
 *       <button onClick={handleHomeClick}>Home</button>
 *       <button onClick={handleAboutClick}>About</button>
 *     </nav>
 *   )
 * }
 * 
 * // Enhanced component with router injected
 * const NavigationWithRouter = withRouter(Navigation)
 * 
 * // Usage - no need to pass router prop
 * function App() {
 *   return (
 *     <div>
 *       <NavigationWithRouter className="main-nav" />
 *     </div>
 *   )
 * }
 * 
 * // Class component example
 * interface ButtonProps {
 *   router: Router
 *   routeName: string
 *   children: React.ReactNode
 * }
 * 
 * class NavigationButton extends React.Component<ButtonProps> {
 *   handleClick = () => {
 *     this.props.router.navigate(this.props.routeName)
 *   }
 *   
 *   render() {
 *     return (
 *       <button onClick={this.handleClick}>
 *         {this.props.children}
 *       </button>
 *     )
 *   }
 * }
 * 
 * const EnhancedButton = withRouter(NavigationButton)
 * 
 * // Usage
 * <EnhancedButton routeName="profile">Go to Profile</EnhancedButton>
 * ```
 */
function withRouter<P>(
    BaseComponent: ComponentType<P & { router: Router }>
): FC<Omit<P, 'router'>> {
    return function WithRouter(props: P) {
        return (
            <routerContext.Consumer>
                {router => <BaseComponent {...props} router={router} />}
            </routerContext.Consumer>
        )
    }
}

export default withRouter
