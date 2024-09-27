/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { htmlEncode, trim } from '../get-quoted-text-util';

describe('Get Quoted Test Utils', () => {
	describe('trim', () => {
		it('should remove only edge spaces', () => {
			const text = ' My word ';
			expect(trim(text)).toBe('My word');
		});
	});

	describe('HTML encode', () => {
		it('should return same input if text', () => {
			const originalHTML = 'aaaaa';
			expect(htmlEncode(originalHTML, false)).toBe(originalHTML);
		});

		it('should return encoded input if there is html', () => {
			const originalHTML = '<div>aaaaa</div>';
			expect(htmlEncode(originalHTML, false)).toBe('&lt;div&gt;aaaaa&lt;/div&gt;');
		});

		it('should encode extra spaces when includeSpaces true', () => {
			const originalHTML = '<div>Should encode  extra  spaces</div>';
			expect(htmlEncode(originalHTML, true)).toBe(
				'&lt;div&gt;Should encode &nbsp;extra &nbsp;spaces&lt;/div&gt;'
			);
		});

		it('should not encode spaces when no extra spaces', () => {
			const originalHTML = '<div>Should not encode space if one space</div>';
			expect(htmlEncode(originalHTML, true)).toBe(
				'&lt;div&gt;Should not encode space if one space&lt;/div&gt;'
			);
		});
		it('should not encode extra spaces when includeSpaces false', () => {
			const originalHTML = '<div>Should not care about  extra  spaces</div>';
			expect(htmlEncode(originalHTML, false)).toBe(
				'&lt;div&gt;Should not care about  extra  spaces&lt;/div&gt;'
			);
		});
	});
});
