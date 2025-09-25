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

		// Add navigation timeout
		navigationTimeout: 30000,
		// Useful for debugging
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		// Viewport size
		viewport: { width: 1280, height: 720 }
	},

	retries: process.env.CI ? 2 : 0,
	// Configure projects for major browsers
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'], ignoreHTTPSErrors: true }
		}
	],
	outputDir: './e2e_tests/output/',

	expect: {
		// Maximum time expect() should wait for the condition to be met.
		timeout: 5000
	}
});
