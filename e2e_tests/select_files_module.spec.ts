/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test, expect } from '@playwright/test';

test('log in', async ({ page }) => {
	await page.goto('/static/login/');
	await expect(page).toHaveURL(/.*static\/login/);

	// Expect a title "to contain" a substring.
	await expect(page.getByTestId('logo')).toBeVisible();

	await page.getByPlaceholder('Username').fill('test');
	await page.getByPlaceholder('Password').fill('password');

	await page.click('[data-testid="login"]');
	await expect(page).toHaveURL(/.*carbonio\/mails/);
	// end of login

	// await page.click('[data-testid="icon: DriveOutline"]');

	const n = 100_000;
	Array.from({ length: n }, (_, i) => i).forEach(async (i) => {
		try {
			console.log(`Iteration ${i + 1}/${n}`);

			await page.locator('[data-testid="icon: DriveOutline"]').click();
			await expect(page).toHaveURL(/.*carbonio\/files\/root\/LOCAL_ROOT/);
			await expect(page.getByText('file_user_test.png')).toBeAttached();
			await page.locator('[data-testid="icon: MailModOutline"]').click();
			await expect(page).toHaveURL(/.*carbonio\/mails/);
			await expect(page.getByText('file_user_test.png')).not.toBeAttached();
		} catch (error) {
			console.error(`Error on iteration ${i + 1}:`, error);

			// Take screenshot on failure
			const screenshotPath = `./screenshots/failure-iteration-${i + 1}-${Date.now()}.png`;
			await page.screenshot({
				path: screenshotPath,
				fullPage: true
			});
			console.log(`Screenshot saved: ${screenshotPath}`);

			// Log page state for debugging
			const currentUrl = page.url();
			console.log(`Current URL: ${currentUrl}`);

			// Re-throw to fail the test
			throw error;
		}
	});
});
