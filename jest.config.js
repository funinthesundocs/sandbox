/** @type {import('jest').Config} */
const sharedTransform = {
  '^.+\\.tsx?$': [
    'ts-jest',
    {
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowJs: true,
        skipLibCheck: true,
        jsx: 'react-jsx',
      },
    },
  ],
};

const sharedModuleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
};

const config = {
  projects: [
    {
      // API route tests and worker tests: node environment (Web Fetch API available in Node 18+)
      displayName: 'node',
      testEnvironment: 'jest-environment-node',
      testMatch: [
        '<rootDir>/src/app/api/**/__tests__/**/*.test.ts',
        '<rootDir>/src/worker/**/__tests__/**/*.test.ts',
      ],
      moduleNameMapper: sharedModuleNameMapper,
      transform: sharedTransform,
    },
    {
      // Library tests: node environment (no browser globals needed)
      displayName: 'lib',
      testEnvironment: 'jest-environment-node',
      testMatch: [
        '<rootDir>/src/lib/**/__tests__/**/*.test.ts',
      ],
      moduleNameMapper: sharedModuleNameMapper,
      transform: sharedTransform,
    },
    {
      // Component tests: jsdom environment (needs DOM APIs)
      displayName: 'jsdom',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: [
        '<rootDir>/src/components/**/__tests__/**/*.test.tsx',
      ],
      moduleNameMapper: sharedModuleNameMapper,
      transform: sharedTransform,
    },
  ],
};

module.exports = config;
