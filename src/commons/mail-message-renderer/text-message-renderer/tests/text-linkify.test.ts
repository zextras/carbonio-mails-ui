/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { linkifyToHtml } from '../text-linkify';

describe('linkifyToHtml', () => {
	it('converts URLs to anchor tags', () => {
		const input = 'Visit https://example.com for info.';
		const output = linkifyToHtml(input);
		expect(output).toContain('<a');
		expect(output).toContain('https://example.com');
	});

	it('converts mailto links with query to anchor tags', () => {
		const input = 'Contact mailto:foo@bar.com?subject=Hello';
		const output = linkifyToHtml(input);
		expect(output).toContain('<a href="mailto:foo@bar.com?subject=Hello"');
		expect(output).toContain('mailto:foo@bar.com?subject=Hello');
	});

	it('converts plain email addresses to mailto anchor tags', () => {
		const input = 'Email me at foo@bar.com';
		const output = linkifyToHtml(input);
		expect(output).toContain('<a href="mailto:foo@bar.com"');
		// eslint-disable-next-line sonarjs/no-duplicate-string
		expect(output).toContain('foo@bar.com');
	});

	it('converts angle-bracketed emails to mailto anchor tags with literal brackets', () => {
		const input = 'Contact <foo@bar.com>';
		const output = linkifyToHtml(input);
		expect(output).toContain('&lt;<a href="mailto:foo@bar.com"');
		expect(output).toContain('foo@bar.com');
		expect(output).toContain('&gt;');
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
		const input = 'foo@bar.com';
		const output = linkifyToHtml(input, { anchorRel: 'nofollow', openInNewTab: false });
		expect(output).toContain('rel="nofollow"');
		expect(output).not.toContain('target="_blank"');
	});

	it('do not applies custom anchorRel if undefined', () => {
		const input = 'foo@bar.com';
		const output = linkifyToHtml(input, { anchorRel: undefined });
		expect(output).not.toContain('rel="nofollow"');
	});

	it('do not applies custom anchorRel if empty', () => {
		const input = 'foo@bar.com';
		const output = linkifyToHtml(input, { anchorRel: '' });
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
});
