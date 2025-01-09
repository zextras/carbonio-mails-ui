/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';

import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { updateConversationsResultsLoadingStatus } from '../../../../../store/emails/store';
import {
	generateConversationFromAPI,
	generateConvMessageFromAPI
} from '../../../../../tests/generators/api';
import { SearchRequest, SearchResponse } from '../../../../../types';
import { ConversationList } from '../conversation-list';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));
describe('ConversationList Component', () => {
	it('renders without crashing when there are no covnersations', async () => {
		populateFoldersStore();
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [],
			more: false
		});
		(useParams as jest.Mock).mockReturnValue({
			folderId: '2'
		});
		updateConversationsResultsLoadingStatus('fulfilled');
		setupTest(
			<MemoryRouter>
				<ConversationList />
			</MemoryRouter>
		);
		await act(async () => {
			expect(screen.getByText('displayer.list_folder_title')).toBeInTheDocument();
		});
	});

	it('displays a list of conversations', async () => {
		populateFoldersStore();

		const message = generateConvMessageFromAPI({ id: '1', l: '2' });
		const conversation1 = generateConversationFromAPI({ id: '-1', m: [message] });
		const conversation2 = generateConversationFromAPI({ id: '-2', m: [message] });
		const conversation3 = generateConversationFromAPI({ id: '-3', m: [message] });
		populateFoldersStore();
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1, conversation2, conversation3],
			more: false
		});
		(useParams as jest.Mock).mockReturnValue({
			folderId: '2'
		});

		setupTest(
			<MemoryRouter>
				<ConversationList />
			</MemoryRouter>
		);
		expect((await screen.findAllByTestId('invisible-item')).length).toBe(3);
	});
});
