import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    alias: {
      '@taskboard/shared-types': resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@taskboard/config': resolve(__dirname, '../../packages/config/src/index.ts'),
    },
  },
});
