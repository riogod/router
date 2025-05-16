module.exports = {
    transform: {
        '^.+\.tsx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.test.json'
            }
        ]
    },
    moduleFileExtensions: ['ts', 'js'],
    testPathIgnorePatterns: ['<rootDir>/modules/__tests__/helpers/.*\\.ts$'],
    testEnvironment: 'node'
}
