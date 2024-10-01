/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';

import { HtmlMessageRenderer } from './html-message-renderer';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { useAppSelector } from '../../hooks/redux';
import { selectMessage } from '../../store/messages-slice';
import { updateMessages, useMessageById } from '../../store/zustand/search/store';
import { generateCompleteMessageFromAPI } from '../../tests/generators/api';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import { BodyPart, GetMsgRequest, GetMsgResponse } from '../../types';

describe('HTML message renderer', () => {
	describe('Message too large banner', () => {
		it('should display banner if body truncated', async () => {
			const store = generateStore();
			const body: BodyPart = {
				content: 'This content is trunc',
				contentType: 'text/html',
				truncated: true
			};

			setupTest(<HtmlMessageRenderer msgId={'1'} body={body} parts={[]} participants={[]} />, {
				store
			});

			expect(await screen.findByText('warningBanner.truncatedMessage.label')).toBeVisible();
		});
		it('should not display banner if body not truncated', async () => {
			const store = generateStore();
			const body: BodyPart = {
				content: 'This content is not truncated',
				contentType: 'text/html',
				truncated: false
			};

			setupTest(<HtmlMessageRenderer msgId={'1'} body={body} parts={[]} participants={[]} />, {
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
			const body: BodyPart = {
				content: 'This content is trunc',
				contentType: 'text/html',
				truncated: true
			};

			const { user } = setupTest(
				<HtmlMessageRenderer msgId={'1'} body={body} parts={[]} participants={[]} />,
				{ store }
			);

			const loadMessageButton = await screen.findByText('warningBanner.truncatedMessage.button');
			await act(async () => {
				await user.click(loadMessageButton);
			});

			const request = await interceptor;
			expect(request.m.id).toBe('1');
		});
	});

	describe('should remove message too large banner after clicking load message', () => {
		it('when in search module', async () => {
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

			const { result } = renderHook(() => useMessageById('1'));

			const { user } = setupTest(
				<HtmlMessageRenderer msgId={'1'} body={result.current.body} parts={[]} participants={[]} />,
				{
					initialEntries: ['/search'],
					store
				}
			);

			const loadMessageButton = await screen.findByText('warningBanner.truncatedMessage.button');
			await act(async () => {
				await user.click(loadMessageButton);
			});

			await interceptor;
			await waitFor(() => {
				expect(result.current.body.content).toBe('Updated content');
			});
		});
		it('when in mails module', async () => {
			const message = generateMessage({ id: '1', body: 'Initial body', truncated: true });

			const store = generateStore({
				messages: { messages: [message], searchedInFolder: {}, searchRequestStatus: 'fulfilled' }
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
			const Wrapper = ({ children }: { children: React.JSX.Element }): React.JSX.Element => (
				<Provider store={store}>{children}</Provider>
			);
			const { result } = renderHook(() => useAppSelector((state) => selectMessage(state, '1')), {
				wrapper: Wrapper
			});

			const initialMessage = store.getState().messages.messages[0];
			const { user } = setupTest(
				<HtmlMessageRenderer msgId={'1'} body={initialMessage.body} parts={[]} participants={[]} />,

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
			jest.advanceTimersByTime(1000);
			await waitFor(() => {
				expect(result.current.body.content).toBe('Updated content');
			});
		});
	});
});
