import transitionPath, { shouldUpdateNode } from '../'

describe('router-transition-path', () => {
    it('should return a transition path with from null state', () => {
        expect(
            transitionPath({ name: 'a.b.c', params: {}, meta: {} }, null)
        ).toEqual({
            intersection: '',
            toActivate: ['a', 'a.b', 'a.b.c'],
            toDeactivate: []
        })
    })

    it('should return transition path between two states', () => {
        const meta = {
            params: {
                a: {},
                'a.b': {},
                'a.b.c': {},
                'a.b.c.d': {}
            }
        }

        expect(
            transitionPath(
                { name: 'a.b.c.d', params: {}, meta },
                { name: 'a.b.e.f', params: {}, meta }
            )
        ).toEqual({
            intersection: 'a.b',
            toActivate: ['a.b.c', 'a.b.c.d'],
            toDeactivate: ['a.b.e.f', 'a.b.e']
        })
    })

    it('should return transition path two states with same name but different params', () => {
        const meta = {
            params: {
                a: {},
                'a.b': { p1: 'url' },
                'a.b.c': { p2: 'url' },
                'a.b.c.d': { p3: 'url' }
            }
        }

        expect(
            transitionPath(
                { name: 'a.b.c.d', params: { p1: 0, p2: 2, p3: 3 }, meta },
                { name: 'a.b.c.d', params: { p1: 1, p2: 2, p3: 3 }, meta }
            ).intersection
        ).toBe('a')

        expect(
            transitionPath(
                { name: 'a.b.c.d', params: { p1: 1, p2: 0, p3: 3 }, meta },
                { name: 'a.b.c.d', params: { p1: 1, p2: 2, p3: 3 }, meta }
            ).intersection
        ).toBe('a.b')

        expect(
            transitionPath(
                { name: 'a.b.c.d', params: { p1: 1, p2: 2, p3: 0 }, meta },
                { name: 'a.b.c.d', params: { p1: 1, p2: 2, p3: 3 }, meta }
            ).intersection
        ).toBe('a.b.c')
    })

    describe('shouldUpdateNode', () => {
        const meta = {
            params: {
                a: {},
                'a.b': { p1: 'url' },
                'a.b.c': { p2: 'url' },
                'a.b.c.d': { p3: 'url' },
                'a.b.c.e': { p4: 'url' }
            }
        }

        it('should tell intersection node to update', () => {
            const shouldUpdate = shouldUpdateNode('a')(
                { name: 'a.b.c.d', params: { p1: 0, p2: 2, p3: 3 }, meta },
                { name: 'a.b.c.d', params: { p1: 1, p2: 2, p3: 3 }, meta }
            )

            expect(shouldUpdate).toBe(true)
        })

        it('should tell node above intersection to not update', () => {
            const shouldUpdate = shouldUpdateNode('')(
                { name: 'a.b.c.d', params: { p1: 0, p2: 2, p3: 3 }, meta },
                { name: 'a.b.c.d', params: { p1: 1, p2: 2, p3: 3 }, meta }
            )

            expect(shouldUpdate).toBe(false)
        })

        it('should tell node below intersection to update if not deactivated', () => {
            const fromState = {
                name: 'a.b.c.d',
                params: { p1: 0, p2: 2, p3: 3 },
                meta
            }
            const toState = {
                name: 'a.b.c.e',
                params: { p1: 1, p2: 2, p4: 3 },
                meta
            }

            expect(shouldUpdateNode('a.b')(toState, fromState)).toBe(true)
            expect(shouldUpdateNode('a.b.c')(toState, fromState)).toBe(true)
            expect(shouldUpdateNode('a.b.c.e')(toState, fromState)).toBe(true)
        })

        it('should tell node to update if it is in toActivate and not an exact match for deactivation path', () => {
            const fromState = { name: 'a.b.d', params: {}, meta }
            const toState = { name: 'a.b.c.e', params: {}, meta }
            // intersection: 'a.b' (предполагая, что параметры 'a' и 'a.b' не меняются или отсутствуют в meta для этого простого случая)
            // toActivate: ['a.b.c', 'a.b.c.e']
            // toDeactivate: ['a.b.d'] (после reverse)

            // На самом деле, если meta.params пуст, intersection будет ''
            // toActivate: ['a', 'a.b', 'a.b.c', 'a.b.c.e']
            // toDeactivate: ['a.b.d', 'a.b.c', 'a.b', 'a']

            // Поэтому используем meta из родительского describe для консистентности
            const testMeta = {
                params: {
                    a: {},
                    'a.b': {},
                    'a.b.c': {},
                    'a.b.c.d': {},
                    'a.b.c.e': {}
                }
            }
            const s1 = { name: 'a.b.d', params: {}, meta: testMeta }
            const s2 = { name: 'a.b.c.e', params: {}, meta: testMeta }
            // intersection: a.b
            // toActivate: [a.b.c, a.b.c.e]
            // toDeactivate: [a.b.d] -> reversed toDeactivate: [a.b.d]

            expect(shouldUpdateNode('a.b.c')(s2, s1)).toBe(true)
            expect(shouldUpdateNode('a.b.c.e')(s2, s1)).toBe(true)
        })

        it('should tell node to update if reload option is true', () => {
            const fromState = { name: 'a.b', params: {}, meta: {} };
            const toState = {
                name: 'a.c',
                params: {},
                meta: { options: { reload: true } }
            };

            // Неважно, какой nodeName, так как reload имеет приоритет
            expect(shouldUpdateNode('a')(toState, fromState)).toBe(true);
            expect(shouldUpdateNode('a.b')(toState, fromState)).toBe(true);
            expect(shouldUpdateNode('a.c')(toState, fromState)).toBe(true);
            expect(shouldUpdateNode('non.existent')(toState, fromState)).toBe(true);
        });
    })

    it('should take into action transition options', () => {
        expect(
            transitionPath(
                {
                    name: 'a.b.c.d',
                    params: {},
                    meta: { options: { reload: true } }
                },
                {
                    name: 'a.b.c',
                    params: {},
                    meta: {}
                }
            )
        ).toEqual({
            intersection: '',
            toActivate: ['a', 'a.b', 'a.b.c', 'a.b.c.d'],
            toDeactivate: ['a.b.c', 'a.b', 'a']
        })
    })

    it('should correctly calculate path when no meta.params in both states', () => {
        const fromState = { name: 'a.b', params: {}, meta: {} } // нет meta.params
        const toState = { name: 'a.c', params: {}, meta: {} }   // нет meta.params

        // Ожидаем, что i = 0, так как нет meta.params
        // intersection = ''
        // toActivate = ['a', 'a.c']
        // toDeactivate = ['a.b', 'a']
        expect(transitionPath(toState, fromState)).toEqual({
            intersection: '',
            toActivate: ['a', 'a.c'],
            toDeactivate: ['a.b', 'a']
        })
    })

    it('should use i=0 when no meta.params and reload is false', () => {
        const fromState = { name: 'a.b', params: {}, meta: {} }; // Нет meta.params
        const toState = {
            name: 'a.c',
            params: {},
            meta: { options: { reload: false } } // reload: false, нет meta.params
        };
        // Ожидаемый результат: i=0, intersection='', toActivate=['a', 'a.c'], toDeactivate=['a.b', 'a']
        expect(transitionPath(toState, fromState)).toEqual({
            intersection: '',
            toActivate: ['a', 'a.c'],
            toDeactivate: ['a.b', 'a']
        });

        const toStateWithoutOptions = {
            name: 'a.d',
            params: {},
            meta: {} // options не определены (тоже reload: false), нет meta.params
        };
        // Ожидаемый результат: i=0, intersection='', toActivate=['a', 'a.d'], toDeactivate=['a.b', 'a']
         expect(transitionPath(toStateWithoutOptions, fromState)).toEqual({
            intersection: '',
            toActivate: ['a', 'a.d'],
            toDeactivate: ['a.b', 'a']
        });
    });

    it('should correctly calculate path when toActivate is empty', () => {
        const meta = { // meta.params нужны, чтобы i не был 0 по предыдущему правилу
            params: {
                a: {},
                'a.b': {},
                'a.b.c': {}
            }
        }
        const fromState = { name: 'a.b.c', params: {}, meta }
        const toState = { name: 'a.b', params: {}, meta }

        // fromStateIds = ['a', 'a.b', 'a.b.c']
        // toStateIds = ['a', 'a.b']
        // pointOfDifference() вернет i = 2 (сравнивая 'a.b.c' с undefined)
        // intersection = 'a.b' (fromStateIds[2-1])
        // toActivate = toStateIds.slice(2) -> []
        // toDeactivate = fromStateIds.slice(2).reverse() -> ['a.b.c']
        expect(transitionPath(toState, fromState)).toEqual({
            intersection: 'a.b',
            toActivate: [],
            toDeactivate: ['a.b.c']
        })
    })
})
