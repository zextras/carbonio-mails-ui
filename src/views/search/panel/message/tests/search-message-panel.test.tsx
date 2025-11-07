/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { NavigateFunction, useParams } from 'react-router-dom';

import { setupTest, screen } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { generateMessage, populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { API_REQUEST_STATUS } from 'constants/index';
import { setSearchResultsByMessage, updateMessageStatus } from 'store/emails/store';
import { SearchMessagePanel } from 'views/search/panel/message/search-message-panel';

const mockNavigateSpy = jest.fn();

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn(),
	useNavigate: (): NavigateFunction => mockNavigateSpy
}));

describe('Message Panel', () => {
	it('should render a message when status fulfilled', async () => {
		(useParams as jest.Mock).mockReturnValue({ messageId: '1' });
		setSearchResultsByMessage(
			[
				generateMessage({
					id: '1',
					isComplete: true,
					subject: 'Test subject',
					body: 'Test Message body'
				})
			],
			false
		);

		await waitFor(() => {
			updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		});

		createSoapAPIInterceptor('MsgAction', {});

		setupTest(<SearchMessagePanel messageId="1" />);

		expect(await screen.findByTestId('MessagePanel-1')).toBeVisible();
		expect(await screen.findByText('Test subject')).toBeInTheDocument();
		expect(await screen.findByText('Test Message body')).toBeInTheDocument();
	});
	it('should redirect when messageStatus is error', async () => {
		const messages = await act(() => populateMessagesInEmailStore());
		act(() => updateMessageStatus(messages[0].id, API_REQUEST_STATUS.error));

		createSoapAPIInterceptor('MsgAction', {});

		setupTest(<SearchMessagePanel messageId={messages[0].id} />, {
			initialEntries: [`/message/${messages[0].id}`],
			path: '/message/:messageId'
		});

		expect(mockNavigateSpy).toHaveBeenCalledWith('/search', { replace: true });
	});
});
