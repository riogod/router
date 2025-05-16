import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { Router, State, Listener, SubscribeFn, NavigationOptions, StateMeta } from '@riogz/router';
import RouterProvider from '../RouterProvider';
import useRouteNode from '../hooks/useRouteNode';
import { RouteContext } from '../types';
import { routerContext } from '../context';

// Мокируем shouldUpdateNode
// Мы можем захотеть изменять его поведение в разных тестах
const mockShouldUpdateNode = jest.fn();
jest.mock('@riogz/router-transition-path', () => ({
    ...jest.requireActual('@riogz/router-transition-path'),
    shouldUpdateNode: (nodeName) => (...args) => mockShouldUpdateNode(nodeName, ...args),
}));

const createTestRouterForRouteNode = (initialState?: Partial<State>): Router => {
    let listeners: Array<jest.Mock | Listener | SubscribeFn> = [];
    let currentState: State = {
        name: 'initial',
        path: '/initial',
        params: {},
        meta: { id: 0, params: {}, options: {}, redirected: false } as StateMeta,
        ...initialState,
    } as State;
    let previousState: State | null = null;

    const routerInstance = {
        getState: jest.fn(() => currentState),
        subscribe: jest.fn((listener: jest.Mock | Listener | SubscribeFn) => {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(l => l !== listener);
            };
        }),
        navigate: jest.fn(async (name: string, params: Record<string, any> = {}, opts: NavigationOptions = {}) => {
            previousState = { ...currentState };
            const newPath = `/${name}${Object.keys(params).length ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''}`;
            currentState = {
                name,
                params,
                path: newPath,
                meta: { id: (previousState?.meta?.id || 0) + 1, params: {}, options: opts, redirected: false } as StateMeta,
            } as State;
            const currentListeners = [...listeners];
            act(() => {
                currentListeners.forEach(l => (l as jest.Mock)({ route: { ...currentState }, previousRoute: previousState ? { ...previousState } : null }));
            });
            return currentState;
        }),
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
    };
    return routerInstance as unknown as Router;
};

const defaultTestMeta: Omit<StateMeta, 'path'> = { id: 1, params: {}, options: {}, redirected: false };

describe('useRouteNode hook', () => {
    beforeEach(() => {
        // Сбрасываем мок перед каждым тестом
        mockShouldUpdateNode.mockReset();
    });

    it('should return initial state from router and null previousRoute', () => {
        const initialRouteData: Partial<State> = { name: 'home', path: '/home', meta: { ...defaultTestMeta, id: 1 } };
        const mockRouter = createTestRouterForRouteNode(initialRouteData);
        mockShouldUpdateNode.mockReturnValue(true); // Предположим, узел всегда активен для этого теста

        const { result } = renderHook(() => useRouteNode('home'), {
            wrapper: ({ children }) => <RouterProvider router={mockRouter}>{children}</RouterProvider>
        });

        expect(result.current.route?.name).toBe('home');
        expect(result.current.previousRoute).toBeNull();
        expect(result.current.router).toBe(mockRouter);
    });

    it('should throw error if used outside RouterProvider', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => useRouteNode('anyNode'));
        expect(result.error).toEqual(Error('useRouteNode must be used within a RouterProvider'));
        spy.mockRestore();
    });

    it('should update state if shouldUpdateNode returns true', async () => {
        const initialRouteData: Partial<State> = { name: 'home', path: '/home', meta: { ...defaultTestMeta, id: 1 } };
        const mockRouter = createTestRouterForRouteNode(initialRouteData);
        mockShouldUpdateNode.mockReturnValue(true); // Узел должен обновиться

        const { result } = renderHook(() => useRouteNode('profile'), { // Тестируем для узла 'profile'
            wrapper: ({ children }) => <RouterProvider router={mockRouter}>{children}</RouterProvider>
        });

        // Начальное состояние (может быть от initial роутера, если profile еще не активен)
        expect(result.current.route?.name).toBe('home'); 

        await act(async () => {
            // @ts-ignore
            mockRouter.navigate('profile.user', { id: '1' });
        });
        
        // Проверяем, что shouldUpdateNode был вызван с правильными аргументами
        // Первый вызов при инициализации, второй при navigate
        expect(mockShouldUpdateNode).toHaveBeenCalledWith('profile', result.current.route, result.current.previousRoute);

        expect(result.current.route?.name).toBe('profile.user');
        expect(result.current.previousRoute?.name).toBe('home');
    });

    it('should NOT update state if shouldUpdateNode returns false', async () => {
        const initialRouteData: Partial<State> = { name: 'home', path: '/home', meta: { ...defaultTestMeta, id: 1 } };
        const mockRouter = createTestRouterForRouteNode(initialRouteData);
        // Сначала узел 'settings' не должен обновляться
        mockShouldUpdateNode.mockImplementation((nodeName, route) => {
            // Допустим, shouldUpdateNode вернет false, если nodeName не соответствует начальной части route.name
            return route && route.name.startsWith(nodeName);
        });

        const { result } = renderHook(() => useRouteNode('settings'), { // Тестируем для узла 'settings'
            wrapper: ({ children }) => <RouterProvider router={mockRouter}>{children}</RouterProvider>
        });

        // Начальное состояние (от initial роутера)
        const initialRenderRouteName = result.current.route?.name;
        expect(initialRenderRouteName).toBe('home');

        // Перенастраиваем мок для второго вызова (после navigate)
        // Теперь shouldUpdateNode должен вернуть false для 'settings' при переходе на 'profile.user'
        mockShouldUpdateNode.mockImplementation((nodeName, route) => {
             if (nodeName === 'settings' && route?.name === 'profile.user') return false;
             return route && route.name.startsWith(nodeName); // Для других случаев
        });

        await act(async () => {
            // @ts-ignore
            mockRouter.navigate('profile.user', { id: '1' });
        });
        
        expect(mockShouldUpdateNode).toHaveBeenCalled();
        // Состояние не должно было измениться, так как shouldUpdateNode вернул false для 'settings'
        expect(result.current.route?.name).toBe(initialRenderRouteName); // Остается 'home'
        // previousRoute также не должен был обновиться для этого хука
        expect(result.current.previousRoute).toBeNull(); 
    });
});

describe('useRouteNode (alternative location)', () => {
    beforeEach(() => {
        mockShouldUpdateNode.mockClear();
    });

    it('should throw error if used outside RouterProvider', () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { result } = renderHook(() => useRouteNode('testNode'));
        expect(result.error).toEqual(Error('useRouteNode must be used within a RouterProvider'));
        spy.mockRestore();
    });

    it('should return initial state from router (alternative location)', () => {
        const router = createTestRouterForRouteNode();
        const initialRoute = { name: 'initial', params: {}, meta: { params: {} }, path: '/initial' } as State;
        (router.getState as jest.Mock).mockReturnValue(initialRoute);

        const { result } = renderHook(() => useRouteNode('testNode'), {
            wrapper: ({ children }) => <routerContext.Provider value={router}>{children}</routerContext.Provider>
        });

        expect(result.current.router).toBe(router);
        expect(result.current.route).toEqual(initialRoute);
        expect(result.current.previousRoute).toBeNull();
    });

    it('should update state if shouldUpdateNode returns true (alternative location)', () => {
        const router = createTestRouterForRouteNode();
        const initialRoute = { name: 'initial', params: {}, meta: { params: {} }, path: '/initial' } as State;
        const nextRoute = { name: 'next', params: {}, meta: { params: {} }, path: '/next' } as State;
        (router.getState as jest.Mock).mockReturnValue(initialRoute);

        const innerMock = jest.fn().mockReturnValue(true);
        // mockShouldUpdateNode - это мок для этого файла, убедимся, что он возвращает каррированную функцию
        mockShouldUpdateNode.mockImplementation((nodeName) => {
            // Для этого теста, мы просто заставим его вернуть true, когда он будет вызван с nodeName 'testNode'
            // и эта функция вернет innerMock, который уже вернет true.
            if (nodeName === 'testNode') {
                return innerMock; 
            }
            // Для других nodeName, возвращаем функцию, которая вернет false
            return () => false; 
        });
        
        const { result } = renderHook(() => useRouteNode('testNode'), {
            wrapper: ({ children }) => <routerContext.Provider value={router}>{children}</routerContext.Provider>
        });
        
        expect((router.subscribe as jest.Mock).mock.calls.length).toBeGreaterThan(0);
        const subscribeCallback = (router.subscribe as jest.Mock).mock.calls[0][0] as jest.Mock;

        act(() => {
            subscribeCallback({ route: nextRoute, previousRoute: initialRoute });
        });
        
        expect(mockShouldUpdateNode).toHaveBeenCalledWith('testNode', nextRoute, initialRoute); 
        expect(result.current.route).toBe(nextRoute);
        expect(result.current.previousRoute).toBe(initialRoute);
    });

    // Здесь могут быть другие тесты для этого describe блока

}); // Закрывающая скобка для describe('useRouteNode (alternative location)') 