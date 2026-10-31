import { defineConfig, devices } from '@playwright/test'

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH

export default defineConfig({
	testDir: './tests/e2e',
	outputDir: './test-results/e2e',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	workers: 1,
	retries: 0,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost:3200',
		trace: 'retain-on-failure',
		serviceWorkers: 'block',
		...(executablePath ? { launchOptions: { executablePath } } : {}),
	},
	webServer: {
		command: 'npm run start -- --port 3200',
		url: 'http://localhost:3200',
		reuseExistingServer: false,
		timeout: 120_000,
	},
	projects: [
		{
			name: 'desktop-chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'mobile-iphone',
			use: { ...devices['iPhone 14'], browserName: 'chromium' },
		},
	],
})
