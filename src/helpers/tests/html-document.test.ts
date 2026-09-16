/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { wrapInHtmlDocument } from '../html-document';

describe('html-document', () => {
	describe('wrapInHtmlDocument', () => {
		it('should wrap an HTML fragment into a document with html and body tags', () => {
			const result = wrapInHtmlDocument('<p style="color: red;">Hello</p>');

			expect(result).toBe('<html><body><p style="color: red;">Hello</p></body></html>');
		});

		it('should wrap an empty content into an empty document', () => {
			expect(wrapInHtmlDocument('')).toBe('<html><body></body></html>');
		});

		it('should treat undefined content as empty', () => {
			expect(wrapInHtmlDocument(undefined)).toBe('<html><body></body></html>');
		});

		it('should not wrap content that already contains a body element', () => {
			const html = '<html><head></head><body><p>Hello</p></body></html>';

			expect(wrapInHtmlDocument(html)).toBe(html);
		});

		it('should not wrap content that already contains a body element with attributes', () => {
			const html = '<BODY style="margin: 0"><p>Hello</p></BODY>';

			expect(wrapInHtmlDocument(html)).toBe(html);
		});

		it('should wrap content whose text mentions a body tag without being one', () => {
			const content = '<p>the &lt;body&gt; tag</p>';

			expect(wrapInHtmlDocument(content)).toBe(`<html><body>${content}</body></html>`);
		});

		it('should always produce a closing body tag for the MTA disclaimer to anchor on', () => {
			const result = wrapInHtmlDocument('<div class="signature-div">Signature</div>');

			expect(result).toMatch(/<\/body>\s*<\/html>$/);
		});
	});
});
