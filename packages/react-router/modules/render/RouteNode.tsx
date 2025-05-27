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
    children: (routeContext: RouteContext) => ReactNode
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
 * Internal render function for RouteNode content.
 * Executes the children render prop with route context.
 * 
 * @param {InternalRouteNodeRendererProps} props - Component props
 * @returns {React.ReactNode} Rendered content from children function
 * @private
 */
const _RouteNodeRenderFunction = (props: InternalRouteNodeRendererProps): React.ReactNode => {
    const { router, route, previousRoute, children } = props;
    return children({ router, route, previousRoute });
};

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

    // Определяем, активен ли данный узел RouteNode
    const isActive = route && route.name === nodeName;

    if (!isActive) {
        return null; // Не рендерить дочерние элементы, если узел не активен
    }

    // Если узел активен, рендерим дочерние элементы
    const contentToRender = children({ router, route, previousRoute });

    if (contentToRender === null || typeof contentToRender === 'undefined' || typeof contentToRender === 'boolean') {
        // Булевы значения (валидный ReactNode) приводят к отсутствию рендера, аналогично null.
        return null;
    }
    if (React.isValidElement(contentToRender)) {
        return contentToRender; // Уже ReactElement
    }
    // Для строк, чисел и других ReactNode, которые не являются ReactElement (например, массивы узлов),
    // оборачиваем во фрагмент, чтобы сделать их ReactElement.
    return <>{contentToRender}</>;
};

/**
 * Memoized internal renderer component with optimized update logic.
 * Only re-renders when necessary based on route node changes.
 * 
 * @private
 */
const InternalRouteNodeRenderer = memo(TypedRouteNodeRenderer, (prevProps, nextProps) => {
    // 1. Проверяем базовые изменения, не связанные с роутом
    if (prevProps.children !== nextProps.children || prevProps.nodeName !== nextProps.nodeName) {
        return false; // Нужно обновить
    }

    // 2. Определяем состояние активности для предыдущих и следующих пропсов
    const wasActive = prevProps.route && prevProps.route.name === prevProps.nodeName;
    const willBeActive = nextProps.route && nextProps.route.name === nextProps.nodeName;

    // 3. Если состояние активности изменилось, нужно обновить
    if (wasActive !== willBeActive) {
        return false; // Нужно обновить
    }

    // 4. Если узел остается активным, проверяем, нужно ли его обновить
    //    (например, из-за изменения параметров маршрута или других деталей в nextProps.route)
    //    shouldUpdateNode здесь проверяет, нужно ли обновлять АКТИВНЫЙ узел
    if (willBeActive) { // Эквивалентно wasActive, так как они равны на этом этапе
        const needsUpdateIfActive = shouldUpdateNode(nextProps.nodeName)(
            nextProps.route,
            nextProps.previousRoute
        );
        return !needsUpdateIfActive; // Если needsUpdateIfActive=true, то !true = false (нужно обновить)
    }

    // 5. Если узел был неактивен и остается неактивным, его не нужно обновлять.
    //    (Сюда мы попадаем, если wasActive = false и willBeActive = false)
    return true; // Пропсы равны, не нужно обновлять
});

// const InternalRouteNodeRenderer = TypedRouteNodeRenderer; // Возвращаем memo

const RouteNode: FunctionComponent<RouteNodeProps> = (props) => {
    const routeCtx = useRoute();
    return <InternalRouteNodeRenderer {...props} {...routeCtx} />;
}

export default RouteNode
