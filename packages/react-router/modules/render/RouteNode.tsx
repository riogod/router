/**
 * @fileoverview RouteNode render prop component for selective route updates.
 * Provides optimized route rendering that only updates when specific route nodes
 * should be updated, improving performance for large route trees.
 * 
 * @module @riogz/react-router/render/RouteNode
 */

import React, { ReactNode, FunctionComponent, memo } from 'react'
import { shouldUpdateNode } from '@riogz/router-transition-path'
import { RouteContext } from '../types'
import useRoute from '../hooks/useRoute'

/**
 * Props for the RouteNode component.
 * 
 * @interface RouteNodeProps
 */
export interface RouteNodeProps {
    /** The route node name to monitor for changes */
    nodeName: string
    /** Render prop function that receives route context */
    children: ReactNode | ((routeContext: RouteContext) => ReactNode)
}

/**
 * Internal props for the RouteNode renderer component.
 * Combines RouteNodeProps with RouteContext for internal use.
 * 
 * @interface InternalRouteNodeRendererProps
 * @private
 */
interface InternalRouteNodeRendererProps extends RouteNodeProps, RouteContext {}

/**
 * Typed wrapper component that ensures proper React element return type.
 * Handles active/inactive state and wraps non-element content in fragments.
 * 
 * @param {InternalRouteNodeRendererProps} props - Component props
 * @returns {React.ReactElement | null} Rendered element or null if inactive
 * @private
 */
const TypedRouteNodeRenderer = (props: InternalRouteNodeRendererProps): React.ReactElement | null => {
    const { router, route, previousRoute, nodeName, children } = props;

    // Determine if this RouteNode is active
    const isActive = route && route.name === nodeName;

    if (!isActive) {
        return null; // Don't render children if node is not active
    }

    // If node is active, render children
    const contentToRender = typeof children === 'function' ? children({ router, route, previousRoute }) : children;

    if (contentToRender === null || typeof contentToRender === 'undefined' || typeof contentToRender === 'boolean') {
        // Boolean values (valid ReactNode) result in no render, similar to null.
        return null;
    }
    if (React.isValidElement(contentToRender)) {
        return contentToRender; // Already a ReactElement
    }
    // For strings, numbers and other ReactNode that are not ReactElement (e.g., arrays of nodes),
    // wrap in fragment to make them ReactElement.
    return <>{contentToRender}</>;
};

/**
 * Memoized internal renderer component with optimized update logic.
 * Only re-renders when necessary based on route node changes.
 * 
 * @private
 */
const InternalRouteNodeRenderer = memo(TypedRouteNodeRenderer, (prevProps, nextProps) => {
    // 1. Check basic changes not related to route
    if (prevProps.children !== nextProps.children || prevProps.nodeName !== nextProps.nodeName) {
        return false; // Need to update
    }

    // 2. Determine activity state for previous and next props
    const wasActive = prevProps.route && prevProps.route.name === prevProps.nodeName;
    const willBeActive = nextProps.route && nextProps.route.name === nextProps.nodeName;

    // 3. If activity state changed, need to update
    if (wasActive !== willBeActive) {
        return false; // Need to update
    }

    // 4. If node remains active, check if it needs to be updated
    //    (e.g., due to route parameter changes or other details in nextProps.route)
    //    shouldUpdateNode here checks if ACTIVE node needs updating
    if (willBeActive) { // Equivalent to wasActive, since they are equal at this point
        const needsUpdateIfActive = shouldUpdateNode(nextProps.nodeName)(
            nextProps.route,
            nextProps.previousRoute
        );
        return !needsUpdateIfActive; // If needsUpdateIfActive=true, then !true = false (need to update)
    }

    // 5. If node was inactive and remains inactive, it doesn't need updating.
    //    (We reach here if wasActive = false and willBeActive = false)
    return true; // Props are equal, no need to update
});

const RouteNode: FunctionComponent<RouteNodeProps> = (props) => {
    const routeCtx = useRoute();
    return <InternalRouteNodeRenderer {...props} {...routeCtx} />;
}

export default RouteNode
