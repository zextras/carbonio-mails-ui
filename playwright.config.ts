/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	// Look for test files in the "tests" directory, relative to this configuration file
	testDir: './e2e_tests/',

	// Configure browser
	use: {
		// Base URL to use in actions like `await page.goto('/')`
		baseURL: 'https://localhost',
		ignoreHTTPSErrors: true,

		// Collect trace when retrying the failed test
		trace: 'on-first-retry',

		// Viewport size
		viewport: { width: 1280, height: 720 }
	},

	// Configure projects for major browsers
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'], ignoreHTTPSErrors: true }
		}
	]

	// Run your local dev server before starting the tests
	// webServer: {
	//   command: 'npm run start',
	//   url: 'http://localhost:3000',
	//   reuseExistingServer: !process.env.CI,
	// },
});
