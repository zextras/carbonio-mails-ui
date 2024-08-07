/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { replaceLinkToAnchor } from '../mail-message-renderer';

describe('replaceLinkToAnchor', () => {
	it('should return an empty string when content is empty', () => {
		expect(replaceLinkToAnchor('')).toBe('');
	});

	it('should replaces single HTTP URL with anchor tag', () => {
		const content = 'Visit http://example.com';
		const result = 'Visit <a href="http://example.com" target="_blank">http://example.com</a>';
		expect(replaceLinkToAnchor(content)).toBe(result);
	});

	it('should replaces single HTTPS URL with anchor tag', () => {
		const content = 'Visit https://example.com';
		const result = 'Visit <a href="https://example.com" target="_blank">https://example.com</a>';
		expect(replaceLinkToAnchor(content)).toBe(result);
	});

	it('should replaces URL without protocol with anchor tag', () => {
		const content = 'Visit www.example.com';
		const result = 'Visit <a href="http://www.example.com" target="_blank">www.example.com</a>';
		expect(replaceLinkToAnchor(content)).toBe(result);
	});

	it('should replaces URL with &amp; entity', () => {
		const content = 'Visit http://example.com?param=1&amp;param2=2';
		const result =
			'Visit <a href="http://example.com?param=1&amp;amp;param2=2" target="_blank">http://example.com?param=1&amp;param2=2</a>';
		expect(replaceLinkToAnchor(content)).toBe(result);
	});

	it('should replaces URL with &#64; and &#61; entities', () => {
		const content = 'Email me at http://example.com?email=test&#64;example.com&#61;true';
		const result =
			'Email me at <a href="http://example.com?email=test&amp;#64;example.com&amp;#61;true" target="_blank">http://example.com?email=test@example.com=true</a>';
		expect(replaceLinkToAnchor(content)).toBe(result);
	});

	it('should replaces multiple URLs with anchor tags', () => {
		const content = 'Visit http://example.com and https://example.org';
		const result =
			'Visit <a href="http://example.com" target="_blank">http://example.com</a> and <a href="https://example.org" target="_blank">https://example.org</a>';
		expect(replaceLinkToAnchor(content)).toBe(result);
	});

	it('should returns content as is when there are no URLs', () => {
		const content = 'No links here!';
		expect(replaceLinkToAnchor(content)).toBe(content);
	});

	it('should replaces mixed text and URLs with anchor tags', () => {
		const content = 'Check http://example.com for more info and visit https://example.org later.';
		const result =
			'Check <a href="http://example.com" target="_blank">http://example.com</a> for more info and visit <a href="https://example.org" target="_blank">https://example.org</a> later.';
		expect(replaceLinkToAnchor(content)).toBe(result);
	});
});
