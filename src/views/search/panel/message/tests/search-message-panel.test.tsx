/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, waitFor } from '@testing-library/react';
import { NavigateFunction, useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { setupTest, screen } from '@test-setup';
import { generateMessage, populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { API_REQUEST_STATUS } from 'constants/index';
import { setSearchResultsByMessage, updateMessageStatus } from 'store/emails/store';
import { SearchMessagePanel } from 'views/search/panel/message/search-message-panel';

const mockNavigateSpy = vi.fn();

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: vi.fn(),
	useNavigate: (): NavigateFunction => mockNavigateSpy
}));

describe('Message Panel', () => {
	it('should render a message when status fulfilled', async () => {
		(useParams as Mock).mockReturnValue({ messageId: '1' });
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

		setupTest(<SearchMessagePanel messageId="1" />);

		expect(await screen.findByTestId('MessagePanel-1')).toBeVisible();
		expect(await screen.findByText('Test subject')).toBeInTheDocument();
		expect(await screen.findByText('Test Message body')).toBeInTheDocument();
	});
	it('should redirect when messageStatus is error', async () => {
		const messages = await act(() => populateMessagesInEmailStore());
		await act(() => updateMessageStatus(messages[0].id, 'error'));

		setupTest(<SearchMessagePanel messageId={messages[0].id} />, {
			initialEntries: [`/message/${messages[0].id}`],
			path: '/message/:messageId'
		});

		expect(mockNavigateSpy).toHaveBeenCalledWith('/search', { replace: true });
	});
});
