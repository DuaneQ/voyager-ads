import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // HTML report written to coverage/ — open coverage/index.html to browse
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',          // entry point — no logic to test
        'src/App.tsx',           // routing shell — only lazy imports, no testable logic
        'src/store/index.ts',    // barrel re-export — no executable logic
        'src/services/admin/adminServiceInstance.ts',         // singleton instance — no testable logic
        'src/repositories/campaignRepositoryInstance.ts',     // singleton instance — no testable logic
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
})
