/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { useTags } from '../../../../../carbonio-ui-commons/store/zustand/tags';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { tags } from '../../../../../carbonio-ui-commons/test/mocks/tags/tags';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../../constants';
import { populateConversationInEmailStore } from '../../../../../tests/generators/generateConversation';
import { SearchConversationListItemCore } from '../search-conversation-list-item-core';

jest.mock('../../../../../carbonio-ui-commons/store/zustand/tags', () => ({
	useTags: jest.fn()
}));

const mockToggle = jest.fn();
const tagsArray = Object.values(tags);

describe('ConversationListItemCore', () => {
	beforeEach(() => {
		(useTags as jest.Mock).mockReturnValue(tags);
	});

	it('renders conversation details correctly', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();
		setupTest(
			<SearchConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				toggle={mockToggle}
				open={false}
				setOpen={jest.fn()}
				conversationStatus={API_REQUEST_STATUS.fulfilled}
				parent={FOLDERS.INBOX}
			/>
		);

		expect(await screen.findByText('Test Subject')).toBeInTheDocument();
		expect(await screen.findByTestId('conversation-messages-count-123')).toHaveTextContent('3');
	});

	it('displays unread status correctly', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();

		setupTest(
			<SearchConversationListItemCore
				conversation={{ ...conversation, read: false }}
				selected={false}
				selecting={false}
				toggle={mockToggle}
				open={false}
				setOpen={jest.fn()}
				conversationStatus={API_REQUEST_STATUS.fulfilled}
				parent={FOLDERS.INBOX}
			/>
		);

		expect(screen.getByText('Test Subject')).toHaveStyle('font-weight: 700');
	});

	it('calls toggleOpen when expand button is clicked', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();
		const mockSsetOpen = jest.fn();

		const { user } = setupTest(
			<SearchConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				toggle={mockToggle}
				open={false}
				setOpen={mockSsetOpen}
				conversationStatus={API_REQUEST_STATUS.fulfilled}
				parent={FOLDERS.INBOX}
			/>
		);

		const expandButton = await screen.findByTestId('ToggleExpand');
		await user.click(expandButton);

		await waitFor(() => {
			expect(mockSsetOpen).toHaveBeenCalledTimes(1);
		});
	});

	it('shows urgent icon if conversation is urgent', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();

		setupTest(
			<SearchConversationListItemCore
				conversation={{ ...conversation, urgent: true }}
				selected={false}
				selecting={false}
				toggle={mockToggle}
				open={false}
				setOpen={jest.fn()}
				conversationStatus={API_REQUEST_STATUS.fulfilled}
				parent={FOLDERS.INBOX}
			/>
		);

		expect(screen.getByTestId('UrgentIcon')).toBeInTheDocument();
	});

	it('renders the avatar with correct data-testid', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();

		setupTest(
			<SearchConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				toggle={mockToggle}
				open={false}
				setOpen={jest.fn()}
				conversationStatus={API_REQUEST_STATUS.fulfilled}
				parent={FOLDERS.INBOX}
			/>
		);

		expect(screen.getByTestId('conversation-list-item-avatar-123')).toBeInTheDocument();
	});
});
