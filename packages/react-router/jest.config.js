module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testMatch: ['<rootDir>/modules/__tests__/**/*.ts?(x)'],
}; 