/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupTest, triggerLoadMore } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import {
	ConversationListComponent,
	ConversationListComponentProps
} from 'views/app/folder-panel/conversations/conversation-list-component';
import { ConversationListItemComponent } from 'views/app/folder-panel/conversations/conversation-list-item-component';

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

	const listItems = conversationsIds.map((conversationId, index) => (
		<ConversationListItemComponent
			deselectAll={vi.fn()}
			key={index}
			conversationId={conversationId}
			selectedItems={{}}
			activeItemId=""
			selected={false}
			selecting={false}
			folderId={FOLDERS.INBOX}
			setDraggedIds={vi.fn()}
			index={0}
			onSelect={vi.fn()}
			onToggleExpanded={vi.fn()}
			isConversationExpanded={false}
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
		deselectAll: vi.fn(),
		selectAll: vi.fn(),
		isAllSelected: false,
		selectAllModeOff: vi.fn(),
		isSearchModule,
		setIsSelectModeOn: vi.fn(),
		dragImageRef,
		loadMoreCallback,
		onSelect: vi.fn()
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

			const loadMoreCallback = vi.fn();

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
