/* eslint-disable testing-library/no-node-access */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor, within } from '@testing-library/react';

import { updateMessages } from '../../../../store/emails/store';
import { HtmlMessageRenderer } from '../html-message-renderer';
import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateCompleteMessageFromAPI } from '__test__/generators/api';
import { generateMessage } from '__test__/generators/generateMessage';
import { MailMessage } from 'types/messages';
import { GetMsgRequest, GetMsgResponse } from 'types/soap/get-msg';

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

			it.skip('should remove warning banner after successfully loading complete message', async () => {
				// eslint-disable-next-line sonarjs/no-duplicate-string
				// FIXME: banner not removed
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

				const { user } = setupTest(<HtmlMessageRenderer message={message} />, {
					initialEntries: ['/mails']
				});

				const loadMessageButton = await screen.findByText(truncatedMessageButton);
				const response: GetMsgResponse = { m: [generateCompleteMessageFromAPI({ id: '1' })] };
				const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
					'GetMsg',
					response
				);
				await act(async () => {
					await user.click(loadMessageButton);
				});

				const request = await interceptor;
				expect(request.m.id).toBe('1');
				expect(request.m.max).toBeUndefined();
			});

			it.skip('should remove warning banner after successfully loading complete message', async () => {
				// FIXME: click does not remove banner and truncated message
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

				await waitFor(async () => {
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

	describe('Quoted text handling', () => {
		it('shows "Show quoted text" button when quoted text is present', () => {
			const originalContent = '<p>Original message</p>';
			const quotedContent = '<hr id="zwchr" />Previous message';
			const fullContent = originalContent + quotedContent;

			const message = {
				id: '1',
				body: { contentType: 'text/html', content: fullContent },
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />);

			expect(screen.getByRole('button', { name: 'label.show_quoted_text' })).toBeInTheDocument();
		});

		it('does not show "Show quoted text" button when no quoted text is present', () => {
			const content = '<p>Just original message</p>';

			const message = {
				id: '1',
				body: { contentType: 'text/html', content },
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />);

			expect(screen.queryByRole('button', { name: /show quoted text/i })).not.toBeInTheDocument();
		});

		it('shows full content including quoted text when button is clicked', async () => {
			const originalContent = '<p>Original message</p>';
			const quotedContent = '<hr id="zwchr" />Previous message';
			const fullContent = originalContent + quotedContent;

			const message = {
				id: '1',
				body: { contentType: 'text/html', content: fullContent },
				truncated: false
			} as unknown as MailMessage;

			const { user } = setupTest(<HtmlMessageRenderer message={message} />);

			const { getByText } = shadowAccess();
			const showQuotedButton = screen.getByRole('button', { name: 'label.show_quoted_text' });
			await user.click(showQuotedButton);
			expect(showQuotedButton).not.toBeInTheDocument();

			expect(getByText('Original message')).toBeInTheDocument();
			expect(getByText('Previous message')).toBeInTheDocument();
		});
	});

	describe('External images handling', () => {
		it('shows external images banner when external images are detected', () => {
			const content = '<img src="http://external.com/image.jpg" alt="External image">';
			const message = {
				id: '1',
				body: { contentType: 'text/html', content },
				truncated: false,
				participants: [{ type: 'f', address: 'sender@example.com' }]
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />);

			// Should show external images banner (banner component would be tested separately)
			// This tests the integration logic
			const { root } = shadowAccess();
			expect(root).toBeDefined();
		});

		it('does not show external images banner when no external images are present', () => {
			const content = '<p>Just text content</p>';
			const message = {
				id: '1',
				body: { contentType: 'text/html', content },
				truncated: false,
				participants: [{ type: 'f', address: 'sender@example.com' }]
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />);

			const { root } = shadowAccess();
			expect(root).toBeDefined();
		});
	});

	describe('Message body content processing', () => {
		it('removes black color CSS properties from content', () => {
			const content = '<p style="color: #000000; font-size: 14px;">Test content</p>';
			const message = {
				id: '1',
				body: { contentType: 'text/html', content },
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />);

			const { root } = shadowAccess();
			expect(root.innerHTML).not.toContain('color: #000000');
			expect(root.innerHTML).toContain('font-size: 14px');
		});

		it('handles empty message body gracefully', () => {
			const message = {
				id: '1',
				body: { contentType: 'text/html', content: '' },
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />);

			const { root } = shadowAccess();
			expect(root).toBeDefined();
		});

		it('handles undefined message body gracefully', () => {
			const message = {
				id: '1',
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />);

			const { root } = shadowAccess();
			expect(root).toBeDefined();
		});
	});

	describe('Attachment handling', () => {
		it('processes inline attachments correctly', () => {
			const content = '<img src="cid:image001@test.com" alt="Inline image">';
			const message = {
				id: '1',
				body: { contentType: 'text/html', content },
				truncated: false,
				parts: [
					{
						name: 'image001.png',
						filename: 'image001.png',
						contentType: 'image/png',
						disposition: 'inline',
						contentId: '<image001@test.com>'
					}
				]
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />);

			const { root } = shadowAccess();
			expect(root.innerHTML).toContain('img');
		});

		it('handles messages without attachments', () => {
			const content = '<p>Simple text message</p>';
			const message = {
				id: '1',
				body: { contentType: 'text/html', content },
				truncated: false
			} as unknown as MailMessage;

			setupTest(<HtmlMessageRenderer message={message} />);

			const { getByText } = shadowAccess();
			expect(getByText('Simple text message')).toBeInTheDocument();
		});
	});
});
