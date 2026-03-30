/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { useTheme } from '@zextras/carbonio-design-system';
import { FOLDERS, useTags } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { setupHook, setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { tags } from '@test-utils/tags/tags';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { useTagExist } from 'ui-actions/tag-actions';
import { SearchConversationListItemCore } from 'views/search/list/conversation/search-conversation-list-item-core';

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	useTags: vi.fn()
}));
vi.mock('../../../../../ui-actions/tag-actions', () => ({
	useTagExist: vi.fn()
}));

const tagsArray = Object.values(tags);

describe('SearchConversationListItemCore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
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
				open={false}
				toggleCollapseElementCallback={vi.fn()}
				parent={FOLDERS.INBOX}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(await screen.findByText('Test Subject')).toBeInTheDocument();
		expect(await screen.findByTestId('FolderBadge')).toHaveTextContent('3');
	});

	it('displays unread status correctly', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();

		const {
			result: { current: theme }
		} = setupHook(useTheme);

		setupTest(
			<SearchConversationListItemCore
				conversation={{ ...conversation, read: false }}
				selected={false}
				selecting={false}
				open={false}
				toggleCollapseElementCallback={vi.fn()}
				parent={FOLDERS.INBOX}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(screen.getByText('Test Subject')).toHaveStyle({
			'font-weight': theme.fonts.weight.bold
		});
	});

	it('calls toggleOpen when expand button is clicked', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({
				conversationParams: { id: '123', tags: [tagsArray[0].name], subject: 'Test Subject' },
				conversationMessagesNumber: 3
			})
		);
		populateFoldersStore();
		const mockSetOpen = vi.fn();

		const { user } = setupTest(
			<SearchConversationListItemCore
				conversation={conversation}
				selected={false}
				selecting={false}
				open={false}
				toggleCollapseElementCallback={mockSetOpen}
				parent={FOLDERS.INBOX}
				index={0}
				onSelect={vi.fn()}
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
				open={false}
				toggleCollapseElementCallback={vi.fn()}
				parent={FOLDERS.INBOX}
				index={0}
				onSelect={vi.fn()}
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
				open={false}
				toggleCollapseElementCallback={vi.fn()}
				parent={FOLDERS.INBOX}
				index={0}
				onSelect={vi.fn()}
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

			(useTagExist as Mock).mockReturnValue(true);

			const tagsFromStore = [
				{ id: 'tag1', name: 'Tag 1', color: 0 },
				{ id: 'tag2', name: 'Tag 2', color: 0 }
			];
			(useTags as Mock).mockReturnValue(tagsFromStore);

			setupTest(
				<SearchConversationListItemCore
					conversation={conversation}
					selected={false}
					selecting={false}
					open={false}
					toggleCollapseElementCallback={vi.fn()}
					parent={FOLDERS.INBOX}
					index={0}
					onSelect={vi.fn()}
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

			(useTagExist as Mock).mockReturnValue(true);

			const tagsFromStore = [{ id: 'tag1', name: 'Tag 1', color: 0 }];
			(useTags as Mock).mockReturnValue(tagsFromStore);

			setupTest(
				<SearchConversationListItemCore
					conversation={conversation}
					selected={false}
					selecting={false}
					open={false}
					toggleCollapseElementCallback={vi.fn()}
					parent={FOLDERS.INBOX}
					index={0}
					onSelect={vi.fn()}
				/>
			);

			expect(screen.getByTestId('TagIcon')).toBeInTheDocument();
		});
	});
});
