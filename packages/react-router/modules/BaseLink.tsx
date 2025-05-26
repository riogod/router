import { NavigationOptions, State, Router } from '@riogz/router'
import React, { HTMLAttributes, MouseEventHandler, useCallback, useMemo, FC } from 'react'

/**
 * Props for the BaseLink component.
 * 
 * @interface BaseLinkProps
 * @extends HTMLAttributes<HTMLAnchorElement>
 * 
 * @example
 * ```tsx
 * const linkProps: BaseLinkProps = {
 *   routeName: 'user.profile',
 *   routeParams: { userId: '123' },
 *   activeClassName: 'current',
 *   router: myRouter
 * };
 * ```
 */
export interface BaseLinkProps extends HTMLAttributes<HTMLAnchorElement> {
    /** The name of the route to navigate to */
    routeName: string
    
    /** Parameters to pass to the route (e.g., { userId: '123' }) */
    routeParams?: { [key: string]: any }
    
    /** Navigation options (e.g., replace: true) */
    routeOptions?: NavigationOptions
    
    /** CSS class name(s) to apply to the link */
    className?: string
    
    /** CSS class name to apply when the link is active (default: 'active') */
    activeClassName?: string
    
    /** Whether to use strict matching for active state (default: false) */
    activeStrict?: boolean
    
    /** Whether to ignore query parameters when determining active state (default: true) */
    ignoreQueryParams?: boolean
    
    /** Click event handler */
    onClick?: MouseEventHandler<HTMLAnchorElement>
    
    /** Mouse over event handler */
    onMouseOver?: MouseEventHandler<HTMLAnchorElement>
    
    /** Callback called on successful navigation */
    successCallback?(state?: State): void
    
    /** Callback called on navigation error */
    errorCallback?(error?: any): void
    
    /** Target attribute for the link (e.g., '_blank') */
    target?: string
    
    /** Current route state (used internally) */
    route?: State
    
    /** Previous route state (used internally) */
    previousRoute?: State
    
    /** Router instance to use for navigation */
    router: Router
}

/**
 * Base link component for router navigation.
 * 
 * This component provides a foundation for creating navigation links that integrate
 * with the router. It handles active state detection, programmatic navigation,
 * and proper URL generation.
 * 
 * @component
 * @param props - The component props
 * @returns A React anchor element with router integration
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <BaseLink 
 *   routeName="user.profile" 
 *   routeParams={{ userId: '123' }}
 *   router={router}
 * >
 *   View Profile
 * </BaseLink>
 * 
 * // With active styling
 * <BaseLink 
 *   routeName="dashboard" 
 *   activeClassName="current-page"
 *   className="nav-link"
 *   router={router}
 * >
 *   Dashboard
 * </BaseLink>
 * 
 * // With callbacks
 * <BaseLink 
 *   routeName="settings" 
 *   successCallback={(state) => console.log('Navigated to:', state)}
 *   errorCallback={(error) => console.error('Navigation failed:', error)}
 *   router={router}
 * >
 *   Settings
 * </BaseLink>
 * ```
 */
const BaseLink: FC<BaseLinkProps> = (props) => {
    const {
        routeName,
        routeParams = {},
        routeOptions = {},
        className,
        activeClassName = 'active',
        activeStrict = false,
        ignoreQueryParams = true,
        onClick: propsOnClick,
        successCallback,
        errorCallback,
        target,
        router,
        children,
        ...otherProps
    } = props

    /**
     * Builds a URL for the given route name and parameters.
     * 
     * Prefers router.buildUrl() if available (from browser plugin),
     * falls back to router.buildPath() for basic path generation.
     * 
     * @param currentRouteName - The route name to build URL for
     * @param currentRouteParams - Parameters for the route
     * @returns The built URL/path string
     */
    const buildUrlCallback = useCallback(
        (currentRouteName: string, currentRouteParams: { [key: string]: any }) => {
            if ('buildUrl' in router && typeof (router as any).buildUrl === 'function') {
                // После проверки 'in', TypeScript должен понимать, что router может иметь это свойство.
                // Приведение типа для вызова функции все еще может быть полезным, если сигнатура не выводится.
                return ((router as any).buildUrl as (name: string, params: { [key: string]: any }) => string)(
                    currentRouteName,
                    currentRouteParams
                );
            }
            return router.buildPath(currentRouteName, currentRouteParams);
        },
        [router]
    );

    /**
     * Determines if the current link should be considered active.
     * 
     * Uses router.isActive() with the configured parameters to check
     * if the current route matches this link's target route.
     * 
     * @returns True if the link is active, false otherwise
     */
    const isActiveCallback = useCallback(() => {
        return router.isActive(
            routeName,
            routeParams,
            activeStrict,
            ignoreQueryParams
        )
    }, [router, routeName, routeParams, activeStrict, ignoreQueryParams])

    const active = useMemo(() => isActiveCallback(), [isActiveCallback])

    /**
     * Handles navigation completion, calling success or error callbacks as appropriate.
     * 
     * @param err - Error object if navigation failed, undefined if successful
     * @param navState - The new route state if navigation was successful
     */
    const navigationCallback = useCallback(
        (err?: any, navState?: State) => {
            if (!err && successCallback) {
                successCallback(navState)
            }
            if (err && errorCallback) {
                errorCallback(err)
            }
        },
        [successCallback, errorCallback]
    )

    /**
     * Handles click events on the link.
     * 
     * Performs programmatic navigation for normal left-clicks without modifier keys,
     * while allowing browser default behavior for special cases (right-click, 
     * ctrl+click, target="_blank", etc.).
     * 
     * @param evt - The mouse click event
     */
    const clickHandler: MouseEventHandler<HTMLAnchorElement> = useCallback(
        (evt) => {
            if (propsOnClick) {
                propsOnClick(evt)
                if (evt.defaultPrevented) {
                    return
                }
            }

            const comboKey =
                evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey

            if (evt.button === 0 && !comboKey && target !== '_blank') {
                evt.preventDefault()
                router.navigate(
                    routeName,
                    routeParams,
                    routeOptions,
                    navigationCallback
                )
            }
        },
        [
            propsOnClick,
            target,
            router,
            routeName,
            routeParams,
            routeOptions,
            navigationCallback
        ]
    )

    const href = useMemo(
        () => buildUrlCallback(routeName, routeParams),
        [buildUrlCallback, routeName, routeParams]
    )

    /**
     * Combines the base className with the active className when appropriate.
     * 
     * Handles both string and array className formats, and ensures proper
     * space-separated class name output.
     * 
     * @returns Combined className string or undefined if no classes
     */
    const combinedClassName = useMemo(() => {
        const classes = []
        if (active) {
            classes.push(activeClassName)
        }
        if (className) {
            // Ensure className is treated as a string before split
            classes.push(...(typeof className === 'string' ? className.split(' ') : []))
        }
        const finalClassName = classes.filter(Boolean).join(' ')
        return finalClassName.length > 0 ? finalClassName : undefined
    }, [active, activeClassName, className])

    return (
        <a
            {...otherProps}
            href={href}
            className={combinedClassName}
            onClick={clickHandler}
            target={target}
            // onMouseOver is included in ...otherProps if provided
        >
            {children}
        </a>
    )
}

export default BaseLink
