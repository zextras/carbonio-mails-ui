/* eslint-disable testing-library/no-node-access */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, within } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { HtmlMessageRenderer } from 'commons/mail-message-renderer/html-message-renderer';
import { updateMessages } from 'store/emails/store';
import { generateCompleteMessageFromAPI } from 'tests/generators/api';
import { generateMessage } from 'tests/generators/generateMessage';
import { GetMsgRequest, GetMsgResponse, MailMessage } from 'types/index.d';

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

	describe('URL Detection and Linking', () => {
		const testCases = [
			{
				description: 'HTTP URLs',
				content: 'Visit http://example.com',
				expectedHref: 'http://example.com'
			},
			{
				description: 'HTTPS URLs',
				content: 'Secure https://example.com',
				expectedHref: 'https://example.com'
			},
			{
				description: 'protocol-less www URLs',
				content: 'Visit www.example.com',
				expectedHref: 'http://www.example.com'
			},
			{
				description: 'URLs with query parameters',
				content: 'Search https://google.com?q=test',
				expectedHref: 'https://google.com?q=test'
			},
			{
				description: 'URLs with anchors/fragments',
				content: 'Jump to https://example.com#section',
				expectedHref: 'https://example.com#section'
			},
			{
				description: 'URLs with special characters',
				content: 'Visit https://example.com/path?param=value&another=param',
				expectedHref: 'https://example.com/path?param=value&another=param'
			},
			{
				description: 'URLs at the start of content',
				content: 'http://example.com is my site',
				expectedHref: 'http://example.com'
			},
			{
				description: 'URLs at the end of content',
				content: 'My site is http://example.com',
				expectedHref: 'http://example.com'
			},
			{
				description: 'URLs with underscores and parentheses',
				content: 'http://foo.com/blah_blah_(wikipedia)',
				expectedHref: 'http://foo.com/blah_blah_(wikipedia)'
			},
			{
				description: 'URLs with unicode domains',
				content: 'http://✪df.ws/123',
				expectedHref: 'http://✪df.ws/123'
			}
		];

		testCases.forEach(({ description, content, expectedHref }) => {
			it(`should convert ${description} into clickable links`, () => {
				setupTest(
					<HtmlMessageRenderer
						message={
							{
								id: '1',
								body: { contentType: 'text/html', content },
								truncated: false
							} as unknown as MailMessage
						}
					/>
				);

				const { getByRole } = shadowAccess();
				const link = getByRole('link');
				expect(link).toHaveAttribute('href', expectedHref);
				expect(link).toHaveAttribute('target', '_blank');
				expect(link).toHaveAttribute('rel', 'noopener noreferrer');
			});
		});

		it('should handle multiple URLs in the same text', () => {
			const content = 'Visit http://site1.com and https://site2.com';
			setupTest(
				<HtmlMessageRenderer
					message={
						{
							id: '1',
							body: { contentType: 'text/html', content },
							truncated: false
						} as unknown as MailMessage
					}
				/>
			);

			const { getAllByRole } = shadowAccess();
			const links = getAllByRole('link');
			expect(links).toHaveLength(2);
			expect(links[0]).toHaveAttribute('href', 'http://site1.com');
			expect(links[1]).toHaveAttribute('href', 'https://site2.com');
		});

		it('should not convert IP addresses into links', () => {
			const content = 'Localhost is at 127.0.0.1';
			setupTest(
				<HtmlMessageRenderer
					message={
						{
							id: '1',
							body: { contentType: 'text/html', content },
							truncated: false
						} as unknown as MailMessage
					}
				/>
			);

			const { queryByRole } = shadowAccess();
			expect(queryByRole('link')).not.toBeInTheDocument();

			const { root } = shadowAccess();
			expect(root?.textContent).toContain(content);
		});

		it('should handle URLs in complex HTML structures', () => {
			const content = `
        <div>
          <p>Check out <a href="https://existing-link.com">existing link</a></p>
          <p>New link: http://new-link.com</p>
        </div>
      `;

			setupTest(
				<HtmlMessageRenderer
					message={
						{
							id: '1',
							body: { contentType: 'text/html', content },
							truncated: false
						} as unknown as MailMessage
					}
				/>
			);

			const { getAllByRole } = shadowAccess();
			const links = getAllByRole('link');
			expect(links).toHaveLength(2);
			expect(links[0]).toHaveAttribute('href', 'https://existing-link.com');
			expect(links[1]).toHaveAttribute('href', 'http://new-link.com');
		});
	});
});
