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

	await page.getByPlaceholder('Username').fill('zextras');
	await page.getByPlaceholder('Password').fill('assext');

	await page.click('[data-testid="login"]');
	await expect(page).toHaveURL(/.*carbonio\/mails/);

	await page.locator('[data-testid="AvatarContainer"]').nth(1).click();
	await page
		.locator('[data-testid="AvatarContainer"]')
		.nth(5)
		.click({ modifiers: ['Shift'] });

	const checkmarkCount = await page.locator('[data-name="checkmark"]').count();
	expect(checkmarkCount).toBe(5);
});
