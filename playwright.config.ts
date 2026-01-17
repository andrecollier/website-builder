import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Phase 5 Visual Comparison Testing
 *
 * Run with: npx playwright test
 * Run specific test: npx playwright test tests/phase5/comparison.spec.ts
 * View report: npx playwright show-report
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially for comparison tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for consistent state
  reporter: [
    ['html', { outputFolder: 'test-results/report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
  },

  // Output folder for screenshots and artifacts
  outputDir: 'test-results/artifacts',

  projects: [
    {
      name: 'phase5-comparison',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /phase5\/.*.spec.ts/,
    },
  ],

  // Don't start the server - assume it's already running
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3002',
  //   reuseExistingServer: true,
  // },
});
