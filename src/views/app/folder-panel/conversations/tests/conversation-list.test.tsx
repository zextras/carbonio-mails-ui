/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import { generateFolder } from '../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest, triggerLoadMore } from '../../../../../carbonio-ui-commons/test/test-setup';
import { updateConversationsResultsLoadingStatus } from '../../../../../store/emails/store';
import {
	generateConversationFromAPI,
	generateConvMessageFromAPI
} from '../../../../../tests/generators/api';
import { SearchRequest, SearchResponse } from '../../../../../types';
import { makeAllItemsVisible } from '../../../../settings/filters/tests/test-utils';
import { ConversationList } from '../conversation-list';

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));
describe('ConversationList Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		const folderId = '2';
		(useParams as jest.Mock).mockReturnValue({
			folderId
		});
		populateFoldersStore({
			customFolders: [generateFolder({ id: folderId })]
		});
	});
	it('renders without crashing when there are no conversations', async () => {
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [],
			more: false
		});
		updateConversationsResultsLoadingStatus('fulfilled');

		setupTest(<ConversationList />);

		await act(async () => {
			expect(screen.getByText('displayer.list_folder_title')).toBeInTheDocument();
		});
	});

	it('displays a list of conversations', async () => {
		const message = generateConvMessageFromAPI({ id: '1', l: '2' });
		const conversation1 = generateConversationFromAPI({ id: '-1', m: [message] });
		const conversation2 = generateConversationFromAPI({ id: '-2', m: [message] });
		const conversation3 = generateConversationFromAPI({ id: '-3', m: [message] });
		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1, conversation2, conversation3],
			more: false
		});

		setupTest(<ConversationList />);

		expect((await screen.findAllByTestId('conversation-invisible-item')).length).toBe(3);
	});

	const conversation1Subject = 'conversation 1 subject';
	it('loads more conversations when reaching bottom of the list', async () => {
		const conversation1 = generateConversationFromAPI({
			id: '1',
			m: [generateConvMessageFromAPI({ id: '1', l: '2', cid: '1' })],
			su: conversation1Subject
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1],
			more: true
		});

		await act(async () => {
			setupTest(<ConversationList />);
		});

		makeAllItemsVisible();

		expect(screen.getByText(/conversation 1 subject/i)).toBeInTheDocument();

		const conversation2 = generateConversationFromAPI({
			id: '2',
			m: [generateConvMessageFromAPI({ id: '2', l: '2', cid: '2' })],
			su: 'conversation 2 subject'
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation2],
			more: false
		});

		await act(async () => {
			triggerLoadMore();
		});

		makeAllItemsVisible();

		expect(screen.getByText(/conversation 1 subject/i)).toBeInTheDocument();
		await waitFor(() => {
			expect(screen.getByText(/conversation 2 subject/i)).toBeInTheDocument();
		});
	});

	it('list-bottom-element should not be in the document when there are no more conversations', async () => {
		const conversation1 = generateConversationFromAPI({
			id: '1',
			m: [generateConvMessageFromAPI({ id: '1', l: '2', cid: '1' })],
			su: conversation1Subject
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1],
			more: false
		});

		await act(async () => {
			setupTest(<ConversationList />);
		});

		makeAllItemsVisible();

		expect(screen.getByText(/conversation 1 subject/i)).toBeInTheDocument();
		expect(screen.queryByTestId('list-bottom-element')).not.toBeInTheDocument();
	});

	it('list-bottom-element should be in the document when there are more conversations', async () => {
		const conversation1 = generateConversationFromAPI({
			id: '1',
			m: [generateConvMessageFromAPI({ id: '1', l: '2', cid: '1' })],
			su: conversation1Subject
		});

		createSoapAPIInterceptor<SearchRequest, SearchResponse>('Search', {
			c: [conversation1],
			more: true
		});

		await act(async () => {
			setupTest(<ConversationList />);
		});

		makeAllItemsVisible();

		expect(screen.getByText(/conversation 1 subject/i)).toBeInTheDocument();
		expect(screen.getByTestId('list-bottom-element')).toBeInTheDocument();
	});
});
