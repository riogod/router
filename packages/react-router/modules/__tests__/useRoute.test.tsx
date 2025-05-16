/// <reference types="jest" />
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { render } from '@testing-library/react'; // Для теста с компонентом
import '@testing-library/jest-dom'; // Добавляем этот импорт
import { Router, State, NavigationOptions, StateMeta } from '@riogz/router';
import RouterProvider from '../RouterProvider';
import useRoute from '../hooks/useRoute';
import { RouteContext } from '../types';

// Используем и адаптируем мок роутера из RouterProvider.test.tsx
// Упрощенный тип для слушателя в моке
type MockRouterListener = (state: { route: State; previousRoute: State | null }) => void;

const createTestRouterForUseRoute = (initialState?: Partial<State>): Router => {
    let listeners: Array<MockRouterListener> = [];
    let currentState: State = {
        name: 'initial',
        path: '/initial',
        params: {},
        meta: { id: 0, params: {}, options: {}, redirected: false },
        ...initialState,
    } as State;
    let previousState: State | null = null;

    const routerInstance: Partial<Router> = {
        getState: () => currentState,
        subscribe: (listener: any) => { // Упрощаем тип listener для мока
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(l => l !== listener);
            };
        },
        navigate: ((name: string, params: Record<string, any> = {}, opts: NavigationOptions = {}) => {
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
        }) as any, // ИЗМЕНЕНО: приведение метода navigate к any
        isActive: jest.fn(() => false),
        buildPath: jest.fn((name, params) => `/${name}` + (params ? `?${new URLSearchParams(params as Record<string, string>).toString()}`: '')),
        // ... (остальные моки методов Router по аналогии с RouterProvider.test.tsx)
    };
    return routerInstance as unknown as Router; // Оставим unknown здесь для общего объекта
};

const defaultTestMeta: Omit<StateMeta, 'path'> = { id: 1, params: {}, options: {}, redirected: false };

describe('useRoute hook', () => {
    it('should return the route context when used within RouterProvider', () => {
        const initialRouteData: Partial<State> = { name: 'home', path: '/home', meta: { ...defaultTestMeta, id: 1 } };
        const mockRouter = createTestRouterForUseRoute(initialRouteData);

        const { result } = renderHook(() => useRoute(), {
            wrapper: ({ children }) => <RouterProvider router={mockRouter}>{children}</RouterProvider>
        });

        expect(result.current).toBeDefined();
        expect(result.current.router).toBe(mockRouter);
        expect(result.current.route?.name).toBe('home');
        expect(result.current.previousRoute).toBeNull();
    });

    it('should update route context on navigation when used within RouterProvider', async () => {
        const initialRouteData: Partial<State> = { name: 'home', path: '/home', meta: { ...defaultTestMeta, id: 1 } };
        const mockRouter = createTestRouterForUseRoute(initialRouteData);

        const { result } = renderHook(() => useRoute(), {
            wrapper: ({ children }) => <RouterProvider router={mockRouter}>{children}</RouterProvider>
        });

        await act(async () => {
            mockRouter.navigate('profile', { id: '1' }, {});
            // waitForNextUpdate не всегда нужен если RouterProvider обновляет контекст синхронно через act
        });
        
        expect(result.current.route?.name).toBe('profile');
        expect(result.current.previousRoute?.name).toBe('home');
    });

    it('should throw an error when used outside of RouterProvider', () => {
        const originalError = console.error;
        console.error = jest.fn(); // Подавляем ошибку в консоли

        let hookResult: RouteContext | undefined;
        try {
            renderHook(() => {
                hookResult = useRoute(); // Это должно вызвать ошибку
            });
        } catch (e: any) {
            expect(e.message).toBe('useRoute must be used within a RouterProvider or a component that provides routeContext');
        }
        expect(hookResult).toBeUndefined(); // Убедимся, что хук не вернул значение
        
        console.error = originalError; // Восстанавливаем
    });

    it('should throw an error when rendered in a component outside of RouterProvider', () => {
        const originalError = console.error;
        console.error = jest.fn();

        const TestComponent = () => {
            useRoute();
            return null;
        };

        expect(() => render(<TestComponent />))
            .toThrow('useRoute must be used within a RouterProvider or a component that provides routeContext');
        
        console.error = originalError;
    });
}); 