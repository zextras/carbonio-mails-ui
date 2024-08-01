/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import puppeteer, { Page } from 'puppeteer';

describe('Sample Test', () => {
	let page: Page;
	beforeAll(async () => {
		const browser = await puppeteer.launch();
		page = await browser.newPage();
		await page.goto('https://google.com');
	});

	afterAll(async () => {
		await page.close();
	});

	it('should load without error', async () => {
		const text = await page.evaluate(() => document.body.textContent);
		expect(text).toContain('google');
	});
});
