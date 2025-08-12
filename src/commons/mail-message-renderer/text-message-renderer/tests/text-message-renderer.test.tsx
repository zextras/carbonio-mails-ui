/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { TextMessageRenderer } from '../text-message-renderer';
import { setupTest, screen } from '@test-setup';

describe('text-message-renderer', () => {
	describe('content manipulation', () => {
		describe('common links', () => {
			it('should return an empty string when content is empty', () => {
				setupTest(<TextMessageRenderer body={{ content: '' }} />);
				expect(screen.getByTestId('text-message-renderer-container')).toBeEmptyDOMElement();
			});

			it('should replaces single HTTP URL with anchor tag', () => {
				const content = 'Visit http://example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const result =
					'Visit <a href="http://example.com" target="_blank" rel="noopener noreferrer">http://example.com</a>';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should replaces single HTTPS URL with anchor tag', () => {
				const content = 'Visit https://example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const result =
					'Visit <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should not replace URL without protocol with anchor tag', () => {
				const content = 'Visit www.example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const result =
					'Visit <a href="http://www.example.com" target="_blank" rel="noopener noreferrer">www.example.com</a>';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should handle IP address input without modification', () => {
				const content = '127.0.0.1';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const result = '127.0.0.1';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should replaces URL with &amp; entity', () => {
				const content = 'Visit http://example.com?param=1&amp;param2=2';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const result =
					'Visit <a href="http://example.com?param=1&amp;param2=2" target="_blank" rel="noopener noreferrer">http://example.com?param=1&amp;param2=2</a>';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should replaces URL with &#64; and &#61; entities', () => {
				const content = 'Email me at http://example.com?email=test&#64;example.com&#61;true';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const result =
					'Email me at <a href="http://example.com?email=test@example.com=true" target="_blank" rel="noopener noreferrer">http://example.com?email=test@example.com=true</a>';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should replaces multiple URLs with anchor tags', () => {
				const content = 'Visit http://example.com and https://example.org';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const result =
					'Visit <a href="http://example.com" target="_blank" rel="noopener noreferrer">http://example.com</a> and <a href="https://example.org" target="_blank" rel="noopener noreferrer">https://example.org</a>';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should returns content as is when there are no URLs', () => {
				const content = 'No links here!';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(content);
			});

			it('should replaces mixed text and URLs with anchor tags', () => {
				const content =
					'Check http://example.com for more info and visit https://example.org later.';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const result =
					'Check <a href="http://example.com" target="_blank" rel="noopener noreferrer">http://example.com</a> for more info and visit <a href="https://example.org" target="_blank" rel="noopener noreferrer">https://example.org</a> later.';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should not include line breaks in the URL', () => {
				const content = 'Visit http://example.com<br />';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const result =
					'Visit <a href="http://example.com" target="_blank" rel="noopener noreferrer">http://example.com</a><br>';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			// noinspection JSUnusedLocalSymbols
			it.each([
				['http://foo.com/blah_blah_(wikipedia)', 'URL with underscores and parentheses'],
				['http://foo.com/blah_blah_(wikipedia)_(again)', 'URL with multiple parentheses'],
				['http://✪df.ws/123', 'URL with unicode domain'],
				['http://➡.ws/䨹', 'URL with unicode domain and path'],
				['http://foo.com/blah_(wikipedia)#cite-1', 'URL with parentheses and fragment'],
				[
					'http://foo.com/blah_(wikipedia)_blah#cite-1',
					'URL with multiple parentheses and fragment'
				],
				['http://foo.com/unicode_(✪)_in_parens', 'URL with unicode in parentheses'],
				['http://foo.com/(something)?after=parens', 'URL with parentheses and query'],
				['http://☺.damowmow.com/', 'URL with emoji domain']
				// eslint-disable-next-line unused-imports/no-unused-vars
			])('should render anchor for %s (%s)', (url, description) => {
				const content = `Visit ${url}`;
				const result = `Visit <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});
		});

		describe('emails and mailto links', () => {
			it('should convert email addresses into mailto anchors', () => {
				const content = 'Contact me at test@example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const result =
					'Contact me at <a href="mailto:test@example.com" target="_blank" rel="noopener noreferrer">test@example.com</a>';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should convert email addresses with angle brackets into mailto anchors', () => {
				const content = 'Contact me at <test@example.com>';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const result =
					'Contact me at &lt;<a href="mailto:test@example.com" target="_blank" rel="noopener noreferrer">test@example.com</a>&gt;';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});

			it('should convert email addresses with query parameters into mailto anchors', () => {
				const content =
					'Contact me at mailto:test@example.com?subject=CONFIRM%203f03cda22ea3b3876e90a23a4cd19e5b';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const result =
					'Contact me at <a href="mailto:test@example.com?subject=CONFIRM%203f03cda22ea3b3876e90a23a4cd19e5b" target="_blank" rel="noopener noreferrer">mailto:test@example.com?subject=CONFIRM%203f03cda22ea3b3876e90a23a4cd19e5b</a>';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});
		});
	});
});
