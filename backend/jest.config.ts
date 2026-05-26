import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest';

const preset = createDefaultEsmPreset();

const sharedModuleNameMapper = {
  '^(\\.{1,2}/.*)\\.js$': '$1',
};

const config: JestConfigWithTsJest = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['**/tests/unit/**/*.test.ts'],
      setupFiles: ['<rootDir>/src/tests/setup.ts'],
      ...preset,
      moduleNameMapper: sharedModuleNameMapper,
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['**/tests/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/src/tests/integration/setup/jestSetup.ts'],
      globalSetup: '<rootDir>/src/tests/integration/setup/globalSetup.ts',
      ...preset,
      moduleNameMapper: sharedModuleNameMapper,
    },
  ],
};

export default config;
