/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { linkifyToHtml } from '../text-linkify';

describe('linkifyToHtml', () => {
	const email = 'foo@bar.com';

	it('converts URLs to anchor tags', () => {
		const input = 'Visit https://example.com for info.';
		const output = linkifyToHtml(input);
		expect(output).toBe(
			'Visit <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a> for info.'
		);
	});

	it('converts mailto links with query to anchor tags', () => {
		const input = 'Contact mailto:foo@bar.com?subject=Hello';
		const output = linkifyToHtml(input);
		expect(output).toBe(
			'Contact <a href="mailto:foo@bar.com?subject=Hello" target="_blank" rel="noopener noreferrer">mailto:foo@bar.com?subject=Hello</a>'
		);
	});

	it('converts plain email addresses to mailto anchor tags', () => {
		const input = 'Email me at foo@bar.com';
		const output = linkifyToHtml(input);
		expect(output).toBe(
			'Email me at <a href="mailto:foo@bar.com" target="_blank" rel="noopener noreferrer">foo@bar.com</a>'
		);
	});

	it('converts angle-bracketed emails to mailto anchor tags with literal brackets', () => {
		const input = 'Contact <foo@bar.com>';
		const output = linkifyToHtml(input);
		expect(output).toBe(
			'Contact &lt;<a href="mailto:foo@bar.com" target="_blank" rel="noopener noreferrer">foo@bar.com</a>&gt;'
		);
	});

	it('preserves non-email text', () => {
		const input = 'Hello world!';
		const output = linkifyToHtml(input);
		expect(output).toBe('Hello world!');
	});

	it('handles multiple emails and URLs in one string', () => {
		const input = 'foo@bar.com and https://site.com and <baz@qux.com>';
		const output = linkifyToHtml(input);
		expect(output.match(/<a href="mailto:foo@bar.com"/g)).toHaveLength(1);
		expect(output.match(/<a href="mailto:baz@qux.com"/g)).toHaveLength(1);
		expect(output.match(/<a.*https:\/\/site\.com.*>/g)).toHaveLength(1);
	});

	it('does not escapes HTML tags in input', () => {
		const input = '<b>foo@bar.com</b>';
		const output = linkifyToHtml(input);
		expect(output).toBe(input);
	});

	it('applies custom anchorRel and openInNewTab options', () => {
		const output = linkifyToHtml(email, { anchorRel: 'nofollow', openInNewTab: false });
		expect(output).toContain('rel="nofollow"');
		expect(output).not.toContain('target="_blank"');
	});

	it('do not applies custom anchorRel if undefined', () => {
		const output = linkifyToHtml(email, { anchorRel: undefined });
		expect(output).not.toContain('rel="nofollow"');
	});

	it('do not applies custom anchorRel if empty', () => {
		const output = linkifyToHtml(email, { anchorRel: '' });
		expect(output).not.toContain('rel="nofollow"');
	});

	it('returns empty string for empty input', () => {
		const output = linkifyToHtml('');
		expect(output).toBe('');
	});

	it('handles input with only whitespace', () => {
		const output = linkifyToHtml('   ');
		expect(output).toBe('   ');
	});

	it('converts plain telephone number to tel anchor tags', () => {
		const input = 'Call me at +1234567890';
		const output = linkifyToHtml(input);
		expect(output).toBe(
			'Call me at <a href="tel:+1234567890" target="_blank" rel="noopener noreferrer">+1234567890</a>'
		);
	});

	it('when linkEmails=false, does NOT link plain emails or mailto:', () => {
		const input = `Plain: ${email} and mailto:demo@example.com?subject=Hi`;
		const html = linkifyToHtml(input, { linkEmails: false });

		expect(html).toContain(`Plain: ${email}`);
		expect(html).toContain(`mailto:demo@example.com?subject=Hi`);
		expect(html).not.toMatch(/<a[^>]+href="mailto:[^"]+"/);
	});

	it('does not double-link inside angle brackets when linkEmails=false', () => {
		const input = 'Send to <test@example.com>';
		const html = linkifyToHtml(input, { linkEmails: false });

		expect(html).toContain('<test@example.com>');
		expect(html).not.toMatch(/mailto:/);
	});
});
