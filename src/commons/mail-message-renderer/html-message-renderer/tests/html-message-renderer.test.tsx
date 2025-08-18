/* eslint-disable testing-library/no-node-access */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, within } from '@testing-library/react';

import { updateMessages } from '../../../../store/emails/store';
import { generateCompleteMessageFromAPI } from '../../../../tests/generators/api';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { GetMsgRequest, GetMsgResponse, MailMessage } from '../../../../types';
import { HtmlMessageRenderer } from '../html-message-renderer';
import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';

// Helper function to access shadow DOM elements
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function shadowAccess(testId = 'shadow-dom-wrapper') {
	const wrapper = screen.getByTestId(testId) as HTMLElement & { shadowRoot: ShadowRoot | null };
	if (!wrapper.shadowRoot) throw new Error(`No shadowRoot on element [data-testid="${testId}"]`);

	const queries = within(wrapper.shadowRoot as unknown as HTMLElement);
	return { ...queries, root: wrapper.shadowRoot };
}

describe('HTMLMessageRenderer Component', () => {
	const truncatedMessageLabel = 'warningBanner.truncatedMessage.label';
	const truncatedMessageButton = 'warningBanner.truncatedMessage.button';

	describe('Module-specific Behavior', () => {
		describe('Search Module', () => {
			it('should display truncated message warning banner when message is truncated', async () => {
				const message = generateMessage({ id: '1', body: 'Test', truncated: true });
				updateMessages([message]);

				setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/search']
				});

				expect(await screen.findByText(truncatedMessageLabel)).toBeVisible();
			});

			it('should not display warning banner when message is not truncated', () => {
				const message = generateMessage({ id: '1', body: 'Test', truncated: false });
				updateMessages([message]);

				setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/search']
				});

				expect(screen.queryByText(truncatedMessageLabel)).not.toBeInTheDocument();
			});

			it('should fetch complete message when clicking load button for truncated message', async () => {
				const response: GetMsgResponse = { m: [generateCompleteMessageFromAPI({ id: '1' })] };
				const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
					'GetMsg',
					response
				);
				const message = generateMessage({ id: '1', body: 'Test', truncated: true });
				updateMessages([message]);

				const { user } = setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/search']
				});

				const loadMessageButton = await screen.findByText(truncatedMessageButton);
				await act(async () => {
					await user.click(loadMessageButton);
				});

				const request = await interceptor;
				expect(request.m.id).toBe('1');
				expect(request.m.max).toBeUndefined();
			});

			it('should remove warning banner after successfully loading complete message', async () => {
				const message = generateMessage({ id: '1', body: 'Initial body', truncated: true });
				updateMessages([message]);
				const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
					m: [
						generateCompleteMessageFromAPI({
							id: '1',
							mp: [
								{
									ct: 'text/html',
									part: '0',
									body: true,
									truncated: false,
									content: 'Updated content'
								}
							]
						})
					]
				});

				const { user } = setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/search']
				});

				const loadMessageButton = await screen.findByText(truncatedMessageButton);

				await user.click(loadMessageButton);
				await interceptor;

				await act(async () => {
					expect(screen.queryByText(truncatedMessageButton)).not.toBeInTheDocument();
				});
			});

			it('should not render message content when only available in mails store', () => {
				const messageBody = 'Initial body';
				const message = generateMessage({ id: '1', body: messageBody, truncated: true });

				setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/search']
				});

				expect(screen.queryByText(messageBody)).not.toBeInTheDocument();
			});
		});

		describe('Mails Module', () => {
			it('should display truncated message warning banner when message is truncated', async () => {
				const message = generateMessage({ id: '1', body: 'Initial body', truncated: true });

				setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/mails']
				});

				expect(await screen.findByText(truncatedMessageLabel)).toBeVisible();
			});

			it('should not display warning banner when message is not truncated', () => {
				const message = generateMessage({ id: '1', body: 'Initial body', truncated: false });

				setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/mails']
				});

				expect(screen.queryByText(truncatedMessageLabel)).not.toBeInTheDocument();
			});

			it('should fetch complete message when clicking load button for truncated message', async () => {
				const message = generateMessage({ id: '1', body: 'Initial body', truncated: true });
				const response: GetMsgResponse = { m: [generateCompleteMessageFromAPI({ id: '1' })] };
				const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
					'GetMsg',
					response
				);

				const { user } = setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/mails']
				});

				const loadMessageButton = await screen.findByText(truncatedMessageButton);
				await act(async () => {
					await user.click(loadMessageButton);
				});

				const request = await interceptor;
				expect(request.m.id).toBe('1');
				expect(request.m.max).toBeUndefined();
			});

			it('should remove warning banner after successfully loading complete message', async () => {
				const message = generateMessage({ id: '1', body: 'Initial body', truncated: true });
				const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
					m: [
						generateCompleteMessageFromAPI({
							id: '1',
							mp: [
								{
									ct: 'text/html',
									part: '0',
									body: true,
									truncated: false,
									content: 'Updated content'
								}
							]
						})
					]
				});

				const { user } = setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/mails']
				});

				const loadMessageButton = await screen.findByText(truncatedMessageButton);
				await user.click(loadMessageButton);
				await interceptor;

				await act(async () => {
					expect(screen.queryByText(truncatedMessageButton)).not.toBeInTheDocument();
				});
			});
		});
	});

	describe('HTML Content Rendering', () => {
		it('should preserve CSS styles in the rendered message', async () => {
			const message = {
				id: '1',
				body: {
					contentType: 'text/html',
					content: `<style>.my-styled-paragraph {color: purple;font-size: 20px;}</style><p class="my-styled-paragraph">test component</p>`
				},
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />, {
				initialEntries: ['/mails']
			});

			const { root, getByText } = shadowAccess();
			expect(getByText('test component')).toBeInTheDocument();

			// eslint-disable-next-line testing-library/no-node-access
			const styleEl = root.querySelector('style');
			expect(styleEl).toBeInTheDocument();
			expect(styleEl?.textContent).toContain('color: purple');
			expect(styleEl?.textContent).toContain('font-size: 20px');
		});

		it('should preserve all HTML attributes in the rendered message', async () => {
			const message = {
				id: '1',
				body: {
					contentType: 'text/html',
					content: `<div data-testid="test-div" class="test-class" style="color: red;">Test content</div>`
				},
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />, {
				initialEntries: ['/mails']
			});

			const { getByTestId } = shadowAccess();
			const divElement = getByTestId('test-div');

			expect(divElement).toBeInTheDocument();
			expect(divElement).toHaveClass('test-class');
			expect(divElement).toHaveStyle('color: red;');
			expect(divElement).toHaveTextContent('Test content');
		});

		it('should render SVG content properly', async () => {
			const message = {
				id: '1',
				body: {
					contentType: 'text/html',
					content: `<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>`
				},
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />, {
				initialEntries: ['/mails']
			});

			const { root } = shadowAccess();
			const svgElement = root.querySelector('svg');
			expect(svgElement).toBeInTheDocument();
			expect(svgElement?.querySelector('circle')).toBeInTheDocument();
		});
	});

	describe('Unicode and Special Character Handling', () => {
		it('should correctly render multiple valid surrogate pairs emoji', () => {
			const message = {
				id: '1',
				body: {
					contentType: 'text/html',
					content: '\\uD83D\\uDE00\\uD83D\\uDE01' // 😀😁
				},
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />, {
				initialEntries: ['/mails']
			});

			const { root } = shadowAccess();
			expect(root?.innerHTML).toContain('😀😁');
		});

		it('should handle mixed valid and invalid surrogate pairs gracefully', () => {
			const message = {
				id: '1',
				body: {
					contentType: 'text/html',
					content: '\\uD83D\\uDE00\\uD83D\\u1234' // 😀 + invalid pair
				},
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />, {
				initialEntries: ['/mails']
			});

			const { root } = shadowAccess();
			expect(root?.innerHTML).toContain('😀\\uD83D\\u1234');
		});

		it('should preserve non-ASCII characters in the content', () => {
			const message = {
				id: '1',
				body: {
					contentType: 'text/html',
					content: 'Special characters: 日本語 Español Français'
				},
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />, {
				initialEntries: ['/mails']
			});

			const { root } = shadowAccess();
			expect(root?.textContent).toContain('Special characters: 日本語 Español Français');
		});
	});

	describe('Email address handling (HtmlMessageRenderer)', () => {
		describe('Plain email addresses', () => {
			it('converts plain email addresses into mailto links', () => {
				const content = 'Contact me at user@example.com';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				const link = getByRole('link', { name: 'user@example.com' });
				expect(link).toHaveAttribute('href', 'mailto:user@example.com');
			});

			it('should not include trailing . in email address', () => {
				const content = 'Contact me at test@unilim.fr.';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				const link = getByRole('link', { name: 'test@unilim.fr' });
				expect(link).toHaveAttribute('href', 'mailto:test@unilim.fr');
			});

			it('handles email addresses with numbers', () => {
				const content = 'user123@example.com';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);

				const { getByRole } = shadowAccess();
				const link = getByRole('link');
				expect(link).toHaveAttribute('href', 'mailto:user123@example.com');
				expect(link).toHaveAttribute('target', '_blank');
				expect(link).toHaveAttribute('rel', 'noopener noreferrer');
			});

			it('handles email addresses with special characters', () => {
				const content = 'user.name+tag@example.com';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute('href', 'mailto:user.name+tag@example.com');
			});

			it('handles email addresses with dots', () => {
				const content = 'firstname.lastname@example.com';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute('href', 'mailto:firstname.lastname@example.com');
			});

			it('handles email addresses with subdomains', () => {
				const content = 'user@subdomain.example.com';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute('href', 'mailto:user@subdomain.example.com');
			});

			it('handles international email addresses with Unicode characters', () => {
				const content = '用户@例子.测试';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute('href', 'mailto:用户@例子.测试');
			});

			it('handles email addresses with Unicode in local part', () => {
				const content = 'ñóñó@example.com';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute('href', 'mailto:ñóñó@example.com');
			});

			it('handles email addresses with IP addresses as domain', () => {
				const content = 'user@[192.168.1.1]';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute('href', 'mailto:user@[192.168.1.1]');
			});

			it('handles email addresses with IPv6 addresses as domain', () => {
				const content = 'user@[IPv6:2001:db8::1]';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute('href', 'mailto:user@[IPv6:2001:db8::1]');
			});

			it('handles email addresses with quoted display names', () => {
				const content = '"John Q. Doe" <john.doe@example.com>';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute('href', 'mailto:john.doe@example.com');
			});

			it('handles email addresses with display names', () => {
				const content = 'Email <user@example.com>';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole, root } = shadowAccess();
				const link = getByRole('link', { name: 'user@example.com' });
				expect(link).toBeInTheDocument();
				expect(root.innerHTML).toContain('&lt;<a href="mailto:user@example.com"');
			});

			it('handles multiple email addresses in the same text', () => {
				const content = 'Contact user1@example.com or user2@example.org';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getAllByRole } = shadowAccess();
				const links = getAllByRole('link');
				expect(links).toHaveLength(2);
				expect(links[0]).toHaveAttribute('href', 'mailto:user1@example.com');
				expect(links[1]).toHaveAttribute('href', 'mailto:user2@example.org');
			});

			it('handles email addresses with angle brackets', () => {
				const content = 'Contact me at <test@example.com>';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { root } = shadowAccess();
				const result =
					'Contact me at &lt;<a href="mailto:test@example.com" target="_blank" rel="noopener noreferrer">test@example.com</a>&gt;';
				expect(root.innerHTML).toContain(result);
			});
		});

		describe('mailto: links', () => {
			it('converts mailto: links into clickable links', () => {
				const content = 'Email mailto:user@example.com';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				const link = getByRole('link', { name: 'mailto:user@example.com' });
				expect(link).toHaveAttribute('href', 'mailto:user@example.com');
			});

			it('handles email addresses with query parameters', () => {
				const content = 'Email mailto:user@example.com?subject=Test';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				const link = getByRole('link', { name: 'mailto:user@example.com?subject=Test' });
				expect(link).toHaveAttribute('href', 'mailto:user@example.com?subject=Test');
			});

			it('handles mailto: URIs with subject', () => {
				const content = 'mailto:user@example.com?subject=Hello';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute('href', 'mailto:user@example.com?subject=Hello');
			});

			it('handles mailto: URIs with multiple parameters', () => {
				const content = 'mailto:user@example.com?subject=Hello&body=World';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute(
					'href',
					'mailto:user@example.com?subject=Hello&body=World'
				);
			});

			it('handles mailto: URIs with CC and BCC', () => {
				const content = 'mailto:user@example.com?cc=other@example.com&bcc=hidden@example.com';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { getByRole } = shadowAccess();
				expect(getByRole('link')).toHaveAttribute(
					'href',
					'mailto:user@example.com?cc=other@example.com&bcc=hidden@example.com'
				);
			});

			it('handles international mailto email addresses within angle brackets', () => {
				const content =
					'Contact me at <mailto:用户@例子.测试?cc=other@example.com&bcc=hidden@example.com>';
				const message = {
					id: '1',
					body: { contentType: 'text/html', content },
					truncated: false
				} as unknown as MailMessage;
				setupTest(<HtmlMessageRenderer message={message} />);
				const { root } = shadowAccess();
				const result =
					'Contact me at &lt;<a href="mailto:用户@例子.测试?cc=other@example.com&amp;bcc=hidden@example.com" target="_blank" rel="noopener noreferrer">mailto:用户@例子.测试?cc=other@example.com&amp;bcc=hidden@example.com</a>&gt;';
				expect(root.innerHTML).toContain(result);
			});
		});
	});

	describe('Telephone number handling (HtmlMessageRenderer)', () => {
		it('converts telephone numbers into links', () => {
			const content = 'Call me at +1234567890';
			const message = {
				id: '1',
				body: { contentType: 'text/html', content },
				truncated: false
			} as unknown as MailMessage;
			setupTest(<HtmlMessageRenderer message={message} />);
			const { getByRole } = shadowAccess();

			const link = getByRole('link');
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute('href', 'tel:+1234567890');
			expect(link).toHaveAttribute('target', '_blank');
			expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		});

		it('converts telephone numbers with special characters into links', () => {
			const content = 'Call me at +1 (234) 567-8900';
			const message = {
				id: '1',
				body: { contentType: 'text/html', content },
				truncated: false
			} as unknown as MailMessage;
			setupTest(<HtmlMessageRenderer message={message} />);
			const { getByRole } = shadowAccess();
			expect(getByRole('link')).toBeInTheDocument();
			expect(getByRole('link')).toHaveAttribute('href', 'tel:+12345678900');
		});
	});
});
