import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/api/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.dto.ts'],
    },
  },
  resolve: {
    alias: {
      '@api': resolve(__dirname, 'src/api'),
      '@config': resolve(__dirname, 'src/config'),
      '@validate': resolve(__dirname, 'src/validate'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@exceptions': resolve(__dirname, 'src/exceptions'),
      '@cache': resolve(__dirname, 'src/cache'),
    },
  },
});
