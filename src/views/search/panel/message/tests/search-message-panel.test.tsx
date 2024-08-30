/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { screen, setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../../constants';
import {
	setSearchResultsByMessage,
	updateMessageStatus
} from '../../../../../store/zustand/search/store';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { generateStore } from '../../../../../tests/generators/store';
import { SearchMessagePanel } from '../search-message-panel';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

describe('Message Panel', () => {
	let store: ReturnType<typeof generateStore>;

	beforeEach(() => {
		store = generateStore();
	});

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
		updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);

		setupTest(<SearchMessagePanel />, { store });

		expect(await screen.findByTestId('MessagePanel-1')).toBeVisible();
		expect(await screen.findByText('Test subject')).toBeInTheDocument();
		expect(await screen.findByText('Test Message body')).toBeInTheDocument();
	});
});
