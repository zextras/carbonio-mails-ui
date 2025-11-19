/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook } from '@testing-library/react';
import { useFolderStore } from '@zextras/carbonio-ui-commons';

import { generateFolder } from '@test-utils/folders/folders-generator';
import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/messages/messages-slice';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from 'store/emails/slices/populated-items/populated-items-slice';
import {
	appendMessagesToMessagesSlice,
	getUseEmailStoreAndHooksForTesting,
	resetMessagesAndPopulatedItems,
	setMessagesInEmailStore,
	updateMessages,
	updateMessagesResultsLoadingStatus,
	useMessageById,
	useMessageIndexSlice,
	useMessagesByIds,
	useMessagesIdsByFolder
} from 'store/emails/store';
import { generateMessage } from '__test__/generators/generateMessage';

const { usePopulatedItemsSlice } = getUseEmailStoreAndHooksForTesting();

describe('message-slice-utils', () => {
	describe('useMessagesSlice', () => {
		it('should return the messagesSlice state', async () => {
			const message1 = generateMessage({ id: '1' });
			const message2 = generateMessage({ id: '2' });
			const messages = [message1, message2];
			setMessagesInEmailStore(messages, false);
			const { result } = renderHook(() => useMessageIndexSlice());
			const expectedResult = {
				messageListIndex: ['1', '2'],
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
		it('should return message IDs for the specified folder', async () => {
			setMessagesInEmailStore([message1, message2], false);
			const folder1 = generateFolder({ id: '5' });
			const folder2 = generateFolder({ id: '8' });
			await act(async () => {
				useFolderStore.setState({ folders: { [folder1.id]: folder1, [folder2.id]: folder2 } });
			});
			const { result } = renderHook(() => useMessagesIdsByFolder(folder1.id));
			expect(result.current).toEqual(['1', '2']);
		});
		it('should return an empty set if no messages match the folder', async () => {
			setMessagesInEmailStore([message1, message2, message3], false);
			const folder1 = generateFolder({ id: '4' });
			const folder2 = generateFolder({ id: '8' });
			await act(async () => {
				useFolderStore.setState({ folders: { [folder1.id]: folder1, [folder2.id]: folder2 } });
			});
			const { result } = renderHook(() => useMessagesIdsByFolder(folder1.id));
			expect(result.current).toEqual([]);
		});
		it('should handle folders with rid and zid properties', async () => {
			const message4 = generateMessage({ id: '4', folderId: '5:123' });
			const message5 = generateMessage({ id: '5', folderId: '5:123' });
			const message6 = generateMessage({ id: '6', folderId: '5' });
			await act(async () => {
				setMessagesInEmailStore([message4, message5, message6], false);
			});
			const folder1 = generateFolder({ id: '5:123' });
			const folder2 = generateFolder({ id: '5' });
			await act(async () => {
				useFolderStore.setState({ folders: { [folder1.id]: folder1, [folder2.id]: folder2 } });
			});
			const { result } = renderHook(() => useMessagesIdsByFolder(folder1.id));
			expect(result.current).toEqual(['4', '5']);
		});
		it('should not include message IDs from other folders', async () => {
			setMessagesInEmailStore([message1, message2, message3], false);
			const folder1 = generateFolder({ id: '5' });
			const folder2 = generateFolder({ id: '8' });
			await act(async () => {
				useFolderStore.setState({ folders: { [folder1.id]: folder1, [folder2.id]: folder2 } });
			});
			const { result } = renderHook(() => useMessagesIdsByFolder(folder1.id));
			expect(result.current).toEqual(['1', '2']);
		});
		it('should handle an empty messagesSlice gracefully', async () => {
			const folder1 = generateFolder({ id: '5' });
			const folder2 = generateFolder({ id: '8' });
			await act(async () => {
				useFolderStore.setState({ folders: { [folder1.id]: folder1, [folder2.id]: folder2 } });
			});
			const { result } = renderHook(() => useMessagesIdsByFolder(folder1.id));
			expect(result.current).toEqual([]);
		});
		it('should return an empty array if no folder found', async () => {
			const { result } = renderHook(() => useMessagesIdsByFolder('unknown-folder-id'));
			expect(result.current).toEqual([]);
		});
	});

	describe('setMessagesInEmailStore', () => {
		describe('when called with valid inputs', () => {
			it('should set the message IDs correctly in the state', async () => {
				setMessagesInEmailStore([message1, message2, message3], false);
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.messageListIndex).toEqual(['1', '2', '3']);
			});

			it('should set the messages in populatedItemsSlice correctly', async () => {
				setMessagesInEmailStore([message1, message2], false);
				const { result: result1 } = renderHook(() => useMessageById('1'));
				const { result: result2 } = renderHook(() => useMessageById('2'));
				expect(result1.current).toEqual(message1);
				expect(result2.current).toEqual(message2);
			});

			it('should update the "more" flag correctly', async () => {
				setMessagesInEmailStore([message1], true);
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.more).toEqual(true);
			});

			it('should reset the offset to 0', async () => {
				appendMessagesToMessagesSlice([message1], 5, false);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.offset).toEqual(5);
				await act(async () => setMessagesInEmailStore([message2], false));
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.offset).toEqual(0);
			});

			it('should set the request status to "fulfilled"', async () => {
				setMessagesInEmailStore([message1], true);
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.status).toEqual('fulfilled');
			});
		});

		describe('when called with an empty messages array', () => {
			it('should set the messageIds as an empty Set', async () => {
				setMessagesInEmailStore([], false);
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.messageListIndex).toEqual([]);
			});

			it('should set populatedItemsSlice.messages as an empty object', async () => {
				updateMessages([message1]);
				const { result: initialState } = renderHook(() => useMessagesByIds(['1']));
				expect(initialState.current).toEqual([message1]);
				await act(async () => setMessagesInEmailStore([], false));
				const { result } = renderHook(() => useMessagesByIds(['1']));
				expect(result.current).toEqual([]);
			});

			it('should update the "more" flag correctly', async () => {
				setMessagesInEmailStore([], true);
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.more).toEqual(true);
			});
		});
	});

	describe('updateMessagesResultsLoadingStatus', () => {
		it('should update the messagesSlice.status in the state', async () => {
			setMessagesInEmailStore([message1], true);
			const { result: initialState } = renderHook(() => useMessageIndexSlice());
			expect(initialState.current.status).toEqual('fulfilled');
			await act(async () => updateMessagesResultsLoadingStatus('pending'));
			const { result } = renderHook(() => useMessageIndexSlice());
			expect(result.current.status).toEqual('pending');
		});
	});

	describe('resetMessagesAndPopulatedItems', () => {
		describe('when called', () => {
			it('should reset messagesSlice to its initial state', async () => {
				setMessagesInEmailStore([message1], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1']);
				await act(async () => resetMessagesAndPopulatedItems());
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current).toEqual(MESSAGE_INDEX_SLICE_INITIAL_STATE);
			});

			it('should reset populatedItemsSlice to its initial state', async () => {
				setMessagesInEmailStore([message1], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1']);
				await act(async () => resetMessagesAndPopulatedItems());
				const { result } = renderHook(() => usePopulatedItemsSlice());
				expect(result.current).toEqual(POPULATED_ITEMS_SLICE_INITIAL_STATE);
			});
		});
	});

	describe('appendMessagesToMessagesSlice', () => {
		describe('when called with a non-empty messages array', () => {
			it('should add new message IDs to messagesSlice.messageIds', async () => {
				setMessagesInEmailStore([message1], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1']);
				await act(async () => appendMessagesToMessagesSlice([message2], 0, false));
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.messageListIndex).toEqual(['1', '2']);
			});

			it('should update the offset in messagesSlice', async () => {
				setMessagesInEmailStore([message1], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1']);
				await act(async () => appendMessagesToMessagesSlice([message2], 555, false));
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.offset).toEqual(555);
			});

			it('should append messages to populatedItemsSlice.messages without overwriting the existing ones', async () => {
				setMessagesInEmailStore([message1], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1']);
				await act(async () => appendMessagesToMessagesSlice([message2], 0, false));
				const { result } = renderHook(() => usePopulatedItemsSlice());
				expect(result.current.messages).toEqual({ '1': message1, '2': message2 });
			});
		});

		describe('when called with an empty messages array', () => {
			it('should not modify messagesSlice.messageIds', async () => {
				setMessagesInEmailStore([message1], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1']);
				await act(async () => appendMessagesToMessagesSlice([], 555, false));
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.messageListIndex).toEqual(['1']);
			});

			it('should still update the offset', async () => {
				setMessagesInEmailStore([message1], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1']);
				await act(async () => appendMessagesToMessagesSlice([], 555, false));
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.offset).toEqual(555);
			});

			it('should not modify populatedItemsSlice.messages', async () => {
				setMessagesInEmailStore([message1], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1']);
				await act(async () => appendMessagesToMessagesSlice([], 0, false));
				const { result } = renderHook(() => usePopulatedItemsSlice());
				expect(result.current.messages).toEqual({ '1': message1 });
			});
		});

		describe('when called with duplicate message IDs', () => {
			it('should not add duplicate IDs to messagesSlice.messageIds', async () => {
				setMessagesInEmailStore([message1, message2], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1', '2']);
				await act(async () =>
					appendMessagesToMessagesSlice([message2, message3, message3], 555, false)
				);
				const { result } = renderHook(() => useMessageIndexSlice());
				expect(result.current.messageListIndex).toEqual(['1', '2', '3']);
			});

			it('should update existing messages in populatedItemsSlice.messages if they exist', async () => {
				setMessagesInEmailStore([message1], true);
				const { result: initialState } = renderHook(() => useMessageIndexSlice());
				expect(initialState.current.messageListIndex).toEqual(['1']);
				const updatedMessage1 = { ...message1, subject: 'Updated subject' };
				await act(async () => appendMessagesToMessagesSlice([updatedMessage1], 555, false));
				const { result } = renderHook(() => usePopulatedItemsSlice());
				expect(result.current.messages).toEqual({ '1': updatedMessage1 });
			});
		});
	});
});
