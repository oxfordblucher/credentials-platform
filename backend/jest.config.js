import { createDefaultEsmPreset } from 'ts-jest';

const preset = createDefaultEsmPreset();

const projectPreset = {
  ...preset,
  transform: {
    '^.+\\.m?tsx?$': ['ts-jest', { useESM: true, diagnostics: { ignoreCodes: [151002] } }],
  }
};

const sharedModuleNameMapper = {
  '^(\\.{1,2}/.*)\\.js$': '$1',
};

const config = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['**/tests/unit/**/*.test.ts'],
      setupFiles: ['<rootDir>/src/tests/setup.ts'],
      ...projectPreset,
      moduleNameMapper: sharedModuleNameMapper,
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['**/tests/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/src/tests/integration/setup/jestSetup.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/tests/integration/setup/jestTeardown.ts'],
      globalSetup: '<rootDir>/src/tests/integration/setup/globalSetup.ts',
      ...projectPreset,
      moduleNameMapper: sharedModuleNameMapper,
    },
  ],
};

export default config;
