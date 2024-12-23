/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { updateConversationsOnly } from '../../../../../store/zustand/emails/store';
import { generateConversation } from '../../../../../tests/generators/generateConversation';
import { generateStore } from '../../../../../tests/generators/store';
import { ConversationsMultipleSelectionActions } from '../conversations-multiple-selection-actions';

describe('ConversationsMultipleSelectionActions', () => {
	describe('Mark as read action', () => {
		it('should display "mark as unread" action if all selected items are read', () => {
			const store = generateStore();
			updateConversationsOnly([
				generateConversation({ id: '1', isRead: true }),
				generateConversation({ id: '2', isRead: true }),
				generateConversation({ id: '3', isRead: true })
			]);
			setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>,
				{ store }
			);

			expect(screen.getByTestId('icon: EmailOutline')).toBeVisible();
		});
		it('should display "mark as read" action if any selected items is unread', () => {
			const store = generateStore();
			updateConversationsOnly([
				generateConversation({ id: '1', isRead: true }),
				generateConversation({ id: '2', isRead: false }),
				generateConversation({ id: '3', isRead: true })
			]);

			setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>,
				{ store }
			);

			expect(screen.getByTestId('icon: EmailReadOutline')).toBeVisible();
		});
	});
	describe('Delete action', () => {
		it('should display "delete" action', () => {
			const store = generateStore();
			updateConversationsOnly([
				generateConversation({ id: '1' }),
				generateConversation({ id: '2' }),
				generateConversation({ id: '3' })
			]);
			setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>,
				{ store }
			);

			expect(screen.getByTestId('icon: Trash2Outline')).toBeVisible();
		});
	});
	describe('More actions', () => {
		it('should contain "add flag" action if at least one conversation is not flagged', async () => {
			const store = generateStore();
			updateConversationsOnly([
				generateConversation({ id: '1', isFlagged: true }),
				generateConversation({ id: '2', isFlagged: false }),
				generateConversation({ id: '3', isFlagged: true })
			]);
			const { user } = setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>,
				{ store }
			);
			const moreActionIcon = screen.getByTestId('icon: MoreVertical');
			await user.click(moreActionIcon);

			const actionsDropdown = screen.getByTestId('dropdown-popper-list');
			expect(within(actionsDropdown).getByTestId('icon: FlagOutline')).toBeVisible();
		});
		it('should contain "remove flag" action if all conversations are flagged', async () => {
			const store = generateStore();
			updateConversationsOnly([
				generateConversation({ id: '1', isFlagged: true }),
				generateConversation({ id: '2', isFlagged: true }),
				generateConversation({ id: '3', isFlagged: true })
			]);
			const { user } = setupTest(
				<ConversationsMultipleSelectionActions
					selectedConversationsIds={['1', '2']}
					deselectAll={jest.fn()}
					folderId={'folder-1'}
				/>,
				{ store }
			);
			const moreActionIcon = screen.getByTestId('icon: MoreVertical');
			await user.click(moreActionIcon);

			const actionsDropdown = screen.getByTestId('dropdown-popper-list');
			expect(within(actionsDropdown).getByTestId('icon: Flag')).toBeVisible();
		});
	});
});
