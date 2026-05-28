import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest';

const preset = createDefaultEsmPreset();

// Spread the ESM preset but disable ts-jest diagnostics so tests aren't blocked
// by missing @types/jest globals (describe, it, expect etc.). Runtime correctness
// is provided by @jest/globals which Jest injects automatically.
const projectPreset = {
  ...preset,
  transform: {
    '^.+\\.m?tsx?$': ['ts-jest', { useESM: true, diagnostics: false }],
  },
};

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
      ...projectPreset,
      moduleNameMapper: sharedModuleNameMapper,
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['**/tests/integration/**/*.test.ts'],
      setupFiles: ['<rootDir>/src/tests/integration/setup/jestSetup.ts'],
      globalSetup: '<rootDir>/src/tests/integration/setup/globalSetup.ts',
      ...projectPreset,
      moduleNameMapper: sharedModuleNameMapper,
    },
  ],
};

export default config;
