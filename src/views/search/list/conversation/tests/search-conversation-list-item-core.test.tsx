/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { useTheme } from '@zextras/carbonio-design-system';
import { FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';

import { setupHook, setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { tags } from '@test-utils/tags/tags';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { SearchConversationListItemCore } from 'views/search/list/conversation/search-conversation-list-item-core';

const tagsArray = Object.values(tags);

describe('SearchConversationListItemCore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders a conversation without tags (GetConv leaves tn out)', async () => {
		const { conversation } = await waitFor(() =>
			populateConversationInEmailStore({ conversationParams: { id: '123', subject: 'No tags' } })
		);
		const { tags: _tags, ...withoutTags } = conversation;
		populateFoldersStore();
		setupTest(
			<SearchConversationListItemCore
				conversation={withoutTags}
				selected={false}
				selecting={false}
				open={false}
				toggleCollapseElementCallback={vi.fn()}
				parent={FOLDERS.INBOX}
				index={0}
				onSelect={vi.fn()}
			/>
		);

		expect(await screen.findByText('No tags')).toBeInTheDocument();
		expect(screen.queryByTestId('tag-pill')).not.toBeInTheDocument();
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

	describe('tags', () => {
		const renderWithTags = async (conversationTags: Array<string>): Promise<void> => {
			const { conversation } = await waitFor(() =>
				populateConversationInEmailStore({
					conversationParams: { id: '123', tags: conversationTags, subject: 'Test Subject' },
					conversationMessagesNumber: 3
				})
			);
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
		};

		it('shows a pill for each tag of the conversation that is in the store', async () => {
			useTagStore.setState({
				tags: {
					tag1: { id: 'tag1', name: 'Tag 1', color: 1 },
					tag2: { id: 'tag2', name: 'Tag 2', color: 5 }
				}
			});

			await renderWithTags(['tag1']);

			expect(screen.getAllByTestId('tag-pill').map((pill) => pill.textContent)).toEqual(['Tag 1']);
		});

		it('shows a tag set by the owner of a shared folder as a shared pill', async () => {
			useTagStore.setState({ tags: { tag1: { id: 'tag1', name: 'Tag 1', color: 0 } } });

			await renderWithTags(['nil:tag2']);

			expect(screen.getByTestId('tag-pill')).toHaveTextContent('tag2');
			expect(screen.getByTestId('icon: PeopleOutline')).toBeInTheDocument();
		});

		it('tints the pill with the custom colour of the tag', async () => {
			useTagStore.setState({ tags: { t1: { id: 't1', name: 'custom', rgb: '#abcdef' } } });

			await renderWithTags(['t1']);

			expect(screen.getByTestId('tag-dot')).toHaveStyle({ 'background-color': '#abcdef' });
		});
	});
});
