/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import { HtmlMessageRenderer } from './html-message-renderer';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { updateMessages } from '../../store/zustand/search/store';
import { generateCompleteMessageFromAPI } from '../../tests/generators/api';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import { GetMsgRequest, GetMsgResponse } from '../../types';

describe('HTML message renderer', () => {
	describe('Search Module', () => {
		describe('Message too large banner', () => {
			it('should display banner if body truncated', async () => {
				const store = generateStore();
				const message = generateMessage({
					id: '1',
					body: 'Test',
					truncated: true
				});
				updateMessages([message]);

				setupTest(<HtmlMessageRenderer msgId={'1'} />, {
					initialEntries: ['/search'],
					store
				});

				expect(await screen.findByText('warningBanner.truncatedMessage.label')).toBeVisible();
			});

			it('should not display banner if body not truncated', async () => {
				const store = generateStore();
				const message = generateMessage({
					id: '1',
					body: 'Test',
					truncated: false
				});
				updateMessages([message]);

				setupTest(<HtmlMessageRenderer msgId={'1'} />, {
					initialEntries: ['/search'],
					store
				});

				expect(screen.queryByText('warningBanner.truncatedMessage.label')).not.toBeInTheDocument();
			});

			it('should call GetMsg API when clicking load message', async () => {
				const store = generateStore();
				const response: GetMsgResponse = {
					m: [generateCompleteMessageFromAPI({ id: '1' })]
				};
				const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>(
					'GetMsg',
					response
				);
				const message = generateMessage({
					id: '1',
					body: 'Test',
					truncated: true
				});
				updateMessages([message]);

				const { user } = setupTest(<HtmlMessageRenderer msgId={'1'} />, {
					initialEntries: ['/search'],
					store
				});

				const loadMessageButton = await screen.findByText('warningBanner.truncatedMessage.button');
				await act(async () => {
					await user.click(loadMessageButton);
				});

				const request = await interceptor;
				expect(request.m.id).toBe('1');
				expect(request.m.max).not.toBeDefined();
			});
			it('should remove message too large banner after clicking load message', async () => {
				const store = generateStore();
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
									requiresSmartLinkConversion: false,
									truncated: false,
									content: 'Updated content'
								}
							]
						})
					]
				});

				const { user } = setupTest(<HtmlMessageRenderer msgId={'1'} />, {
					initialEntries: ['/search'],
					store
				});

				const loadMessageButton = await screen.findByText('warningBanner.truncatedMessage.button');
				await act(async () => {
					await user.click(loadMessageButton);
				});

				await interceptor;
				await waitFor(() => {
					expect(
						screen.queryByText('warningBanner.truncatedMessage.button')
					).not.toBeInTheDocument();
				});
			});
		});
	});

	describe('Mails Module', () => {
		it('should remove message too large banner after clicking load message', async () => {
			const message = generateMessage({ id: '1', body: 'Initial body', truncated: true });

			const store = generateStore({
				messages: {
					messages: { '1': message },
					searchedInFolder: {},
					searchRequestStatus: 'fulfilled'
				}
			});
			const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', {
				m: [
					generateCompleteMessageFromAPI({
						id: '1',
						mp: [
							{
								ct: 'text/html',
								part: '0',
								body: true,
								requiresSmartLinkConversion: false,
								truncated: false,
								content: 'Updated content'
							}
						]
					})
				]
			});

			const { user } = setupTest(
				<HtmlMessageRenderer msgId={'1'} />,

				{
					initialEntries: ['/mails'],
					store
				}
			);

			const loadMessageButton = await screen.findByText('warningBanner.truncatedMessage.button');
			await act(async () => {
				await user.click(loadMessageButton);
			});

			await interceptor;
			await waitFor(() => {
				expect(screen.queryByText('warningBanner.truncatedMessage.button')).not.toBeInTheDocument();
			});
		});
	});
});
