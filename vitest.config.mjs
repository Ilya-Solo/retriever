/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    // Specify the test environment. 'node' is suitable for backend projects.
    environment: 'node',

    // Directory where tests are located
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],

    // Watch mode settings
    watch: false,

    // Global setup files
    globals: true,

    // Setup files before tests
    // setupFiles: './tests/setup.ts',
  },
});
