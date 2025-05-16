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
    testEnvironment: 'node'
}
