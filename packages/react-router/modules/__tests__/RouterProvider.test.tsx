import React, { useContext } from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom'; // Для toBeInTheDocument
import { Router, State, StateMeta, Listener, SubscribeFn, NavigationOptions } from '@riogz/router';
import RouterProvider from '../RouterProvider'; // Исправлен импорт
import { routerContext, routeContext } from '../context';
import { shouldSubscribeToRouter } from '../RouterProvider';
// RouteContext уже импортирован в RouterProvider, но если он нужен здесь явно, оставим
// import { RouteContext } from '../types'; 

// Вспомогательный компонент для чтения контекста
const RouterContextConsumer: React.FC = () => {
    const router = useContext(routerContext);
    return <div data-testid="router-consumer">{router ? 'router-exists' : 'no-router'}</div>;
};

const RouteContextConsumer: React.FC = () => {
    const context = useContext(routeContext);
    return (
        <div data-testid="route-consumer">
            {context ? `route:${context.route?.name}|prev:${context.previousRoute?.name || 'null'}` : 'no-route-context'}
        </div>
    );
};

// Упрощенный тип для слушателя в моке
type MockRouterListener = (state: { route: State; previousRoute: State | null }) => void;

const createTestRouter = (initialState?: Partial<State>): Router => {
    let listeners: Array<MockRouterListener> = [];
    let currentState: State = {
        name: 'initial',
        path: '/initial',
        params: {},
        meta: { id: 0, params: {}, options: {}, redirected: false }, 
        ...initialState,
    } as State;
    let previousState: State | null = null;

    return {
        getState: () => currentState,
        subscribe: (listener: Listener | SubscribeFn) => {
            listeners.push(listener as MockRouterListener);
            return () => {
                listeners = listeners.filter(l => l !== (listener as MockRouterListener));
            };
        },
        navigate: (name: string, params: Record<string, any> = {}, opts: NavigationOptions = {}) => {
            previousState = { ...currentState };
            const newPath = `/${name}${Object.keys(params).length ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`;
            currentState = {
                name,
                params,
                path: newPath,
                meta: { id: (previousState?.meta?.id || 0) + 1, params: {}, options: opts, redirected: false }, 
            };
            const currentListeners = [...listeners];
            act(() => {
                currentListeners.forEach(l => l({ route: { ...currentState }, previousRoute: previousState ? { ...previousState } : null }));
            });
            return Promise.resolve(currentState);
        },
        isActive: jest.fn(() => false),
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
    } as unknown as Router;
};

const defaultTestMeta: Omit<StateMeta, 'path'> = { id: 1, params: {}, options: {}, redirected: false };

describe('RouterProvider', () => {
    it('should render children', () => {
        const router = createTestRouter();
        const { getByText } = render(
            <RouterProvider router={router}>
                <div>Test Child</div>
            </RouterProvider>
        );
        expect(getByText('Test Child')).toBeInTheDocument();
    });

    it('should provide router context', () => {
        const router = createTestRouter();
        const { getByTestId } = render(
            <RouterProvider router={router}>
                <RouterContextConsumer />
            </RouterProvider>
        );
        expect(getByTestId('router-consumer').textContent).toBe('router-exists');
    });

    it('should provide initial route context', () => {
        const initialRoute: Partial<State> = { name: 'home', path: '/home', meta: { ...defaultTestMeta, id: 1 } };
        const router = createTestRouter(initialRoute);
        const { getByTestId } = render(
            <RouterProvider router={router}>
                <RouteContextConsumer />
            </RouterProvider>
        );
        expect(getByTestId('route-consumer').textContent).toBe(`route:home|prev:null`);
    });

    it('should update route context on navigation', async () => {
        const initialRoute: Partial<State> = { name: 'home', path: '/home', meta: { ...defaultTestMeta, id: 1 } };
        const router = createTestRouter(initialRoute);
        const { getByTestId } = render(
            <RouterProvider router={router}>
                <RouteContextConsumer />
            </RouterProvider>
        );

        expect(getByTestId('route-consumer').textContent).toBe('route:home|prev:null');

        await router.navigate('profile', { id: '123' }, {});

        expect(getByTestId('route-consumer').textContent).toBe('route:profile|prev:home');
    });
});

describe('shouldSubscribeToRouter', () => {
    let originalWindow: any;
    beforeAll(() => {
        originalWindow = globalThis.window;
    });
    afterAll(() => {
        globalThis.window = originalWindow;
    });
    it('возвращает true, если window определён', () => {
        expect(shouldSubscribeToRouter()).toBe(true);
    });
    it('возвращает false, если window не определён (SSR)', () => {
        // @ts-ignore // Deleting window to simulate SSR environment for testing purposes
        delete globalThis.window;
        expect(shouldSubscribeToRouter()).toBe(false);
    });
}); 