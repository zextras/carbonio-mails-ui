/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook } from '@testing-library/react';
import { ParticipantRole, useFolderStore } from '@zextras/carbonio-ui-commons';

import { generateFolder } from '@test-utils/folders/folders-generator';
import { generateMessage } from '__test__/generators/generateMessage';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/messages/messages-slice';
import { getRefreshedListIndex } from 'store/emails/slices/messages/utils';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from 'store/emails/slices/populated-items/populated-items-slice';
import {
	appendMessagesToMessagesSlice,
	getUseEmailStoreAndHooksForTesting,
	resetMessagesAndPopulatedItems,
	refreshMessagesInEmailStore,
	setMessagesInEmailStore,
	updateMessages,
	updateMessagesResultsLoadingStatus,
	useMessageById,
	useMessageIndexSlice,
	useMessagesByIds,
	useMessagesIdsByFolder
} from 'store/emails/store';

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

	describe('refreshMessagesInEmailStore', () => {
		it('should replace the list and keep the messages that are no longer in it', async () => {
			setMessagesInEmailStore([message1, message2], true);

			await act(async () => refreshMessagesInEmailStore([message3], false, ['1', '2']));

			const { result: index } = renderHook(() => useMessageIndexSlice());
			expect(index.current).toEqual({
				messageListIndex: ['3'],
				more: false,
				offset: 0,
				status: 'fulfilled'
			});
			const { result: populated } = renderHook(() => usePopulatedItemsSlice());
			expect(Object.keys(populated.current.messages)).toEqual(['1', '2', '3']);
		});

		it('should keep an open message complete while updating what the list carries', async () => {
			const generatedMessage = generateMessage({ id: '1', isComplete: true, isRead: false });
			const openMessage = {
				...generatedMessage,
				participants: [
					...(generatedMessage.participants ?? []),
					{ type: ParticipantRole.CARBON_COPY, address: 'cc@example.com', fullName: 'Cc' }
				],
				messageIsFromExternalDomain: true,
				messageIsFromDistributionList: true,
				isReadReceiptRequested: true,
				html: false
			};
			setMessagesInEmailStore([openMessage], false);
			// a message of a list has no body, no headers (_attrs) and only the sender and the first recipient
			const listMessage = normalizeMailMessageFromSoap({
				m: {
					id: '1',
					l: openMessage.parent,
					f: '',
					e: [{ a: 'from@example.com', d: 'From', t: 'f' }],
					d: openMessage.date
				},
				isComplete: false,
				html: true
			});

			await act(async () => refreshMessagesInEmailStore([listMessage], false, ['1']));

			const { result } = renderHook(() => useMessageById('1'));
			expect(result.current).toEqual(
				expect.objectContaining({
					isComplete: true,
					read: true,
					body: openMessage.body,
					participants: openMessage.participants,
					messageIsFromExternalDomain: true,
					messageIsFromDistributionList: true,
					isReadReceiptRequested: true,
					html: false
				})
			);
		});

		it('should keep the messages of the pages loaded while the list was searched again', async () => {
			// the list had 2 messages when it was searched again, then a third one was loaded by scrolling
			setMessagesInEmailStore([message1, message2, message3], true);

			await act(async () =>
				refreshMessagesInEmailStore([generateMessage({ id: '4' }), message1], true, ['1', '2'])
			);

			const { result: index } = renderHook(() => useMessageIndexSlice());
			expect(index.current.messageListIndex).toEqual(['4', '1', '3']);
			expect(index.current.more).toBe(true);
		});

		it('should keep the messages of the pages loaded while a searched message was deleted', async () => {
			// the list had 2 messages when it was searched again, then the second one was deleted and
			// a third one was loaded by scrolling
			setMessagesInEmailStore([message1, message3], true);

			await act(async () => refreshMessagesInEmailStore([message1], true, ['1', '2']));

			const { result: index } = renderHook(() => useMessageIndexSlice());
			expect(index.current.messageListIndex).toEqual(['1', '3']);
		});

		it('should not keep the messages pushed down by the new ones while the list was searched again', async () => {
			// the list had 2 messages when it was searched again, then a new one was notified at the top
			setMessagesInEmailStore([generateMessage({ id: '9' }), message1, message2], true);

			await act(async () =>
				refreshMessagesInEmailStore([generateMessage({ id: '9' }), message1], false, ['1', '2'])
			);

			const { result: index } = renderHook(() => useMessageIndexSlice());
			expect(index.current.messageListIndex).toEqual(['9', '1']);
			expect(index.current.more).toBe(false);
		});

		it('should update an incomplete message with what the list carries', async () => {
			setMessagesInEmailStore([generateMessage({ id: '1', isRead: false })], false);
			const listMessage = normalizeMailMessageFromSoap({
				m: { id: '1', l: '2', f: '', e: [] },
				isComplete: false,
				html: true
			});

			await act(async () => refreshMessagesInEmailStore([listMessage], false, ['1']));

			const { result } = renderHook(() => useMessageById('1'));
			expect(result.current).toEqual(expect.objectContaining({ isComplete: false, read: true }));
		});
	});

	describe('getRefreshedListIndex', () => {
		it('should take the searched items as the search returns them', () => {
			expect(getRefreshedListIndex(['1', '2'], ['3', '1'], ['1', '2'])).toEqual({
				listIndex: ['3', '1'],
				keepsLaterPages: false
			});
		});

		it('should keep the items of the pages loaded by scrolling meanwhile', () => {
			expect(getRefreshedListIndex(['1', '2', '3'], ['4', '1'], ['1', '2'])).toEqual({
				listIndex: ['4', '1', '3'],
				keepsLaterPages: true
			});
		});

		it('should keep the items of the pages loaded by scrolling after a searched item was deleted', () => {
			expect(getRefreshedListIndex(['1', '3'], ['1'], ['1', '2'])).toEqual({
				listIndex: ['1', '3'],
				keepsLaterPages: true
			});
		});

		it('should keep at the top the items notified meanwhile which the search does not return', () => {
			expect(getRefreshedListIndex(['9', '1', '2'], ['1', '2'], ['1', '2'])).toEqual({
				listIndex: ['9', '1', '2'],
				keepsLaterPages: false
			});
		});

		it('should not keep the searched items pushed down by the notified ones', () => {
			expect(getRefreshedListIndex(['9', '1', '2'], ['9', '1'], ['1', '2'])).toEqual({
				listIndex: ['9', '1'],
				keepsLaterPages: false
			});
		});

		it('should keep the items notified into a list which was empty, without pages loaded by scrolling', () => {
			expect(getRefreshedListIndex(['9'], ['1', '2'], [])).toEqual({
				listIndex: ['9', '1', '2'],
				keepsLaterPages: false
			});
		});
	});
});
