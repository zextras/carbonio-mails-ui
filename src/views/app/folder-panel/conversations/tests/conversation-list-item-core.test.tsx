/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import { useTags } from '@zextras/carbonio-ui-commons';
import { populateConversationInEmailStore } from '../../../../../tests/generators/generateConversation';
import { ConversationListItemCore } from '../conversation-list-item-core';
import { tags } from '@test-utils/tags/tags';
import { populateFoldersStore } from '@test-utils/store/folders';
import { setupTest } from '@test-setup';

jest.mock('@zextras/carbonio-ui-commons', () => ({
	...jest.requireActual('@zextras/carbonio-ui-commons'),
	useTags: jest.fn()
}));

const mockToggle = jest.fn();
const mockToggleOpen = jest.fn();
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
			<ConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				toggleMultipleSelection={mockToggle}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
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
			<ConversationListItemCore
				conversation={{ ...conversation, read: false }}
				selected={false}
				selecting={false}
				toggleMultipleSelection={mockToggle}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
			/>
		);

		expect(screen.getByText('Test Subject')).toHaveStyle('font-weight: 700');
	});

	it('calls toggleCollapseElementCallback when expand button is clicked', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();

		const { user } = setupTest(
			<ConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				toggleMultipleSelection={mockToggle}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
			/>
		);

		const expandButton = await screen.findByTestId('ToggleExpand');
		await user.click(expandButton);

		expect(mockToggleOpen).toHaveBeenCalledTimes(1);
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
			<ConversationListItemCore
				conversation={{ ...conversation, urgent: true }}
				selected={false}
				selecting={false}
				toggleMultipleSelection={mockToggle}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
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
			<ConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				toggleMultipleSelection={mockToggle}
				folderParent="inbox"
				open={false}
				toggleCollapseElementCallback={mockToggleOpen}
			/>
		);

		expect(screen.getByTestId('conversation-list-item-avatar-123')).toBeInTheDocument();
	});
});
