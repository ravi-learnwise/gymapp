/** @type {import('jest').Config} */
const projectDefaults = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};

module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: './coverage',
  projects: [
    {
      ...projectDefaults,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
    },
    {
      ...projectDefaults,
      displayName: 'api',
      testMatch: ['<rootDir>/test/api/**/*.e2e-spec.ts'],
    },
  ],
};
