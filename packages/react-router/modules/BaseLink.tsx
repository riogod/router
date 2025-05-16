import { NavigationOptions, State, Router } from '@riogz/router'
import React, { HTMLAttributes, MouseEventHandler, useCallback, useMemo, FC } from 'react'

export interface BaseLinkProps extends HTMLAttributes<HTMLAnchorElement> {
    routeName: string
    routeParams?: { [key: string]: any }
    routeOptions?: NavigationOptions
    className?: string
    activeClassName?: string
    activeStrict?: boolean
    ignoreQueryParams?: boolean
    onClick?: MouseEventHandler<HTMLAnchorElement>
    onMouseOver?: MouseEventHandler<HTMLAnchorElement>
    successCallback?(state?: State): void
    errorCallback?(error?: any): void
    target?: string
    route?: State
    previousRoute?: State
    router: Router
}

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

    const isActiveCallback = useCallback(() => {
        return router.isActive(
            routeName,
            routeParams,
            activeStrict,
            ignoreQueryParams
        )
    }, [router, routeName, routeParams, activeStrict, ignoreQueryParams])

    const active = useMemo(() => isActiveCallback(), [isActiveCallback])

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
