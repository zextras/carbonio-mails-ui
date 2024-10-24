/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	getOriginalHtmlContent,
	getOriginalTextContent,
	getQuotedTextFromOriginalContent,
	htmlEncode,
	trim
} from '../get-quoted-text-util';

describe('Get Quoted Test Utils', () => {
	describe('trim', () => {
		it.each([
			[' My word ', 'My word'],
			['', ''],
			['     ', ''],
			[null, '']
		])('should remove only edge spaces', (input, expected) => {
			expect(trim(input)).toBe(expected);
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
	describe('Get original text content', () => {
		it('should handle text', () => {
			const originalText = 'This is a test';
			expect(getOriginalTextContent(originalText)).toBe(originalText);
		});
	});

	describe('Get original html content', () => {
		it('should handle html with div', () => {
			const originalHTML = '<div>Test</div>';
			expect(getOriginalHtmlContent(originalHTML)).toBe('<div>Test</div>');
		});

		it.each([
			'Forwarded Message',
			'Weitergeleitete Nachricht',
			'Original Message',
			'Originalnachricht'
		])('should remove start/stop quote blocks', (blockName) => {
			const originalHTML = `<div>Test div</div> --- ${blockName} --- <p>Test</p> ---  ${blockName}  ---`;
			expect(getOriginalHtmlContent(originalHTML)).toBe('<div>Test div</div>');
		});

		it.each([
			'Forwarded Message',
			'Weitergeleitete Nachricht',
			'Original Message',
			'Originalnachricht'
		])('should not remove Original Message if first in text', (blockName) => {
			const originalHTML = `--- ${blockName} --- <p>Test</p> ---  ${blockName}  ---`;
			expect(getOriginalHtmlContent(originalHTML)).toBe(originalHTML);
		});

		it('should handle html with hr element', () => {
			const originalHTML = '<div><hr/>Test</div>';
			expect(getOriginalHtmlContent(originalHTML)).toBe('<div><hr/>Test</div>');
		});
	});

	describe('Get quoted text from original content', () => {
		it('should return empty if body equal to original content', () => {
			const originalHTML = '<div>Test</div>';
			expect(getQuotedTextFromOriginalContent(originalHTML, originalHTML)).toBe('');
		});

		it('weird test. it is not clear what this function does but behaves like that', () => {
			const originalContent = '<div>Original content</div>';
			const body = '<div>Original content Something else</blockquote></div>';
			expect(getQuotedTextFromOriginalContent(body, originalContent)).toBe(
				'<div class="quoted_text">hing else</div>'
			);
		});

		it('should return empty string if body length is no more than original content + 5 characters', () => {
			const originalContent = '<div>Original content</div>';
			const body = originalContent + 'a'.repeat(5);
			expect(getQuotedTextFromOriginalContent(body, originalContent)).toBe('');
		});

		it.each(['a'.repeat(6), '<div class="aaa"></div>'])(
			'should return extra content in body if longer than 5 characters',
			(extraContent) => {
				const originalContent = '<div>Original content</div>';
				const body = originalContent + extraContent;
				expect(getQuotedTextFromOriginalContent(body, originalContent)).toBe(
					`<div class="quoted_text">${extraContent}</div>`
				);
			}
		);

		it.each(['OutlookMessageHeader', 'gmail_quote'])(
			'should return empty quoted div if it contains a div has',
			(className: string) => {
				const originalContent = '<div>Original content</div>';
				const extraContent = `<div class="${className}"></div>`;
				const body = originalContent + extraContent;
				expect(getQuotedTextFromOriginalContent(body, originalContent)).toBe(
					`<div class="quoted_text"></div>`
				);
			}
		);

		it('should return empty quoted div if it contains a div with class OutlookMessageHeader', () => {
			const originalContent = '<div>Original content</div>';
			const extraContent = '<div class="OutlookMessageHeader"></div>';
			const body = originalContent + extraContent;
			expect(getQuotedTextFromOriginalContent(body, originalContent)).toBe(
				`<div class="quoted_text"></div>`
			);
		});
	});
});
