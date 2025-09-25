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
	await page.locator('[data-testid="icon: DriveOutline"]').click();
	await expect(page).toHaveURL(/.*carbonio\/files\/root\/LOCAL_ROOT/);
	await expect(page.getByText('file_user_test.png')).toBeAttached();

	await page.locator('[data-testid="icon: MailModOutline"]').click();
	await expect(page).toHaveURL(/.*carbonio\/mails/);
	await expect(page.getByText('file_user_test.png')).not.toBeAttached();
	// Scroll the file into view and then click
	// const fileElement = page.locator('text=file_user_test.png');
	// await expect(fileElement).toBeVisible();
	// await fileElement.click();
	//
	// await expect(page).toHaveURL(
	// /.*carbonio\/files\/root\/LOCAL_ROOT\?node=f8a1e462-1bb2-4f66-b1ee-4138721027d6/
	// );
});
