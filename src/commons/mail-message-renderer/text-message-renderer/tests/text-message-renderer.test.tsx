/* eslint-disable sonarjs/no-duplicate-string */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { TextMessageRenderer } from '../text-message-renderer';
import { setupTest, screen } from '@test-setup';

describe('TextMessageRenderer', () => {
	describe('Basic text handling', () => {
		it('renders nothing when content is empty', () => {
			setupTest(<TextMessageRenderer body={{ content: '' }} />);
			expect(screen.getByTestId('text-message-renderer-container')).toBeEmptyDOMElement();
		});

		it('preserves whitespace-only content', () => {
			const content = '   ';
			setupTest(<TextMessageRenderer body={{ content }} />);
			expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(content);
		});

		it('renders plain text content exactly as provided', () => {
			const content = 'Hello, world!';
			setupTest(<TextMessageRenderer body={{ content }} />);
			expect(screen.getByTestId('text-message-renderer-container')).toHaveTextContent(content);
		});

		it('converts newlines to <br> tags', () => {
			const content = 'Line 1\nLine 2\r\nLine 3';
			setupTest(<TextMessageRenderer body={{ content }} />);
			expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(
				'Line 1<br>Line 2<br>Line 3'
			);
		});
	});

	describe('Quoted text handling', () => {
		it('shows a toggle button when quoted text is detected', () => {
			const content = 'Reply\n> Quoted message';
			setupTest(<TextMessageRenderer body={{ content }} />);
			expect(screen.getByRole('button', { name: 'label.show_quoted_text' })).toBeInTheDocument();
		});

		it('does not show toggle button when no quoted text exists', () => {
			const content = 'Simple message';
			setupTest(<TextMessageRenderer body={{ content }} />);
			expect(
				screen.queryByRole('button', { name: 'label.show_quoted_text' })
			).not.toBeInTheDocument();
		});

		it('reveals quoted text when toggle button is clicked', async () => {
			const content = 'Reply\n> Quoted message';
			const { user } = setupTest(<TextMessageRenderer body={{ content }} />);

			await user.click(screen.getByRole('button', { name: 'label.show_quoted_text' }));

			expect(screen.getByTestId('text-message-renderer-container').innerHTML).toContain(
				'Quoted message'
			);
		});

		it('handles multiple levels of quoted text', () => {
			const content = 'Reply\n>> Nested quote\n> First level quote';
			setupTest(<TextMessageRenderer body={{ content }} />);
			expect(screen.getByRole('button', { name: 'label.show_quoted_text' })).toBeInTheDocument();
		});
	});

	describe('URL detection and linking', () => {
		it('converts HTTP URLs into clickable links', () => {
			const content = 'Visit http://example.com';
			setupTest(<TextMessageRenderer body={{ content }} />);

			const link = screen.getByRole('link', { name: 'http://example.com' });
			expect(link).toHaveAttribute('href', 'http://example.com');
			expect(link).toHaveAttribute('target', '_blank');
			expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		});

		it('converts HTTPS URLs into clickable links', () => {
			const content = 'Secure https://example.com';
			setupTest(<TextMessageRenderer body={{ content }} />);

			const link = screen.getByRole('link', { name: 'https://example.com' });
			expect(link).toHaveAttribute('href', 'https://example.com');
		});

		it('adds http:// protocol to protocol-less www URLs', () => {
			const content = 'Visit www.example.com';
			setupTest(<TextMessageRenderer body={{ content }} />);

			const link = screen.getByRole('link', { name: 'www.example.com' });
			expect(link).toHaveAttribute('href', 'http://www.example.com');
		});

		it('handles URLs with query parameters correctly', () => {
			const content = 'Search https://google.com?q=test';
			setupTest(<TextMessageRenderer body={{ content }} />);

			const link = screen.getByRole('link', { name: 'https://google.com?q=test' });
			expect(link).toHaveAttribute('href', 'https://google.com?q=test');
		});

		it('handles URLs with anchors/fragments correctly', () => {
			const content = 'Jump to https://example.com#section';
			setupTest(<TextMessageRenderer body={{ content }} />);

			const link = screen.getByRole('link', { name: 'https://example.com#section' });
			expect(link).toHaveAttribute('href', 'https://example.com#section');
		});

		it('handles multiple URLs in the same text', () => {
			const content = 'Visit http://site1.com and https://site2.com';
			setupTest(<TextMessageRenderer body={{ content }} />);

			const links = screen.getAllByRole('link');
			expect(links).toHaveLength(2);
			expect(links[0]).toHaveAttribute('href', 'http://site1.com');
			expect(links[1]).toHaveAttribute('href', 'https://site2.com');
		});

		it('does not convert IP addresses into links', () => {
			const content = 'Localhost is at 127.0.0.1';
			setupTest(<TextMessageRenderer body={{ content }} />);

			expect(screen.queryByRole('link')).not.toBeInTheDocument();
			expect(screen.getByTestId('text-message-renderer-container')).toHaveTextContent(content);
		});

		it('handles URLs with special characters correctly', () => {
			const content = 'Visit https://example.com/path?param=value&another=param';
			setupTest(<TextMessageRenderer body={{ content }} />);

			const link = screen.getByRole('link', {
				name: 'https://example.com/path?param=value&another=param'
			});
			expect(link).toHaveAttribute('href', 'https://example.com/path?param=value&another=param');
		});

		it('handles URLs at the end of content', () => {
			const content = 'My site is http://example.com';
			setupTest(<TextMessageRenderer body={{ content }} />);

			expect(screen.getByRole('link')).toBeInTheDocument();
			expect(screen.getByTestId('text-message-renderer-container')).toHaveTextContent(
				'My site is http://example.com'
			);
		});

		it('handles URLs at the start of content', () => {
			const content = 'http://example.com is my site';
			setupTest(<TextMessageRenderer body={{ content }} />);

			expect(screen.getByRole('link')).toBeInTheDocument();
			expect(screen.getByTestId('text-message-renderer-container')).toHaveTextContent(
				'http://example.com is my site'
			);
		});

		it.each([
			['http://foo.com/blah_blah_(wikipedia)', 'URL with underscores and parentheses'],
			['http://foo.com/blah_blah_(wikipedia)_(again)', 'URL with multiple parentheses'],
			['http://✪df.ws/123', 'URL with unicode domain'],
			['http://➡.ws/䨹', 'URL with unicode domain and path'],
			['http://foo.com/blah_(wikipedia)#cite-1', 'URL with parentheses and fragment'],
			['http://foo.com/blah_(wikipedia)_blah#cite-1', 'URL with multiple parentheses and fragment'],
			['http://foo.com/unicode_(✪)_in_parens', 'URL with unicode in parentheses'],
			['http://foo.com/(something)?after=parens', 'URL with parentheses and query'],
			['http://☺.damowmow.com/', 'URL with emoji domain']
		])('handles anchor for %s (%s)', (url, _description) => {
			const content = `Visit ${url}`;
			const result = `Visit <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
			setupTest(<TextMessageRenderer body={{ content }} />);
			expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
		});
	});

	describe('Email address handling', () => {
		describe('Plain email addresses', () => {
			it('converts plain email addresses into mailto links', () => {
				const content = 'Contact me at user@example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const link = screen.getByRole('link', { name: 'user@example.com' });
				expect(link).toHaveAttribute('href', 'mailto:user@example.com');
			});

			it('should not include trailing . in email address', () => {
				const content = 'Contact me at test@unilim.fr.';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const link = screen.getByRole('link', { name: 'test@unilim.fr' });
				expect(link).toHaveAttribute('href', 'mailto:test@unilim.fr');
			});

			it('handles email addresses with numbers', () => {
				const content = 'user123@example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);

				expect(screen.getByRole('link')).toHaveAttribute('href', 'mailto:user123@example.com');
			});

			it('handles email addresses with special characters', () => {
				const content = 'user.name+tag@example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);

				expect(screen.getByRole('link')).toHaveAttribute(
					'href',
					'mailto:user.name+tag@example.com'
				);
			});

			it('handles email addresses with dots', () => {
				const content = 'firstname.lastname@example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute(
					'href',
					'mailto:firstname.lastname@example.com'
				);
			});

			it('handles email addresses with subdomains', () => {
				const content = 'user@subdomain.example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute(
					'href',
					'mailto:user@subdomain.example.com'
				);
			});

			it('handles international email addresses with Unicode characters', () => {
				const content = '用户@例子.测试';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute('href', 'mailto:用户@例子.测试');
			});

			it('handles email addresses with Unicode in local part', () => {
				const content = 'ñóñó@example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute('href', 'mailto:ñóñó@example.com');
			});

			it('handles email addresses with IP addresses as domain', () => {
				const content = 'user@[192.168.1.1]';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute('href', 'mailto:user@[192.168.1.1]');
			});

			it('handles email addresses with IPv6 addresses as domain', () => {
				const content = 'user@[IPv6:2001:db8::1]';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute('href', 'mailto:user@[IPv6:2001:db8::1]');
			});

			it('handles email addresses with display names', () => {
				const content = 'John Doe <john.doe@example.com>';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute('href', 'mailto:john.doe@example.com');
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toContain(
					'John Doe &lt;<a href="mailto:john.doe@example.com"'
				);
			});

			it('handles email addresses with quoted display names', () => {
				const content = '"John Q. Doe" <john.doe@example.com>';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute('href', 'mailto:john.doe@example.com');
			});

			it('handles email addresses with display names', () => {
				const content = 'Email <user@example.com>';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const link = screen.getByRole('link', { name: 'user@example.com' });
				expect(link).toBeInTheDocument();
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toContain(
					'&lt;<a href="mailto:user@example.com"'
				);
			});

			it('handles multiple email addresses in the same text', () => {
				const content = 'Contact user1@example.com or user2@example.org';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const links = screen.getAllByRole('link');
				expect(links).toHaveLength(2);
				expect(links[0]).toHaveAttribute('href', 'mailto:user1@example.com');
				expect(links[1]).toHaveAttribute('href', 'mailto:user2@example.org');
			});

			it('handles email addresses with angle brackets', () => {
				const content = 'Contact me at <test@example.com>';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const result =
					'Contact me at &lt;<a href="mailto:test@example.com" target="_blank" rel="noopener noreferrer">test@example.com</a>&gt;';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});
		});

		describe('mailto: links', () => {
			it('converts mailto: links into clickable links', () => {
				const content = 'Email mailto:user@example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const link = screen.getByRole('link', { name: 'mailto:user@example.com' });
				expect(link).toHaveAttribute('href', 'mailto:user@example.com');
			});

			it('handles email addresses with query parameters', () => {
				const content = 'Email mailto:user@example.com?subject=Test';
				setupTest(<TextMessageRenderer body={{ content }} />);

				const link = screen.getByRole('link', { name: 'mailto:user@example.com?subject=Test' });
				expect(link).toHaveAttribute('href', 'mailto:user@example.com?subject=Test');
			});

			it('handles mailto: URIs with subject', () => {
				const content = 'mailto:user@example.com?subject=Hello';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute(
					'href',
					'mailto:user@example.com?subject=Hello'
				);
			});

			it('handles mailto: URIs with multiple parameters', () => {
				const content = 'mailto:user@example.com?subject=Hello&body=World';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute(
					'href',
					'mailto:user@example.com?subject=Hello&body=World'
				);
			});

			it('handles mailto: URIs with CC and BCC', () => {
				const content = 'mailto:user@example.com?cc=other@example.com&bcc=hidden@example.com';
				setupTest(<TextMessageRenderer body={{ content }} />);
				expect(screen.getByRole('link')).toHaveAttribute(
					'href',
					'mailto:user@example.com?cc=other@example.com&bcc=hidden@example.com'
				);
			});

			it('handles international mailto email addresses within angle brackets', () => {
				const content =
					'Contact me at <mailto:用户@例子.测试?cc=other@example.com&bcc=hidden@example.com>';
				setupTest(<TextMessageRenderer body={{ content }} />);
				const result =
					'Contact me at &lt;<a href="mailto:用户@例子.测试?cc=other@example.com&amp;bcc=hidden@example.com" target="_blank" rel="noopener noreferrer">mailto:用户@例子.测试?cc=other@example.com&amp;bcc=hidden@example.com</a>&gt;';
				expect(screen.getByTestId('text-message-renderer-container').innerHTML).toBe(result);
			});
		});
	});

	describe('Telephone number handling', () => {
		it('converts telephone numbers into links', () => {
			const content = 'Call me at +1234567890';
			setupTest(<TextMessageRenderer body={{ content }} />);

			expect(screen.getByRole('link')).toBeInTheDocument();
			expect(screen.getByRole('link')).toHaveAttribute('href', 'tel:+1234567890');
		});

		it('converts telephone numbers with special characters into links', () => {
			const content = 'Call me at +1 (234) 567-8900';
			setupTest(<TextMessageRenderer body={{ content }} />);

			expect(screen.getByRole('link')).toBeInTheDocument();
			expect(screen.getByRole('link')).toHaveAttribute('href', 'tel:+12345678900');
		});
	});

	describe('Edge cases', () => {
		it('handles content that looks like a URL but is not', () => {
			const content = 'This is not a URL: http://';
			setupTest(<TextMessageRenderer body={{ content }} />);

			expect(screen.queryByRole('link')).not.toBeInTheDocument();
			expect(screen.getByTestId('text-message-renderer-container')).toHaveTextContent(content);
		});

		it('handles very long URLs correctly', () => {
			const longPath = '/'.repeat(1000);
			const content = `Visit http://example.com${longPath}`;
			setupTest(<TextMessageRenderer body={{ content }} />);

			const link = screen.getByRole('link');
			expect(link).toHaveAttribute('href', `http://example.com${longPath}`);
		});

		it('handles mixed content with text, URLs and emails', () => {
			const content = 'Contact me at user@example.com or visit http://example.com';
			setupTest(<TextMessageRenderer body={{ content }} />);

			const links = screen.getAllByRole('link');
			expect(links).toHaveLength(2);
			expect(links[0]).toHaveAttribute('href', 'mailto:user@example.com');
			expect(links[1]).toHaveAttribute('href', 'http://example.com');
		});

		it('preserves whitespace around URLs and emails', () => {
			const content = '  http://example.com  user@example.com  ';
			setupTest(<TextMessageRenderer body={{ content }} />);

			const container = screen.getByTestId('text-message-renderer-container');

			// start of the string has whitespace before the URL
			expect(container.innerHTML).toMatch(/^\s+<a/);

			// there's whitespace between the URL and email
			expect(container.innerHTML).toMatch(/<\/a>\s+<a/);

			// end of the string has whitespace after the email
			expect(container.innerHTML).toMatch(/<\/a>\s+$/);
		});
	});
});
