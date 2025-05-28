/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import {
	FOLDERS,
} from '@zextras/carbonio-ui-commons';
import { populateConversationInEmailStore } from '../../../../../tests/generators/generateConversation';
import {
	ConversationListComponent,
	ConversationListComponentProps
} from '../conversation-list-component';
import { ConversationListItemComponent } from '../conversation-list-item-component';
import { setupTest, triggerLoadMore } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';

function setUpConversationList({
	folderId,
	conversationsIds,
	loadMoreCallback,
	isSearchModule = false
}: {
	folderId: string;
	conversationsIds: string[];
	loadMoreCallback?: () => void;
	isSearchModule?: boolean;
}): ReturnType<typeof setupTest> {
	conversationsIds.forEach((_, index) => {
		populateConversationInEmailStore({
			conversationParams: { id: index.toString(), folderId: FOLDERS.INBOX }
		});
	});

	const toggle = jest.fn();
	const selectAll = jest.fn();
	const deselectAll = jest.fn();
	const selectAllModeOff = jest.fn();
	const setIsSelectModeOn = jest.fn();

	const listItems = conversationsIds.map((conversationId, index) => (
		<ConversationListItemComponent
			key={index}
			conversationId={conversationId}
			activeItemId=""
			selected={false}
			selecting={false}
			toggleMultipleSelection={toggle}
			deselectAll={deselectAll}
			folderId={FOLDERS.INBOX}
			setDraggedIds={jest.fn()}
		/>
	));

	const dragImageRef = React.createRef<HTMLInputElement>();

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
		dragImageRef,
		loadMoreCallback
	};

	return setupTest(<ConversationListComponent {...props} />);
}
describe('ConversationListComponent', () => {
	describe('when in conversation list', () => {
		test('populate a conversation list and check that the conversations are visible', async () => {
			populateFoldersStore();

			const conversationsIds = Array.from({ length: 100 }).map((_, index) => index.toString());

			await act(async () => {
				setUpConversationList({ folderId: FOLDERS.INBOX, conversationsIds });
			});

			await screen.findByTestId(`conversation-list-${FOLDERS.INBOX}`);
			const items = await screen.findAllByTestId(/ConversationListItem-/);

			await waitFor(() => {
				expect(items.length).toBe(conversationsIds.length);
			});

			items.forEach((item) => {
				expect(item).toBeVisible();
			});
		});

		test('should call loadMore when there are more items to load', async () => {
			const conversationsIds = Array.from({ length: 100 }).map((_, index) => index.toString());

			const loadMoreCallback = jest.fn();

			await act(async () => {
				setUpConversationList({
					folderId: FOLDERS.INBOX,
					conversationsIds,
					loadMoreCallback
				});
			});

			triggerLoadMore();

			expect(loadMoreCallback).toHaveBeenCalled();
		});
	});
	describe('when in search conversation list', () => {
		test('populate the search conversation list and check that the conversations are visible', async () => {
			const conversationsIds = Array.from({ length: 100 }).map((_, index) => index.toString());

			const folderId = FOLDERS.INBOX;
			await act(async () => {
				setUpConversationList({ folderId, conversationsIds, isSearchModule: true });
			});

			await screen.findByTestId(`conversation-list-${folderId}`);
			const items = await screen.findAllByTestId(/ConversationListItem-/);

			await waitFor(() => {
				expect(items.length).toBe(conversationsIds.length);
			});

			items.forEach((item) => {
				expect(item).toBeVisible();
			});
		});
	});
});
