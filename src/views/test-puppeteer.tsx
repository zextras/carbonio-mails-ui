/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import puppeteer from 'puppeteer';

describe('Google', () => {
	it('should be titled "Google"', async () => {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto('https://zextras.com/it');
		await expect(page.title()).resolves.toMatch('ciao ciao');
	});
});
