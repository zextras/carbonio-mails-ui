/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { parseHtmlForImport } from '../parse-html-for-import';

describe('parseHtmlForImport', () => {
	it('inlines the <style> rules on the elements', () => {
		const doc = parseHtmlForImport(
			'<html><head><style>p { color: red; }</style></head><body><p>Hi</p></body></html>'
		);

		expect(doc.body.querySelector('p')?.style.color).toBe('red');
	});

	it('does not keep the <style> tags', () => {
		const doc = parseHtmlForImport(
			'<html><head><style>p { color: red; }</style></head><body><p>Hi</p></body></html>'
		);

		expect(doc.querySelector('style')).toBeNull();
	});

	it('keeps the content of html without styles', () => {
		const doc = parseHtmlForImport('<p style="margin: 0">Hi</p>');

		expect(doc.body.querySelector('p')?.textContent).toBe('Hi');
		expect(doc.body.querySelector('p')?.style.margin).toBe('0px');
	});
});
