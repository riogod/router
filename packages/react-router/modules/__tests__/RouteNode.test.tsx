/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen } from '@testing-library/react';
import RouteNode from '../render/RouteNode';
import RouterProvider from '../RouterProvider';
import { Router, State, NavigationOptions } from '@riogz/router';
import { RouteContext } from '../types';
import { act } from 'react-dom/test-utils';

// Убираем глобальный мок, будем использовать реальную реализацию или мокать по месту
// jest.mock('@riogz/router-transition-path', () => ({
//     ...jest.requireActual('@riogz/router-transition-path'),
//     shouldUpdateNode: () => () => true, 
// }));

const mockRouterSubscribe = jest.fn(() => jest.fn());

// Более полный мок роутера для тестов RouteNode
const createFullTestRouter = (initialState?: Partial<State>): Router => {
    let listeners: Array<(state: { route: State; previousRoute: State | null }) => void> = [];
    let currentState: State = {
        name: 'initial',
        path: '/initial',
        params: {},
        meta: { id: 0, params: {}, options: {}, redirected: false },
        ...(initialState || {}),
    } as State;
    let previousState: State | null = null;

    const routerInstance = {
        getState: () => currentState,
        subscribe: (listener: any) => {
            listeners.push(listener);
            // Вызываем слушателя с начальным состоянием, если он еще не был вызван
            // listener({ route: currentState, previousRoute }); 
            // Это может быть лишним, т.к. RouterProvider сам устанавливает начальное состояние
            return () => {
                listeners = listeners.filter(l => l !== listener);
            };
        },
        navigate: jest.fn(async (name: string, params: Record<string, any> = {}, opts: NavigationOptions = {}) => {
            previousState = { ...currentState };
            const newPath = `/${name}${Object.keys(params).length ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`;
            currentState = {
                name,
                params,
                path: newPath,
                meta: { id: (previousState?.meta?.id || 0) + 1, params: {}, options: opts, redirected: false },
            };
            // Копируем слушателей перед итерацией на случай, если слушатель отписывается
            const currentListeners = [...listeners]; 
            act(() => {
                currentListeners.forEach(l => l({ route: { ...currentState }, previousRoute: previousState ? { ...previousState } : null }));
            });
            return currentState;
        }),
        // Добавим остальные моки, чтобы соответствовать типу Router
        isActive: jest.fn((nameToCheck: string) => currentState.name === nameToCheck),
        buildPath: jest.fn((name, params) => `/${name}` + (params ? `?${new URLSearchParams(params as Record<string, string>).toString()}`: '')),
        matchPath: jest.fn(() => null),
        start: jest.fn(() => Promise.resolve()),
        stop: jest.fn(),
        canDeactivate: jest.fn(() => true),
        canActivate: jest.fn(() => true),
        cancel: jest.fn(),
        setOption: jest.fn(),
        getOption: jest.fn(),
        setDependency: jest.fn(),
        getDependencies: jest.fn(() => ({} as any)),
        setDependencies: jest.fn(),
        add: jest.fn(() => (() => {})),
        addNode: jest.fn(() => (() => {})),
        addPlugin: jest.fn(() => (() => {})),
        usePlugin: jest.fn(() => ({} as any)),
        hasPlugin: jest.fn(() => false),
        useMiddleware: jest.fn(() => (() => {})),
        clearMiddleware: jest.fn(),
        getMiddlewareFactories: jest.fn(() => []),
        getPlugins: jest.fn(() => []),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        invokeEventListeners: jest.fn(),
        config: { defaultRoute: '', defaultParams: {}, strictTrailingSlash: false, queryParams: {}, strongMatching: true, preserveRawPath: false } as any,
        rootNode: {} as any,
    };
    return routerInstance as unknown as Router;
};

describe('RouteNode', () => {
    const initialState: State = {
        name: 'root',
        path: '/',
        params: {},
        meta: { id: 1, params: {}, options: {}, redirected: false },
    };
    let router: Router;

    beforeEach(() => {
        router = {
            getState: () => initialState,
            subscribe: mockRouterSubscribe,
        } as any;
    });

    it('рендерит children', () => {
        // Используем новый мок роутера
        router = createFullTestRouter({ name: 'root', path: '/' });
        render(
            <RouterProvider router={router}>
                <RouteNode nodeName="root">
                    {() => <div data-testid="child">Child</div>}
                </RouteNode>
            </RouterProvider>
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('children-функция получает route и previousRoute', () => {
        // Используем новый мок роутера
        router = createFullTestRouter({ name: 'root', path: '/' });
        render(
            <RouterProvider router={router}>
                <RouteNode nodeName="root">
                    {(props: RouteContext) => (
                        <>
                            <span data-testid="route">{props.route.name}</span>
                            <span data-testid="prev">{props.previousRoute ? props.previousRoute.name : 'none'}</span>
                        </>
                    )}
                </RouteNode>
            </RouterProvider>
        );
        expect(screen.getByTestId('route')).toHaveTextContent('root');
        expect(screen.getByTestId('prev')).toHaveTextContent('none');
    });

    it('рендерит только активный узел и корректно переключается при навигации', async () => {
        const homeState: State = { name: 'home', path: '/home', params: {}, meta: { id: 1, params: {}, options: {}, redirected: false } };
        const profileState: State = { name: 'profile', path: '/profile', params: {}, meta: { id: 2, params: {}, options: {}, redirected: false } };

        router = createFullTestRouter(homeState);

        const { queryByTestId, findByTestId } = render(
            <RouterProvider router={router}>
                <RouteNode nodeName="home">
                    {() => <div data-testid="home-node">Home Page</div>}
                </RouteNode>
                <RouteNode nodeName="profile">
                    {() => <div data-testid="profile-node">Profile Page</div>}
                </RouteNode>
            </RouterProvider>
        );

        // Начальное состояние: только home-node должен быть виден
        expect(queryByTestId('home-node')).toBeInTheDocument();
        expect(queryByTestId('profile-node')).not.toBeInTheDocument();

        // Переходим на profile
        await router.navigate(profileState.name, profileState.params, profileState.meta!.options);
        
        // Убеждаемся, что profile-node появился, а home-node исчез
        // Используем findByTestId для асинхронного ожидания, если render занимает время
        expect(await findByTestId('profile-node')).toBeInTheDocument();
        expect(queryByTestId('home-node')).not.toBeInTheDocument();

        // Переходим обратно на home
        await router.navigate(homeState.name, homeState.params, homeState.meta!.options);

        expect(await findByTestId('home-node')).toBeInTheDocument();
        expect(queryByTestId('profile-node')).not.toBeInTheDocument();
    });

    it('не "залипают" старые узлы после нескольких навигаций', async () => {
        const page1State: State = { name: 'page1', path: '/page1', params: {}, meta: { id: 1, params: {}, options: {}, redirected: false } };
        const page2State: State = { name: 'page2', path: '/page2', params: {}, meta: { id: 2, params: {}, options: {}, redirected: false } };
        const page3State: State = { name: 'page3', path: '/page3', params: {}, meta: { id: 3, params: {}, options: {}, redirected: false } };

        router = createFullTestRouter(page1State);

        const { queryByTestId, findByTestId } = render(
            <RouterProvider router={router}>
                <RouteNode nodeName="page1">
                    {() => <div data-testid="page1-node">Page 1</div>}
                </RouteNode>
                <RouteNode nodeName="page2">
                    {() => <div data-testid="page2-node">Page 2</div>}
                </RouteNode>
                <RouteNode nodeName="page3">
                    {() => <div data-testid="page3-node">Page 3</div>}
                </RouteNode>
            </RouterProvider>
        );

        // Начало: page1
        expect(await findByTestId('page1-node')).toBeInTheDocument();
        expect(queryByTestId('page2-node')).not.toBeInTheDocument();
        expect(queryByTestId('page3-node')).not.toBeInTheDocument();

        // Переход: page1 -> page2
        await router.navigate(page2State.name, page2State.params, page2State.meta!.options);
        expect(await findByTestId('page2-node')).toBeInTheDocument();
        expect(queryByTestId('page1-node')).not.toBeInTheDocument();
        expect(queryByTestId('page3-node')).not.toBeInTheDocument();

        // Переход: page2 -> page3
        await router.navigate(page3State.name, page3State.params, page3State.meta!.options);
        expect(await findByTestId('page3-node')).toBeInTheDocument();
        expect(queryByTestId('page1-node')).not.toBeInTheDocument();
        expect(queryByTestId('page2-node')).not.toBeInTheDocument();
        
        // Переход: page3 -> page1
        await router.navigate(page1State.name, page1State.params, page1State.meta!.options);
        expect(await findByTestId('page1-node')).toBeInTheDocument();
        expect(queryByTestId('page2-node')).not.toBeInTheDocument();
        expect(queryByTestId('page3-node')).not.toBeInTheDocument();
    });

    // Тест оптимизации обновлений (shouldUpdateNode) можно реализовать только через интеграционный тест с реальным изменением состояния,
    // либо через отдельный unit-тест InternalRouteNodeRenderer, если он экспортируется.
}); 