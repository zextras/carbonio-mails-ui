/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { noop, times } from 'lodash';
import { string } from 'prop-types';
import React from 'react';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateConversation } from '../../../../../tests/generators/generateConversation';
import { generateStore } from '../../../../../tests/generators/store';
import type { Conversation, Status } from '../../../../../types';
import {
	MessageListComponent,
	MessageListComponentProps
} from '../../messages/message-list-component';
import ConversationList from '../conversation-list';
import {
	ConversationListComponent,
	ConversationListComponentProps
} from '../conversation-list-component';
import { ConversationListItemComponent } from '../conversation-list-item-component';

describe('Conversation list component', () => {
	test('populate a conversation list and check that the conversations are visible', async () => {
		// Populate a conversation list
		const CONVERSATIONS_COUNT = 100;
		const folderId = FOLDERS.INBOX;
		const conversations = times(CONVERSATIONS_COUNT, () =>
			generateConversation({ folderId, isSingleMessageConversation: false })
		);

		const toggle = jest.fn();
		const selectAll = jest.fn();
		const deselectAll = jest.fn();
		const selectAllModeOff = jest.fn();
		const setIsSelectModeOn = jest.fn();

		const listItems = conversations.map((conversation, index) => (
			<ConversationListItemComponent
				key={index}
				item={conversation}
				activeItemId=""
				selected={false}
				selecting={false}
				toggle={toggle}
				deselectAll={deselectAll}
				folderId={folderId}
			/>
		));

		const props: ConversationListComponentProps = {
			displayerTitle: null,
			listItems,
			totalConversations: conversations.length,
			conversationsLoadingCompleted: true,
			selectedIds: [],
			folderId,
			conversations,
			isSelectModeOn: false,
			selected: {},
			deselectAll,
			selectAll,
			isAllSelected: false,
			selectAllModeOff,
			setIsSelectModeOn
		};

		const store = generateStore({
			conversations: {
				currentFolder: folderId,
				expandedStatus: conversations.reduce<Record<string, Status>>(
					(result, conversation): Record<string, Status> => ({
						...result,
						[conversation.id]: 'complete'
					}),
					{}
				),
				searchedInFolder: {},
				conversations: {
					...conversations.map((conversation) => ({ [conversation.id]: conversation }))
				},
				status: 'complete'
			}
		});

		setupTest(<ConversationListComponent {...props} />, { store });

		await screen.findByTestId(`conversation-list-${folderId}`);
		const items = await screen.findAllByTestId(/ConversationListItem-/);

		// Test that there is a list item for each conversation
		expect(items.length).toBe(conversations.length);

		// Test that every list item is visible
		items.forEach((item) => {
			expect(item).toBeVisible();
		});
	});
});
