/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { HtmlMessageRenderer } from './html-message-renderer';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { updateMessages, useMessageById } from '../../store/zustand/search/store';
import { generateCompleteMessageFromAPI } from '../../tests/generators/api';
import { generateMessage } from '../../tests/generators/generateMessage';
import { BodyPart, GetMsgRequest, GetMsgResponse } from '../../types';

describe('HTML message renderer', () => {
	describe('Message too large banner', () => {
		it('should display banner if body truncated', async () => {
			const body: BodyPart = {
				content: 'This content is trunc',
				contentType: 'text/html',
				truncated: true
			};

			setupTest(<HtmlMessageRenderer msgId={'1'} body={body} parts={[]} participants={[]} />);

			expect(await screen.findByText('warningBanner.truncatedMessage.label')).toBeVisible();
		});
		it('should not display banner if body not truncated', async () => {
			const body: BodyPart = {
				content: 'This content is not truncated',
				contentType: 'text/html',
				truncated: false
			};

			setupTest(<HtmlMessageRenderer msgId={'1'} body={body} parts={[]} participants={[]} />);

			expect(screen.queryByText('warningBanner.truncatedMessage.label')).not.toBeInTheDocument();
		});

		it('should call GetMsg API when clicking load message', async () => {
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
				<HtmlMessageRenderer msgId={'1'} body={body} parts={[]} participants={[]} />
			);

			const loadMessageButton = await screen.findByText('warningBanner.truncatedMessage.button');
			await act(async () => {
				await user.click(loadMessageButton);
			});

			const request = await interceptor;
			expect(request.m.id).toBe('1');
		});
	});

	it('should remove message too large banner after clicking load message', async () => {
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
				initialEntries: ['/search']
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
});
