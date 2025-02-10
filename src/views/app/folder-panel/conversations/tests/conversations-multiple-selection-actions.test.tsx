/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor, within } from '@testing-library/react';
import { map } from 'lodash';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { useTagStore } from '../../../../../carbonio-ui-commons/store/zustand/tags';
import { tags } from '../../../../../carbonio-ui-commons/test/mocks/tags/tags';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { updateConversations } from '../../../../../store/emails/store';
import { generateConversation } from '../../../../../tests/generators/generateConversation';
import { ConversationsMultipleSelectionActions } from '../conversations-multiple-selection-actions';

describe('ConversationsMultipleSelectionActions', () => {
	describe('Mark as read action', () => {
		it('should display "mark as unread" action if all selected items are read', async () => {
			await waitFor(() => {
				updateConversations([
					generateConversation({ id: '1', isRead: true }),
					generateConversation({ id: '2', isRead: true }),
					generateConversation({ id: '3', isRead: true })
				]);
			});
			setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>
			);

			expect(screen.getByTestId('icon: EmailOutline')).toBeVisible();
		});
		it('should display "mark as read" action if any selected items is unread', async () => {
			await act(async () => {
				updateConversations([
					generateConversation({ id: '1', isRead: true }),
					generateConversation({ id: '2', isRead: false }),
					generateConversation({ id: '3', isRead: true })
				]);
			});

			setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>
			);

			expect(screen.getByTestId('icon: EmailReadOutline')).toBeVisible();
		});
	});
	describe('Delete action', () => {
		it('should display "delete" action', async () => {
			await act(async () => {
				updateConversations([
					generateConversation({ id: '1' }),
					generateConversation({ id: '2' }),
					generateConversation({ id: '3' })
				]);
			});
			setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>
			);

			expect(screen.getByTestId('icon: Trash2Outline')).toBeVisible();
		});
	});
	describe('More actions', () => {
		it('should contain "add flag" action if at least one conversation is not flagged', async () => {
			await act(async () => {
				updateConversations([
					generateConversation({ id: '1', isFlagged: true }),
					generateConversation({ id: '2', isFlagged: false }),
					generateConversation({ id: '3', isFlagged: true })
				]);
			});
			const { user } = setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>
			);
			const moreActionIcon = screen.getByTestId('icon: MoreVertical');
			await user.click(moreActionIcon);

			const actionsDropdown = screen.getByTestId('dropdown-popper-list');
			expect(within(actionsDropdown).getByTestId('icon: FlagOutline')).toBeVisible();
		});
		it('should contain "remove flag" action if all conversations are flagged', async () => {
			updateConversations([
				generateConversation({ id: '1', isFlagged: true }),
				generateConversation({ id: '2', isFlagged: true }),
				generateConversation({ id: '3', isFlagged: true })
			]);
			const { user } = setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>
			);
			const moreActionIcon = screen.getByTestId('icon: MoreVertical');
			await user.click(moreActionIcon);

			const actionsDropdown = screen.getByTestId('dropdown-popper-list');
			expect(within(actionsDropdown).getByTestId('icon: Flag')).toBeVisible();
		});
		it('should contain "move" action', async () => {
			updateConversations([
				generateConversation({ id: '1' }),
				generateConversation({ id: '2' }),
				generateConversation({ id: '3' })
			]);
			const { user } = setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>
			);
			const moreActionIcon = screen.getByTestId('icon: MoreVertical');
			await user.click(moreActionIcon);

			const actionsDropdown = screen.getByTestId('dropdown-popper-list');
			expect(within(actionsDropdown).getByTestId('icon: MoveOutline')).toBeVisible();
		});
		it('should contain "delete permanently" action when in trash folder', async () => {
			await act(async () => {
				updateConversations([
					generateConversation({ id: '1' }),
					generateConversation({ id: '2' }),
					generateConversation({ id: '3' })
				]);
			});
			setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={FOLDERS.TRASH}
				/>
			);

			expect(screen.getByTestId('icon: DeletePermanentlyOutline')).toBeVisible();
		});
		it('should contain "mark as spam" action', async () => {
			updateConversations([
				generateConversation({ id: '1' }),
				generateConversation({ id: '2' }),
				generateConversation({ id: '3' })
			]);
			const { user } = setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>
			);
			const moreActionIcon = screen.getByTestId('icon: MoreVertical');
			await user.click(moreActionIcon);

			const actionsDropdown = screen.getByTestId('dropdown-popper-list');
			expect(await within(actionsDropdown).findByText('Mark as spam')).toBeVisible();
		});
		it('should contain "mark as not spam" action when a conversation is in spam folder', async () => {
			updateConversations([
				generateConversation({ id: '1' }),
				generateConversation({ id: '2' }),
				generateConversation({ id: '3' })
			]);
			const { user } = setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={FOLDERS.SPAM}
				/>
			);
			const moreActionIcon = screen.getByTestId('icon: MoreVertical');
			await user.click(moreActionIcon);

			const actionsDropdown = screen.getByTestId('dropdown-popper-list');
			expect(await within(actionsDropdown).findByText('Not spam')).toBeVisible();
		});
		it('should contain "tag" submenu item', async () => {
			const tagItems = map(tags, (tag) => tag.name);
			updateConversations([
				generateConversation({ id: '1', tags: tagItems }),
				generateConversation({ id: '2', tags: tagItems }),
				generateConversation({ id: '3' })
			]);
			useTagStore.setState({ tags });
			const { user } = setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={FOLDERS.INBOX}
				/>
			);
			const moreActionIcon = screen.getByTestId('icon: MoreVertical');
			await user.click(moreActionIcon);

			const actionsDropdown = screen.getByTestId('dropdown-popper-list');
			expect(within(actionsDropdown).getByTestId('icon: TagsMoreOutline')).toBeVisible();
		});
	});
});
