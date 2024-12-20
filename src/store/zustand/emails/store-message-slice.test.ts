/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook } from '@testing-library/react';

import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from './messages/messages-slice';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from './populated-items/populated-items-slice';
import {
	appendMessagesToMessagesSlice,
	resetMessagesAndPopulatedItems,
	setMessagesInEmailStore,
	updateMessages,
	updateMessagesResultsLoadingStatus,
	useMessageById,
	useMessagesByIds,
	useMessagesIdsByFolder,
	useMessagesSlice,
	usePopulatedItemsSlice
} from './store';
import { generateFolder } from '../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { generateMessage } from '../../../tests/generators/generateMessage';

describe('useMessagesSlice', () => {
	it('should return the messagesSlice state', () => {
		const message1 = generateMessage({ id: '1' });
		const message2 = generateMessage({ id: '2' });
		const messages = [message1, message2];
		setMessagesInEmailStore(messages, false);
		const { result } = renderHook(() => useMessagesSlice());
		const expectedResult = {
			messageIdSet: new Set(['1', '2']),
			more: false,
			offset: 0,
			status: 'fulfilled'
		};
		expect(result.current).toEqual(expectedResult);
	});
});

const message1 = generateMessage({ id: '1', folderId: '5' });
const message2 = generateMessage({ id: '2', folderId: '5' });
const message3 = generateMessage({ id: '3', folderId: '8' });

describe('useMessagesIdsByFolder', () => {
	it('should return message IDs for the specified folder', () => {
		setMessagesInEmailStore([message1, message2], false);
		const folder = generateFolder({ id: '5' });
		const { result } = renderHook(() => useMessagesIdsByFolder(folder));
		expect(result.current).toEqual(new Set(['1', '2']));
	});
	it('should return an empty set if no messages match the folder', () => {
		setMessagesInEmailStore([message1, message2, message3], false);
		const folder = generateFolder({ id: '4' });
		const { result } = renderHook(() => useMessagesIdsByFolder(folder));
		expect(result.current).toEqual(new Set([]));
	});
	it('should handle folders with rid and zid properties', () => {
		const message4 = generateMessage({ id: '4', folderId: '5:123' });
		const message5 = generateMessage({ id: '5', folderId: '5:123' });
		const message6 = generateMessage({ id: '6', folderId: '5' });
		setMessagesInEmailStore([message4, message5, message6], false);
		const folder = generateFolder({ id: '5:123' });
		const { result } = renderHook(() => useMessagesIdsByFolder(folder));
		expect(result.current).toEqual(new Set(['4', '5']));
	});
	it('should not include message IDs from other folders', () => {
		setMessagesInEmailStore([message1, message2, message3], false);
		const folder = generateFolder({ id: '5' });
		const { result } = renderHook(() => useMessagesIdsByFolder(folder));
		expect(result.current).toEqual(new Set(['1', '2']));
	});
	it('should handle an empty messagesSlice gracefully', () => {
		const folder = generateFolder({ id: '5' });
		const { result } = renderHook(() => useMessagesIdsByFolder(folder));
		expect(result.current).toEqual(new Set([]));
	});
});

describe('setMessagesInEmailStore', () => {
	describe('when called with valid inputs', () => {
		it('should set the message IDs correctly in the state', () => {
			setMessagesInEmailStore([message1, message2, message3], false);
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.messageIdSet).toEqual(new Set(['1', '2', '3']));
		});

		it('should set the messages in populatedItemsSlice correctly', () => {
			setMessagesInEmailStore([message1, message2], false);
			const { result: result1 } = renderHook(() => useMessageById('1'));
			const { result: result2 } = renderHook(() => useMessageById('2'));
			expect(result1.current).toEqual(message1);
			expect(result2.current).toEqual(message2);
		});

		it('should update the "more" flag correctly', () => {
			setMessagesInEmailStore([message1], true);
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.more).toEqual(true);
		});

		it('should reset the offset to 0', () => {
			appendMessagesToMessagesSlice([message1], 5);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.offset).toEqual(5);
			act(() => setMessagesInEmailStore([message2], false));
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.offset).toEqual(0);
		});

		it('should set the request status to "fulfilled"', () => {
			setMessagesInEmailStore([message1], true);
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.status).toEqual('fulfilled');
		});
	});

	describe('when called with an empty messages array', () => {
		it('should set the messageIds as an empty Set', () => {
			setMessagesInEmailStore([], false);
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.messageIdSet).toEqual(new Set([]));
		});

		it('should set populatedItemsSlice.messages as an empty object', () => {
			updateMessages([message1]);
			const { result: initialState } = renderHook(() => useMessagesByIds(['1']));
			expect(initialState.current).toEqual([message1]);
			act(() => setMessagesInEmailStore([], false));
			const { result } = renderHook(() => useMessagesByIds(['1']));
			expect(result.current).toEqual([]);
		});

		it('should update the "more" flag correctly', () => {
			setMessagesInEmailStore([], true);
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.more).toEqual(true);
		});
	});
});

describe('updateMessagesResultsLoadingStatus', () => {
	it('should update the messagesSlice.status in the state', () => {
		setMessagesInEmailStore([message1], true);
		const { result: initialState } = renderHook(() => useMessagesSlice());
		expect(initialState.current.status).toEqual('fulfilled');
		act(() => updateMessagesResultsLoadingStatus('pending'));
		const { result } = renderHook(() => useMessagesSlice());
		expect(result.current.status).toEqual('pending');
	});
});

describe('resetMessagesAndPopulatedItems', () => {
	describe('when called', () => {
		it('should reset messagesSlice to its initial state', () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1']));
			act(() => resetMessagesAndPopulatedItems());
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current).toEqual(MESSAGE_INDEX_SLICE_INITIAL_STATE);
		});

		it('should reset populatedItemsSlice to its initial state', () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1']));
			act(() => resetMessagesAndPopulatedItems());
			const { result } = renderHook(() => usePopulatedItemsSlice());
			expect(result.current).toEqual(POPULATED_ITEMS_SLICE_INITIAL_STATE);
		});
	});
});

describe('appendMessagesToMessagesSlice', () => {
	describe('when called with a non-empty messages array', () => {
		it('should add new message IDs to messagesSlice.messageIds', () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1']));
			act(() => appendMessagesToMessagesSlice([message2], 0));
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.messageIdSet).toEqual(new Set(['1', '2']));
		});

		it('should update the offset in messagesSlice', () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1']));
			act(() => appendMessagesToMessagesSlice([message2], 555));
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.offset).toEqual(555);
		});

		it('should append messages to populatedItemsSlice.messages without overwriting the existing ones', () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1']));
			act(() => appendMessagesToMessagesSlice([message2], 0));
			const { result } = renderHook(() => usePopulatedItemsSlice());
			expect(result.current.messages).toEqual({ '1': message1, '2': message2 });
		});
	});

	describe('when called with an empty messages array', () => {
		it('should not modify messagesSlice.messageIds', () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1']));
			act(() => appendMessagesToMessagesSlice([], 555));
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.messageIdSet).toEqual(new Set(['1']));
		});

		it('should still update the offset', () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1']));
			act(() => appendMessagesToMessagesSlice([], 555));
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.offset).toEqual(555);
		});

		it('should not modify populatedItemsSlice.messages', () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1']));
			act(() => appendMessagesToMessagesSlice([], 0));
			const { result } = renderHook(() => usePopulatedItemsSlice());
			expect(result.current.messages).toEqual({ '1': message1 });
		});
	});

	describe('when called with duplicate message IDs', () => {
		it('should not add duplicate IDs to messagesSlice.messageIds', () => {
			setMessagesInEmailStore([message1, message2], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1', '2']));
			act(() => appendMessagesToMessagesSlice([message2, message3, message3], 555));
			const { result } = renderHook(() => useMessagesSlice());
			expect(result.current.messageIdSet).toEqual(new Set(['1', '2', '3']));
		});

		it('should update existing messages in populatedItemsSlice.messages if they exist', () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessagesSlice());
			expect(initialState.current.messageIdSet).toEqual(new Set(['1']));
			const updatedMessage1 = { ...message1, subject: 'Updated subject' };
			act(() => appendMessagesToMessagesSlice([updatedMessage1], 555));
			const { result } = renderHook(() => usePopulatedItemsSlice());
			expect(result.current.messages).toEqual({ '1': updatedMessage1 });
		});
	});
});
