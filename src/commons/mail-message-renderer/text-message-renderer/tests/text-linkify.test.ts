/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { linkifyText } from '../text-linkify';

describe('linkifyToHtml', () => {
	const email = 'foo@bar.com';

	it('converts URLs to anchor tags', () => {
		const input = 'Visit https://example.com for info.';
		const output = linkifyText(input);
		expect(output).toBe(
			'Visit <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a> for info.'
		);
	});

	it('converts mailto links with query to anchor tags', () => {
		const input = 'Contact mailto:foo@bar.com?subject=Hello';
		const output = linkifyText(input);
		expect(output).toBe(
			'Contact <a href="mailto:foo@bar.com?subject=Hello" target="_blank" rel="noopener noreferrer">mailto:foo@bar.com?subject=Hello</a>'
		);
	});

	it('converts plain email addresses to mailto anchor tags', () => {
		const input = 'Email me at foo@bar.com';
		const output = linkifyText(input);
		expect(output).toBe(
			'Email me at <a href="mailto:foo@bar.com" target="_blank" rel="noopener noreferrer">foo@bar.com</a>'
		);
	});

	it('converts angle-bracketed emails to mailto anchor tags with literal brackets', () => {
		const input = 'Contact <foo@bar.com>';
		const output = linkifyText(input);
		expect(output).toBe(
			'Contact &lt;<a href="mailto:foo@bar.com" target="_blank" rel="noopener noreferrer">foo@bar.com</a>&gt;'
		);
	});

	it('preserves non-email text', () => {
		const input = 'Hello world!';
		const output = linkifyText(input);
		expect(output).toBe('Hello world!');
	});

	it('handles multiple emails and URLs in one string', () => {
		const input = 'foo@bar.com and https://site.com and <baz@qux.com>';
		const output = linkifyText(input);
		expect(output.match(/<a href="mailto:foo@bar.com"/g)).toHaveLength(1);
		expect(output.match(/<a href="mailto:baz@qux.com"/g)).toHaveLength(1);
		expect(output.match(/<a.*https:\/\/site\.com.*>/g)).toHaveLength(1);
	});

	it('escapes HTML tags in input so they are not interpreted as markup', () => {
		const input = '<b>foo@bar.com</b>';
		const output = linkifyText(input);
		expect(output).toBe('&lt;b&gt;foo@bar.com&lt;/b&gt;');
	});

	it('does not allow a quote in a mailto query to break out of the href attribute', () => {
		const input = 'mailto:a@b.com?subject=x"onmouseover="alert(document.domain)';
		const output = linkifyText(input);
		// The double quote must be escaped so no event-handler attribute can be injected.
		expect(output).not.toContain('"onmouseover');
		expect(output).not.toMatch(/onmouseover\s*=\s*"/i);
		expect(output).toContain('&quot;onmouseover');
	});

	it('neutralizes an <img onerror> XSS payload from a plain text body', () => {
		const input =
			'Hello this is an important message<img src=x onerror=window.location.replace("https://badsite.io/static/login/");>';
		const output = linkifyText(input);
		// No live tag/attribute may survive: angle brackets must be escaped.
		expect(output).not.toContain('<img');
		expect(output).not.toMatch(/<[^a/]/); // only the anchors we generate (<a ...) are allowed
		expect(output).toContain('&lt;img src=x onerror=');
	});

	it('applies custom anchorRel and openInNewTab options', () => {
		const output = linkifyText(email, { anchorRel: 'nofollow', openInNewTab: false });
		expect(output).toContain('rel="nofollow"');
		expect(output).not.toContain('target="_blank"');
	});

	it('do not applies custom anchorRel if undefined', () => {
		const output = linkifyText(email, { anchorRel: undefined });
		expect(output).not.toContain('rel="nofollow"');
	});

	it('do not applies custom anchorRel if empty', () => {
		const output = linkifyText(email, { anchorRel: '' });
		expect(output).not.toContain('rel="nofollow"');
	});

	it('returns empty string for empty input', () => {
		const output = linkifyText('');
		expect(output).toBe('');
	});

	it('handles input with only whitespace', () => {
		const output = linkifyText('   ');
		expect(output).toBe('   ');
	});

	it('converts plain telephone number to tel anchor tags', () => {
		const input = 'Call me at +1234567890';
		const output = linkifyText(input);
		expect(output).toBe(
			'Call me at <a href="tel:+1234567890" target="_blank" rel="noopener noreferrer">+1234567890</a>'
		);
	});

	it('when linkEmails=false, does NOT link plain emails or mailto:', () => {
		const input = `Plain: ${email} and mailto:demo@example.com?subject=Hi`;
		const html = linkifyText(input, { linkEmails: false });

		expect(html).toContain(`Plain: ${email}`);
		expect(html).toContain(`mailto:demo@example.com?subject=Hi`);
		expect(html).not.toMatch(/<a[^>]+href="mailto:[^"]+"/);
	});

	it('does not double-link inside angle brackets when linkEmails=false', () => {
		const input = 'Send to <test@example.com>';
		const html = linkifyText(input, { linkEmails: false });

		expect(html).toContain('&lt;test@example.com&gt;');
		expect(html).not.toMatch(/mailto:/);
	});

	it('does not linkify text when autolinker is false', () => {
		const input = 'Visit https://example.com';
		const output = linkifyText(input, { autolinker: false });
		expect(output).toBe(input);
	});

	it('does not linkify text when autolinker is false and linkEmails is false', () => {
		const input = 'Visit https://example.com and email me at foo@bar.com';
		const output = linkifyText(input, { autolinker: false, linkEmails: false });
		expect(output).toBe(input);
	});

	it('does not linkify link when autolinker is false and linkEmails is true', () => {
		const input = 'Visit https://example.com and email me at foo@bar.com';
		const output = linkifyText(input, { autolinker: false, linkEmails: true });
		expect(output).toBe(
			'Visit https://example.com and email me at <a href="mailto:foo@bar.com" target="_blank" rel="noopener noreferrer">foo@bar.com</a>'
		);
	});

	it('escapes the angle brackets around a bracketed mailto link', () => {
		const input = 'Contact <mailto:test@example.com?subject=Hello>';
		const output = linkifyText(input);
		// Angle brackets are escaped so the bracketed form cannot inject markup,
		// and the closing bracket is kept outside the anchor.
		expect(output).not.toMatch(/<[^a/]/);
		expect(output).toBe(
			'Contact &lt;<a href="mailto:test@example.com?subject=Hello" target="_blank" rel="noopener noreferrer">mailto:test@example.com?subject=Hello</a>&gt;'
		);
	});
});
