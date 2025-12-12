/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useFolderStore } from '@zextras/carbonio-ui-commons';

import { generateFolder } from '@test-utils/folders/folders-generator';
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import { CONVERSATION_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/conversations/conversations-index-slice';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from 'store/emails/slices/populated-items/populated-items-slice';
import {
	appendConversationsToConversationIndexSlice,
	getUseEmailStoreAndHooksForTesting,
	setConversationsInEmailStore,
	setMessagesInEmailStore,
	updateConversations,
	updateConversationsResultsLoadingStatus,
	useConversationById,
	useConversationIndexSlice,
	useConversationsByIds,
	useConversationsIdsByFolder
} from 'store/emails/store';

describe('conversation-index-slice', () => {
	describe('useConversationIndexSlice', () => {
		it('should return the conversationsSlice state', async () => {
			const conversation1 = generateConversation({ id: '1' });
			const conversation2 = generateConversation({ id: '2' });
			const conversations = [conversation1, conversation2];
			setConversationsInEmailStore(conversations, false);
			const { result } = renderHook(() => useConversationIndexSlice());
			const expectedResult = {
				conversationListIndex: ['1', '2'],
				more: false,
				offset: 0,
				status: 'fulfilled'
			};
			expect(result.current).toEqual(expectedResult);
		});
	});

	const message1 = generateMessage({ id: '11', folderId: '5' });
	const message2 = generateMessage({ id: '21', folderId: '5' });
	const message3 = generateMessage({ id: '31', folderId: '8' });
	const messages = [message1, message2, message3];
	const conversation1 = generateConversation({ id: '1', folderId: '5', messageIds: ['11'] });
	const conversation2 = generateConversation({ id: '2', folderId: '5', messageIds: ['21'] });
	const conversation3 = generateConversation({ id: '3', folderId: '8', messageIds: ['31'] });

	describe('useConversationsIdsByFolder', () => {
		it('should return conversation IDs for the specified folder', async () => {
			setConversationsInEmailStore([conversation1, conversation2], false);
			setMessagesInEmailStore(messages, false);
			const folder = generateFolder({ id: '5' });
			useFolderStore.setState({ folders: { [folder.id]: folder } });
			const { result } = renderHook(() => useConversationsIdsByFolder(folder.id));
			await waitFor(async () => {
				expect(result.current).toEqual(['1', '2']);
			});
		});
		it('should return an empty set if no conversations match the folder', async () => {
			setConversationsInEmailStore([conversation1, conversation2, conversation3], false);
			setMessagesInEmailStore(messages, false);
			const folder = generateFolder({ id: '4' });
			useFolderStore.setState({ folders: { [folder.id]: folder } });
			const { result } = renderHook(() => useConversationsIdsByFolder(folder.id));
			await act(async () => {
				expect(result.current).toEqual([]);
			});
		});
		it('should handle folders with rid and zid properties', async () => {
			const messageInSharedFolder = generateMessage({ id: 'message1', folderId: '5:123' });
			const conversation4 = generateConversation({
				id: '4',
				folderId: '5:123',
				messageIds: [messageInSharedFolder.id]
			});
			const conversation5 = generateConversation({
				id: '5',
				folderId: '5:123',
				messageIds: [messageInSharedFolder.id]
			});
			const conversation6 = generateConversation({
				id: '6',
				folderId: '5'
			});
			setConversationsInEmailStore([conversation4, conversation5, conversation6], false);
			setMessagesInEmailStore([messageInSharedFolder], false);
			const folder1 = generateFolder({ id: '5:123' });
			const folder2 = generateFolder({ id: '5' });
			useFolderStore.setState({ folders: { [folder1.id]: folder1, [folder2.id]: folder2 } });
			const { result } = renderHook(() => useConversationsIdsByFolder(folder1.id));
			await waitFor(async () => {
				expect(result.current).toEqual(['4', '5']);
			});
		});
		it('should not include conversation IDs from other folders', async () => {
			setConversationsInEmailStore([conversation1, conversation2, conversation3], false);
			setMessagesInEmailStore(messages, false);
			const folder = generateFolder({ id: '5' });
			useFolderStore.setState({ folders: { [folder.id]: folder } });
			const { result } = renderHook(() => useConversationsIdsByFolder(folder.id));
			await waitFor(async () => {
				expect(result.current).toEqual(['1', '2']);
			});
		});
		it('should handle an empty conversationsSlice gracefully', async () => {
			const { result } = renderHook(() => useConversationsIdsByFolder('5'));
			await act(async () => {
				expect(result.current).toEqual([]);
			});
		});
	});

	describe('setConversationsInEmailStore', () => {
		describe('when called with valid inputs', () => {
			it('should set the conversation IDs correctly in the state', async () => {
				setConversationsInEmailStore([conversation1, conversation2, conversation3], false);
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.conversationListIndex).toEqual(['1', '2', '3']);
			});

			it('should set the conversations in populatedItemsSlice correctly', async () => {
				setConversationsInEmailStore([conversation1, conversation2], false);
				const { result: result1 } = renderHook(() => useConversationById('1'));
				const { result: result2 } = renderHook(() => useConversationById('2'));
				expect(result1.current).toEqual(conversation1);
				expect(result2.current).toEqual(conversation2);
			});

			it('should update the "more" flag correctly', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.more).toEqual(true);
			});

			it('should reset the offset to 0', async () => {
				appendConversationsToConversationIndexSlice([conversation1], 5, false);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.offset).toEqual(5);
				await act(async () => setConversationsInEmailStore([conversation2], false));
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.offset).toEqual(0);
			});

			it('should set the request status to "fulfilled"', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.status).toEqual('fulfilled');
			});
		});

		describe('when called with an empty conversations array', () => {
			it('should set the conversationIds as an empty Set', async () => {
				setConversationsInEmailStore([], false);
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.conversationListIndex).toEqual([]);
			});

			it('should set populatedItemsSlice.conversations as an empty object', async () => {
				updateConversations([conversation1]);
				const { result: initialState } = renderHook(() => useConversationsByIds(['1']));
				expect(initialState.current).toEqual([conversation1]);
				await act(async () => setConversationsInEmailStore([], false));
				const { result } = renderHook(() => useConversationsByIds(['1']));
				expect(result.current).toEqual([]);
			});

			it('should update the "more" flag correctly', async () => {
				setConversationsInEmailStore([], true);
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.more).toEqual(true);
			});
		});
	});

	describe('updateConversationsResultsLoadingStatus', () => {
		it('should update the conversationsSlice.status in the state', async () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.status).toEqual('fulfilled');
			await act(async () => updateConversationsResultsLoadingStatus('pending'));
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.status).toEqual('pending');
		});
	});

	describe('resetConversationsAndPopulatedItems', () => {
		describe('when called', () => {
			it('should reset conversationsSlice to its initial state', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1']);
				await act(async () =>
					getUseEmailStoreAndHooksForTesting().resetConversationAndPopulatedItems()
				);
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current).toEqual(CONVERSATION_INDEX_SLICE_INITIAL_STATE);
			});

			it('should reset populatedItemsSlice to its initial state', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1']);
				await act(async () =>
					getUseEmailStoreAndHooksForTesting().resetConversationAndPopulatedItems()
				);
				const { result } = renderHook(() =>
					getUseEmailStoreAndHooksForTesting().usePopulatedItemsSlice()
				);
				expect(result.current).toEqual(POPULATED_ITEMS_SLICE_INITIAL_STATE);
			});
		});
	});

	describe('appendConversationsToConversationIndexSlice', () => {
		describe('when called with a non-empty conversations array', () => {
			it('should add new conversation IDs to conversationsSlice.conversationIds', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1']);
				await act(async () =>
					appendConversationsToConversationIndexSlice([conversation2], 0, false)
				);
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.conversationListIndex).toEqual(['1', '2']);
			});

			it('should update the offset in conversationsSlice', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1']);
				await act(async () =>
					appendConversationsToConversationIndexSlice([conversation2], 555, false)
				);
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.offset).toEqual(555);
			});

			it('should append conversations to populatedItemsSlice.conversations without overwriting the existing ones', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1']);
				await act(async () =>
					appendConversationsToConversationIndexSlice([conversation2], 0, false)
				);
				const { result } = renderHook(() =>
					getUseEmailStoreAndHooksForTesting().usePopulatedItemsSlice()
				);
				expect(result.current.conversations).toEqual({ '1': conversation1, '2': conversation2 });
			});
		});

		describe('when called with an empty conversations array', () => {
			it('should not modify conversationsSlice.conversationIds', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1']);
				await act(async () => appendConversationsToConversationIndexSlice([], 555, false));
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.conversationListIndex).toEqual(['1']);
			});

			it('should still update the offset', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1']);
				await act(async () => appendConversationsToConversationIndexSlice([], 555, false));
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.offset).toEqual(555);
			});

			it('should not modify populatedItemsSlice.conversations', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1']);
				await act(async () => appendConversationsToConversationIndexSlice([], 0, false));
				const { result } = renderHook(() =>
					getUseEmailStoreAndHooksForTesting().usePopulatedItemsSlice()
				);
				expect(result.current.conversations).toEqual({ '1': conversation1 });
			});
		});

		describe('when called with duplicate conversation IDs', () => {
			it('should not add duplicate IDs to conversationsSlice.conversationIds', async () => {
				setConversationsInEmailStore([conversation1, conversation2], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1', '2']);
				await act(async () =>
					appendConversationsToConversationIndexSlice(
						[conversation2, conversation3, conversation3],
						555,
						false
					)
				);
				const { result } = renderHook(() => useConversationIndexSlice());
				expect(result.current.conversationListIndex).toEqual(['1', '2', '3']);
			});

			it('should update existing conversations in populatedItemsSlice.conversations if they exist', async () => {
				setConversationsInEmailStore([conversation1], true);
				const { result: initialState } = renderHook(() => useConversationIndexSlice());
				expect(initialState.current.conversationListIndex).toEqual(['1']);
				const updatedConversation1 = { ...conversation1, subject: 'Updated subject' };
				await act(async () =>
					appendConversationsToConversationIndexSlice([updatedConversation1], 555, false)
				);
				const { result } = renderHook(() =>
					getUseEmailStoreAndHooksForTesting().usePopulatedItemsSlice()
				);
				expect(result.current.conversations).toEqual({ '1': updatedConversation1 });
			});
		});
	});
});
