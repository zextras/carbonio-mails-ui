/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { populateConversationInEmailStore } from '../../../../../tests/generators/generateConversation';
import {
	ConversationListComponent,
	ConversationListComponentProps
} from '../conversation-list-component';
import { ConversationListItemComponent } from '../conversation-list-item-component';

describe.each`
	type                          | isSearchModule
	${'conversation list'}        | ${false}
	${'search conversation list'} | ${true}
`('$type list component', ({ isSearchModule }) => {
	test('populate a conversation list and check that the conversations are visible', async () => {
		const CONVERSATIONS_COUNT: number = 100;
		const folderId = FOLDERS.INBOX;
		populateFoldersStore();

		Array.from({ length: CONVERSATIONS_COUNT }).forEach((_, index) => {
			populateConversationInEmailStore({
				conversation: { id: index.toString() },
				messageIds: ['1']
			});
		});

		const conversationsIds = Array.from({ length: CONVERSATIONS_COUNT }).map((_, index) =>
			index.toString()
		);

		const toggle = jest.fn();
		const selectAll = jest.fn();
		const deselectAll = jest.fn();
		const selectAllModeOff = jest.fn();
		const setIsSelectModeOn = jest.fn();
		const dragImageRef = React.createRef<HTMLInputElement>();

		const listItems = conversationsIds.map((conversationId, index) => (
			<ConversationListItemComponent
				key={index}
				conversationId={conversationId}
				activeItemId=""
				selected={false}
				selecting={false}
				toggle={toggle}
				deselectAll={deselectAll}
				isSearchModule={isSearchModule}
				folderId={folderId}
				setDraggedIds={jest.fn()}
			/>
		));

		const props: ConversationListComponentProps = {
			displayerTitle: null,
			listItems,
			totalConversations: conversationsIds.length,
			conversationsLoadingCompleted: true,
			selectedIds: [],
			folderId,
			conversationsIds,
			isSelectModeOn: false,
			selected: {},
			deselectAll,
			selectAll,
			isAllSelected: false,
			selectAllModeOff,
			isSearchModule,
			setIsSelectModeOn,
			dragImageRef
		};

		setupTest(<ConversationListComponent {...props} />);

		await screen.findByTestId(`conversation-list-${folderId}`);
		const items = await screen.findAllByTestId(/ConversationListItem-/);

		// Test that there is a list item for each conversation
		expect(items.length).toBe(conversationsIds.length);

		// Test that every list item is visible
		items.forEach((item) => {
			expect(item).toBeVisible();
		});
	});
});
