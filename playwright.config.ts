import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for ChefKix visual testing.
 *
 * Usage:
 *   npx playwright test                    # Run all visual tests
 *   npx playwright test visual-runner      # Run only the visual runner
 *   UPDATE_SNAPSHOTS=1 npx playwright test # Update baselines
 */
export default defineConfig({
	testDir: './tests/visual',
	outputDir: './tests/visual/test-results',
	preserveOutput: 'failures-only',
	timeout: 60_000,
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01,
			animations: 'disabled',
		},
	},
	use: {
		baseURL: 'http://localhost:3000',
		trace: 'on-first-retry',
		screenshot: 'off',
		video: 'off',
		// Consistent viewport for deterministic screenshots
		viewport: { width: 1440, height: 900 },
		colorScheme: 'light',
		locale: 'en-US',
		timezoneId: 'America/New_York',
	},
	webServer: {
		command: 'npm run dev',
		port: 3000,
		reuseExistingServer: true,
		timeout: 120_000,
	},
	projects: [
		{
			name: 'desktop-chrome',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'mobile-iphone',
			use: {
				...devices['iPhone 14'],
				// Override to use Chromium (installed) instead of WebKit
				browserName: 'chromium',
			},
		},
	],
	// Only run one worker — state forcing needs isolation
	workers: 1,
	retries: 0,
	reporter: [
		['list'],
		['html', { outputFolder: './tests/visual/report', open: 'never' }],
	],
})
