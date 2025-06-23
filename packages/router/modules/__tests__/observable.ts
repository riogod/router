import { createTestRouter } from './helpers'
import $$observable from '../lib/symbol-observable';


describe('core/observable', function() {
    let router

    beforeAll(() => (router = createTestRouter().start()))
    afterAll(() => router.stop())

    it('should accept a listener function', () => {
        const unsubscribe = router.subscribe(() => {})

        expect(typeof unsubscribe).toBe('function')
        expect(() => unsubscribe()).not.toThrow();
    })

    it('should accept a listener object', () => {
        const subscription = router.subscribe({
            next: () => {}
        })

        expect(typeof subscription.unsubscribe).toBe('function')
        expect(() => subscription.unsubscribe()).not.toThrow();
    })

    // it('should be compatible with rxjs', function() { // Removed
    //     const observable = from(router)
    //     expect(observable.subscribe).toBeDefined()
    // })

    // it('should be compatible with xstream', function() { // Removed
    //     const observable = xs.from(router)
    //     expect(observable.subscribe).toBeDefined()
    // })

    // it('should be compatible with most', function() { // Removed
    //     const observable = mostFrom(router)
    //     expect(observable.subscribe).toBeDefined()
    // })
})

describe('Generic event listeners (addEventListener, removeEventListener, invokeEventListeners)', () => {
    let router;

    beforeEach(() => {
        router = createTestRouter(); // Не запускаем его, если не нужно для этих тестов
    });

    it('should add and invoke an event listener', () => {
        const mockCb = jest.fn();
        const eventName = 'testEvent';
        
        router.addEventListener(eventName, mockCb);
        router.invokeEventListeners(eventName, 'arg1', 'arg2');
        
        expect(mockCb).toHaveBeenCalledTimes(1);
        expect(mockCb).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should invoke multiple event listeners for the same event', () => {
        const mockCb1 = jest.fn();
        const mockCb2 = jest.fn();
        const eventName = 'multiEvent';

        router.addEventListener(eventName, mockCb1);
        router.addEventListener(eventName, mockCb2);
        router.invokeEventListeners(eventName, 'data');

        expect(mockCb1).toHaveBeenCalledWith('data');
        expect(mockCb2).toHaveBeenCalledWith('data');
    });

    it('should remove an event listener', () => {
        const mockCb = jest.fn();
        const eventName = 'removeTest';

        router.addEventListener(eventName, mockCb);
        router.removeEventListener(eventName, mockCb);
        router.invokeEventListeners(eventName, 'data');

        expect(mockCb).not.toHaveBeenCalled();
    });

    it('returned unsubscribe function from addEventListener should remove the listener', () => {
        const mockCb = jest.fn();
        const eventName = 'unsubscribeTest';

        const unsubscribe = router.addEventListener(eventName, mockCb);
        unsubscribe();
        router.invokeEventListeners(eventName, 'data');
        
        expect(mockCb).not.toHaveBeenCalled();
    });

    it('invokeEventListeners should do nothing if no listeners for an event', () => {
        const eventName = 'emptyEvent';
        // Убедимся, что нет слушателей (хотя и так их нет по умолчанию)
        router.callbacks = {}; // Очистим на всякий случай, если тесты влияют друг на друга
        
        expect(() => router.invokeEventListeners(eventName, 'data')).not.toThrow();
    });
    
    it('removeEventListener should do nothing if listener not found', () => {
        const mockCb = jest.fn();
        const notAddedCb = jest.fn();
        const eventName = 'removeNonExistent';

        router.addEventListener(eventName, mockCb);
        
        expect(() => router.removeEventListener(eventName, notAddedCb)).not.toThrow();
        router.invokeEventListeners(eventName, 'data');
        expect(mockCb).toHaveBeenCalledTimes(1); // Убедимся, что оригинальный слушатель все еще там
    });

    it('removeEventListener should do nothing for an event with no listeners', () => {
        const eventName = 'removeForEmptyEvent';
        const cb = jest.fn();
        router.callbacks = {}; 

        expect(() => router.removeEventListener(eventName, cb)).not.toThrow();
    });
});

describe('Observable interface ($$observable)', () => {
    let router;

    beforeEach(() => {
        router = createTestRouter().start();
    });

    afterEach(() => {
        if (router && router.isStarted()) {
            router.stop();
        }
    });

    it('should expose a Symbol.observable property', () => {
        expect(typeof router[$$observable]).toBe('function');
    });

    it('observable().subscribe should throw TypeError if observer is not an object', () => {
        const obs = router[$$observable]();
        expect(() => obs.subscribe(null)).toThrow(TypeError);
        expect(() => obs.subscribe(() => {})).toThrow(TypeError);
        expect(() => obs.subscribe(123)).toThrow(TypeError);
    });

    it('observable().subscribe should accept a valid observer and return a subscription', () => {
        const obs = router[$$observable]();
        const mockObserver = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
        const subscription = obs.subscribe(mockObserver);
        
        expect(subscription).toBeDefined();
        expect(typeof subscription.unsubscribe).toBe('function');
        
        subscription.unsubscribe();
    });

    it('observable()[$$observable]() should return itself', () => {
        const obs = router[$$observable]();
        expect(obs[$$observable]()).toBe(obs);
    });

    it('should expose a legacy @@observable property', () => {
        expect(typeof router['@@observable']).toBe('function');
    });

    it('legacy @@observable().subscribe should throw TypeError if observer is not an object', () => {
        const obs = router['@@observable']();
        expect(() => obs.subscribe(null)).toThrow(TypeError);
    });
});
