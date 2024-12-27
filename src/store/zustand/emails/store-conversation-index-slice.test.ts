/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook } from '@testing-library/react';

import { CONVERSATION_INDEX_SLICE_INITIAL_STATE } from './conversations/conversations-index-slice';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from './populated-items/populated-items-slice';
import {
	appendConversationsToConversationIndexSlice,
	resetConversationAndPopulatedItems,
	setConversationsInEmailStore,
	updateConversationsOnly,
	updateConversationsResultsLoadingStatus,
	useConversationById,
	useConversationIndexSlice,
	useConversationsByIds,
	useConversationsIdsByFolder,
	usePopulatedItemsSlice
} from './store';
import { useFolderStore } from '../../../carbonio-ui-commons/store/zustand/folder';
import { generateFolder } from '../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { generateConversation } from '../../../tests/generators/generateConversation';

describe('useConversationIndexSlice', () => {
	it('should return the conversationsSlice state', () => {
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

const conversation1 = generateConversation({ id: '1', folderId: '5' });
const conversation2 = generateConversation({ id: '2', folderId: '5' });
const conversation3 = generateConversation({ id: '3', folderId: '8' });

describe('useConversationsIdsByFolder', () => {
	it('should return conversation IDs for the specified folder', () => {
		setConversationsInEmailStore([conversation1, conversation2], false);
		const folder = generateFolder({ id: '5' });
		useFolderStore.setState({ folders: { [folder.id]: folder } });
		const { result } = renderHook(() => useConversationsIdsByFolder(folder.id));
		expect(result.current).toEqual(['1', '2']);
	});
	it('should return an empty set if no conversations match the folder', () => {
		setConversationsInEmailStore([conversation1, conversation2, conversation3], false);
		const folder = generateFolder({ id: '4' });
		useFolderStore.setState({ folders: { [folder.id]: folder } });
		const { result } = renderHook(() => useConversationsIdsByFolder(folder.id));
		expect(result.current).toEqual([]);
	});
	it('should handle folders with rid and zid properties', () => {
		const conversation4 = generateConversation({ id: '4', folderId: '5:123' });
		const conversation5 = generateConversation({ id: '5', folderId: '5:123' });
		const conversation6 = generateConversation({ id: '6', folderId: '5' });
		setConversationsInEmailStore([conversation4, conversation5, conversation6], false);
		const folder1 = generateFolder({ id: '5:123' });
		const folder2 = generateFolder({ id: '5' });
		useFolderStore.setState({ folders: { [folder1.id]: folder1, [folder2.id]: folder2 } });
		const { result } = renderHook(() => useConversationsIdsByFolder(folder1.id));
		expect(result.current).toEqual(['4', '5']);
	});
	it('should not include conversation IDs from other folders', () => {
		setConversationsInEmailStore([conversation1, conversation2, conversation3], false);
		const folder = generateFolder({ id: '5' });
		useFolderStore.setState({ folders: { [folder.id]: folder } });
		const { result } = renderHook(() => useConversationsIdsByFolder(folder.id));
		expect(result.current).toEqual(['1', '2']);
	});
	it('should handle an empty conversationsSlice gracefully', () => {
		const { result } = renderHook(() => useConversationsIdsByFolder('5'));
		expect(result.current).toEqual([]);
	});
});

describe('setConversationsInEmailStore', () => {
	describe('when called with valid inputs', () => {
		it('should set the conversation IDs correctly in the state', () => {
			setConversationsInEmailStore([conversation1, conversation2, conversation3], false);
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.conversationListIndex).toEqual(['1', '2', '3']);
		});

		it('should set the conversations in populatedItemsSlice correctly', () => {
			setConversationsInEmailStore([conversation1, conversation2], false);
			const { result: result1 } = renderHook(() => useConversationById('1'));
			const { result: result2 } = renderHook(() => useConversationById('2'));
			expect(result1.current).toEqual(conversation1);
			expect(result2.current).toEqual(conversation2);
		});

		it('should update the "more" flag correctly', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.more).toEqual(true);
		});

		it('should reset the offset to 0', () => {
			appendConversationsToConversationIndexSlice([conversation1], 5);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.offset).toEqual(5);
			act(() => setConversationsInEmailStore([conversation2], false));
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.offset).toEqual(0);
		});

		it('should set the request status to "fulfilled"', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.status).toEqual('fulfilled');
		});
	});

	describe('when called with an empty conversations array', () => {
		it('should set the conversationIds as an empty Set', () => {
			setConversationsInEmailStore([], false);
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.conversationListIndex).toEqual([]);
		});

		it('should set populatedItemsSlice.conversations as an empty object', () => {
			updateConversationsOnly([conversation1]);
			const { result: initialState } = renderHook(() => useConversationsByIds(['1']));
			expect(initialState.current).toEqual([conversation1]);
			act(() => setConversationsInEmailStore([], false));
			const { result } = renderHook(() => useConversationsByIds(['1']));
			expect(result.current).toEqual([]);
		});

		it('should update the "more" flag correctly', () => {
			setConversationsInEmailStore([], true);
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.more).toEqual(true);
		});
	});
});

describe('updateConversationsResultsLoadingStatus', () => {
	it('should update the conversationsSlice.status in the state', () => {
		setConversationsInEmailStore([conversation1], true);
		const { result: initialState } = renderHook(() => useConversationIndexSlice());
		expect(initialState.current.status).toEqual('fulfilled');
		act(() => updateConversationsResultsLoadingStatus('pending'));
		const { result } = renderHook(() => useConversationIndexSlice());
		expect(result.current.status).toEqual('pending');
	});
});

describe('resetConversationsAndPopulatedItems', () => {
	describe('when called', () => {
		it('should reset conversationsSlice to its initial state', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1']);
			act(() => resetConversationAndPopulatedItems());
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current).toEqual(CONVERSATION_INDEX_SLICE_INITIAL_STATE);
		});

		it('should reset populatedItemsSlice to its initial state', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1']);
			act(() => resetConversationAndPopulatedItems());
			const { result } = renderHook(() => usePopulatedItemsSlice());
			expect(result.current).toEqual(POPULATED_ITEMS_SLICE_INITIAL_STATE);
		});
	});
});

describe('appendConversationsToConversationIndexSlice', () => {
	describe('when called with a non-empty conversations array', () => {
		it('should add new conversation IDs to conversationsSlice.conversationIds', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1']);
			act(() => appendConversationsToConversationIndexSlice([conversation2], 0));
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.conversationListIndex).toEqual(['1', '2']);
		});

		it('should update the offset in conversationsSlice', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1']);
			act(() => appendConversationsToConversationIndexSlice([conversation2], 555));
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.offset).toEqual(555);
		});

		it('should append conversations to populatedItemsSlice.conversations without overwriting the existing ones', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1']);
			act(() => appendConversationsToConversationIndexSlice([conversation2], 0));
			const { result } = renderHook(() => usePopulatedItemsSlice());
			expect(result.current.conversations).toEqual({ '1': conversation1, '2': conversation2 });
		});
	});

	describe('when called with an empty conversations array', () => {
		it('should not modify conversationsSlice.conversationIds', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1']);
			act(() => appendConversationsToConversationIndexSlice([], 555));
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.conversationListIndex).toEqual(['1']);
		});

		it('should still update the offset', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1']);
			act(() => appendConversationsToConversationIndexSlice([], 555));
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.offset).toEqual(555);
		});

		it('should not modify populatedItemsSlice.conversations', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1']);
			act(() => appendConversationsToConversationIndexSlice([], 0));
			const { result } = renderHook(() => usePopulatedItemsSlice());
			expect(result.current.conversations).toEqual({ '1': conversation1 });
		});
	});

	describe('when called with duplicate conversation IDs', () => {
		it('should not add duplicate IDs to conversationsSlice.conversationIds', () => {
			setConversationsInEmailStore([conversation1, conversation2], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1', '2']);
			act(() =>
				appendConversationsToConversationIndexSlice(
					[conversation2, conversation3, conversation3],
					555
				)
			);
			const { result } = renderHook(() => useConversationIndexSlice());
			expect(result.current.conversationListIndex).toEqual(['1', '2', '3']);
		});

		it('should update existing conversations in populatedItemsSlice.conversations if they exist', () => {
			setConversationsInEmailStore([conversation1], true);
			const { result: initialState } = renderHook(() => useConversationIndexSlice());
			expect(initialState.current.conversationListIndex).toEqual(['1']);
			const updatedConversation1 = { ...conversation1, subject: 'Updated subject' };
			act(() => appendConversationsToConversationIndexSlice([updatedConversation1], 555));
			const { result } = renderHook(() => usePopulatedItemsSlice());
			expect(result.current.conversations).toEqual({ '1': updatedConversation1 });
		});
	});
});
