/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
	await page.goto('/carbonio');

	// eslint-disable-next-line testing-library/prefer-screen-queries
	await expect(page.getByText('Test to myself'), 'Email should be visible').toBeVisible();
});
