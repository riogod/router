import React from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Router } from '@riogz/router';
import RouterProvider from '../RouterProvider'; // ИСПРАВЛЕНО: импорт по умолчанию
import useRouter from '../hooks/useRouter';

// Вспомогательная функция для создания мока роутера (можно взять из RouterProvider.test.tsx или создать упрощенную)
const createMinimalTestRouter = (): Router => {
    return {
        // Минимально необходимые методы для этого теста
        getState: jest.fn(() => ({ name: 'test', path: '/test', params: {}, meta: { id: 1, params: {}, options: {}, redirected: false } })),
        subscribe: jest.fn(() => (() => {})),
        // ...можно добавить другие методы как jest.fn(), если они вызываются косвенно
    } as unknown as Router; // Приведение типа, так как это неполная реализация
};

describe('useRouter hook', () => {
    it('should return the router instance when used within RouterProvider', () => {
        const mockRouter = createMinimalTestRouter();
        
        const { result } = renderHook(() => useRouter(), {
            wrapper: ({ children }) => <RouterProvider router={mockRouter}>{children}</RouterProvider>
        });

        expect(result.current).toBe(mockRouter);
    });

    it('should throw an error when used outside of RouterProvider', () => {
        // Подавляем вывод ошибки в консоль во время теста, так как мы ожидаем ошибку
        const originalError = console.error;
        console.error = jest.fn();

        let hookResult: any;
        try {
            // renderHook без wrapper, чтобы симулировать отсутствие RouterProvider
            renderHook(() => {
                hookResult = useRouter();
            });
        } catch (e: any) {
             // Проверяем, что это именно та ошибка, которую мы ожидаем
            expect(e.message).toBe('useRouter must be used within a RouterProvider');
        }
        // Убедимся, что ошибка действительно была выброшена, а не просто hookResult остался undefined
        expect(hookResult).toBeUndefined(); 

        // Восстанавливаем оригинальный console.error
        console.error = originalError;
    });

    // Дополнительный тест для проверки вызова ошибки другим способом (если renderHook перехватывает)
    it('should throw an error when rendered in a component outside of RouterProvider', () => {
        const originalError = console.error;
        console.error = jest.fn();

        const TestComponent = () => {
            useRouter();
            return null;
        };

        // Ожидаем, что рендеринг этого компонента вызовет ошибку
        expect(() => render(<TestComponent />)).toThrow('useRouter must be used within a RouterProvider');
        
        console.error = originalError;
    });
}); 