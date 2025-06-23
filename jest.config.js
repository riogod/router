module.exports = {
    // projects: ['<rootDir>/packages/*'], // Убираем projects
    testMatch: ['<rootDir>/packages/*/modules/__tests__/**/*.ts?(x)'], // Явно указываем, где искать тесты
    testPathIgnorePatterns: [
        '<rootDir>/packages/router/modules/__tests__/helpers/index.ts',
        '<rootDir>/packages/router/modules/__tests__/helpers/testRouters.ts'
    ],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.base.json'
            },
        ],
    },
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/packages/react-router/jest-setup.ts'],
    moduleNameMapper: {
        '^@riogz/router-transition-path$': '<rootDir>/packages/router-transition-path/modules/index.ts',
        '^@riogz/router$': '<rootDir>/packages/router/modules/index.ts',
        '^@riogz/router-plugin-browser$': '<rootDir>/packages/router-plugin-browser/modules/index.ts',
        '^@riogz/router-helpers$': '<rootDir>/packages/router-helpers/modules/index.ts',
        '^@riogz/router-plugin-logger$': '<rootDir>/packages/router-plugin-logger/modules/index.ts',
        '^@riogz/router-plugin-persistent-params$': '<rootDir>/packages/router-plugin-persistent-params/modules/index.ts',
        '^@riogz/react-router$': '<rootDir>/packages/react-router/modules/index.ts',
        // При маппинге зависимостей из node_modules, важно мапить на их commonjs выход, если они не ESM
        // или если ts-jest не настроен их транспилировать.
        // '^route-node$': '<rootDir>/node_modules/route-node/commonjs/route-node.js', // route-node используется внутри router5
        // symbol-observable теперь реализован локально в packages/router/modules/lib/symbol-observable
        // Оставим пока маппинг только для пакетов из этого монорепозитория
    },
    transformIgnorePatterns: [
      '/node_modules/(?!@riogz/router|@riogz/router-transition-path|@riogz/router-plugin-browser|@riogz/router-helpers|@riogz/router-plugin-logger|@riogz/router-plugin-persistent-params|@riogz/react-router|route-node).+\\.js$'
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/package.json' // Игнорируем корневой package.json для Haste map
    ]
};
