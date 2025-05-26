/**
 * @fileoverview Higher-Order Component for selective route node updates.
 * Provides optimized route context injection that only updates when specific
 * route nodes change, improving performance for large route trees.
 * 
 * @module @riogz/react-router/hocs/routeNode
 */

import React, { SFC, ComponentType } from 'react'
import { RouteContext } from '../types'
import RouteNode from '../render/RouteNode'

/**
 * Higher-Order Component factory that creates route node-specific components.
 * 
 * This HOC provides selective route updates by only re-rendering when the specified
 * route node should be updated. It's the class component equivalent of the
 * useRouteNode() hook and provides better performance than withRoute() for
 * components that only care about specific parts of the route tree.
 * 
 * @param {string} nodeName - The route node name to monitor for changes
 * @returns {Function} HOC function that wraps components with route node context
 * 
 * @example
 * ```typescript
 * import React from 'react'
 * import { routeNode } from '@riogz/react-router'
 * import { RouteContext } from '@riogz/react-router'
 * 
 * // Component that receives route context for specific node
 * interface UserSectionProps extends RouteContext {
 *   className?: string
 * }
 * 
 * function UserSection({ router, route, previousRoute, className }: UserSectionProps) {
 *   // This component only updates when 'users' route node changes
 *   
 *   if (!route.name.startsWith('users')) {
 *     return <div>Not in users section</div>
 *   }
 *   
 *   return (
 *     <div className={className}>
 *       <h2>Users Section</h2>
 *       <p>Current user route: {route.name}</p>
 *       <p>User ID: {route.params.id}</p>
 *       
 *       <nav>
 *         <button onClick={() => router.navigate('users.list')}>
 *           User List
 *         </button>
 *         <button onClick={() => router.navigate('users.profile', { id: '123' })}>
 *           User Profile
 *         </button>
 *       </nav>
 *     </div>
 *   )
 * }
 * 
 * // Create HOC for 'users' route node
 * const UserSectionWithRouteNode = routeNode('users')(UserSection)
 * 
 * // Usage - component only updates for users route changes
 * function App() {
 *   return (
 *     <div>
 *       <UserSectionWithRouteNode className="user-section" />
 *     </div>
 *   )
 * }
 * 
 * // Multiple route nodes example
 * function AdminPanel({ router, route }: RouteContext) {
 *   return (
 *     <div>
 *       <h2>Admin Panel</h2>
 *       <p>Current admin page: {route.name}</p>
 *       <button onClick={() => router.navigate('admin.users')}>
 *         Manage Users
 *       </button>
 *     </div>
 *   )
 * }
 * 
 * function ProfileSection({ router, route }: RouteContext) {
 *   return (
 *     <div>
 *       <h2>Profile Section</h2>
 *       <p>Profile for: {route.params.userId}</p>
 *     </div>
 *   )
 * }
 * 
 * // Create optimized components for different route nodes
 * const AdminPanelOptimized = routeNode('admin')(AdminPanel)
 * const ProfileSectionOptimized = routeNode('users.profile')(ProfileSection)
 * 
 * // These components will only update when their specific route nodes change
 * function Dashboard() {
 *   return (
 *     <div>
 *       <AdminPanelOptimized />
 *       <ProfileSectionOptimized />
 *     </div>
 *   )
 * }
 * ```
 */
function routeNode<P>(nodeName: string) {
    return function(BaseComponent: ComponentType<P & RouteContext>): SFC<P> {
        function RouteNodeWrapper(props: P) {
            return (
                <RouteNode nodeName={nodeName}>
                    {routeContext => (
                        <BaseComponent {...props} {...routeContext} />
                    )}
                </RouteNode>
            )
        }

        return RouteNodeWrapper
    }
}

export default routeNode
