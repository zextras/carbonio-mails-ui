/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from react;
import { screen, waitFor } from '@testing-library/react';

import {
	FOLDERS,
	populateFoldersStore,
	setupTest,
	tags,
	useTags
} from '@zextras/carbonio-ui-commons';
import { API_REQUEST_STATUS } from '../../../../../constants';
import { populateConversationInEmailStore } from '../../../../../tests/generators/generateConversation';
import { useTagExist } from '../../../../../ui-actions/tag-actions';
import { SearchConversationListItemCore } from '../search-conversation-list-item-core';

jest.mock('../../../../../carbonio-ui-commons/store/zustand/tags', () => ({
	useTags: jest.fn()
}));
jest.mock('../../../../../ui-actions/tag-actions', () => ({
	useTagExist: jest.fn()
}));

const mockToggle = jest.fn();
const tagsArray = Object.values(tags);

describe('SearchConversationListItemCore', () => {
	beforeEach(() => {
		jest.clearAllMocks();
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
		const mockSetOpen = jest.fn();

		const { user } = setupTest(
			<SearchConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				toggle={mockToggle}
				open={false}
				setOpen={mockSetOpen}
				conversationStatus={API_REQUEST_STATUS.fulfilled}
				parent={FOLDERS.INBOX}
			/>
		);

		const expandButton = await screen.findByTestId('ToggleExpand');
		await user.click(expandButton);

		await waitFor(() => {
			expect(mockSetOpen).toHaveBeenCalledTimes(1);
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

	describe('Tag Icon', () => {
		it('adds tag with color from ZIMBRA_STANDARD_COLORS when tag id is included in conversation tags and tag exists in store', async () => {
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '123', tags: ['tag1'], subject: 'Test Subject' },
					conversationMessagesNumber: 3
				})
			);

			(useTagExist as jest.Mock).mockReturnValue(true);

			const tagsFromStore = [
				{ id: 'tag1', name: 'Tag 1', color: 0 },
				{ id: 'tag2', name: 'Tag 2', color: 0 }
			];
			(useTags as jest.Mock).mockReturnValue(tagsFromStore);

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

			expect(screen.getByTestId('TagIcon')).toBeInTheDocument();
		});

		it('adds tag with default color when tag id is not included in conversation tags but has nil: prefix', async () => {
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '123', tags: ['nil:tag2'], subject: 'Test Subject' },
					conversationMessagesNumber: 3
				})
			);

			(useTagExist as jest.Mock).mockReturnValue(true);

			const tagsFromStore = [{ id: 'tag1', name: 'Tag 1', color: 0 }];
			(useTags as jest.Mock).mockReturnValue(tagsFromStore);

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

			expect(screen.getByTestId('TagIcon')).toBeInTheDocument();
		});
	});
});
