/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { useTags } from '../../../../../carbonio-ui-commons/store/zustand/tags/hooks';
import { tags as mockTags } from '../../../../../carbonio-ui-commons/test/mocks/tags/tags';
import { CONVACTIONS } from '../../../../../commons/utilities';
import { API_REQUEST_STATUS } from '../../../../../constants';
import { generateCompleteMessageFromAPI } from '../../../../../tests/generators/api';
import { generateConversation } from '../../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import {
	appendConversations,
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	updateConversationStatus,
	updateMessages,
	handleNotifyMessagesModified,
	updateMessageStatus,
	useConversationById,
	useConversationMessages,
	useConversationStatus,
	useMessageById,
	useMessageStatus,
	updateConversations,
	getUseEmailStoreAndHooksForTesting,
	handleDeleteAttachments,
	optimisticallyHandleMessageActions
} from '../../../store';

const { setMessagesInSearchSlice } = getUseEmailStoreAndHooksForTesting();

jest.mock('../../../../../carbonio-ui-commons/store/zustand/tags/hooks', () => ({
	useTags: jest.fn()
}));
describe('store-populated-items-slice', () => {
	describe('useConversationById', () => {
		it('should set and return a conversation', async () => {
			const conversation = generateConversation({ id: '1' });
			setSearchResultsByConversation([conversation], false);

			const { result } = renderHook(() => useConversationById('1'));

			expect(result.current).toEqual(conversation);
		});
	});

	describe('useConversationStatus', () => {
		it('should get undefined if conversation loading status not present', async () => {
			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBeUndefined();
		});
		it('should set and get conversation status if value present', async () => {
			updateConversationStatus('123', API_REQUEST_STATUS.fulfilled);

			const { result } = renderHook(() => useConversationStatus('123'));

			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});

	describe('useMessageById', () => {
		it('should update populated store messages', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message]);

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current).toEqual(message);
		});
	});
	describe('useConversationMessages', () => {
		it('should not override other conversation messages', async () => {
			const conversation1Messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			const conversation1 = generateConversation({ id: '1', messages: conversation1Messages });
			const conversation2Messages = [generateMessage({ id: '4' }), generateMessage({ id: '5' })];
			const conversation2 = generateConversation({ id: '2', messages: conversation2Messages });
			setSearchResultsByConversation([conversation1, conversation2], false);

			setMessagesInSearchSlice([...conversation1Messages, ...conversation2Messages]);

			await act(async () => {
				updateMessages([generateMessage({ id: '100' })]);
			});

			const { result: conversation2StoreMessages } = renderHook(() => useConversationMessages('2'));
			const messages2 = conversation2StoreMessages.current;
			expect(messages2).toHaveLength(2);
			expect(messages2[0].id).toBe('4');
			expect(messages2[1].id).toBe('5');
		});
	});

	describe('appendConversations', () => {
		it('should append conversations to the store when appendConversations is called', async () => {
			setSearchResultsByConversation([generateConversation({ id: '1', messages: [] })], false);

			await act(async () => {
				appendConversations(
					[generateConversation({ id: '2' }), generateConversation({ id: '3' })],
					0,
					false
				);
			});

			expect(renderHook(() => useConversationById('1')).result.current).toBeDefined();
			expect(renderHook(() => useConversationById('2')).result.current).toBeDefined();
			expect(renderHook(() => useConversationById('3')).result.current).toBeDefined();
		});
	});
	describe('updateMessageStatus', () => {
		it('should set message status if value present', async () => {
			updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);

			const { result } = renderHook(() => useMessageStatus('1'));

			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});
	describe('updateConversationsOnly', () => {
		it('should apply changes correctly', async () => {
			const conversation = generateConversation({
				id: '1',
				tags: ['tag1']
			});

			setSearchResultsByConversation([conversation], false);

			const newConversation = {
				...conversation,
				tags: []
			};

			await act(async () => {
				updateConversations([newConversation]);
			});
			const { result } = renderHook(() => useConversationById('1'));
			expect(result.current.tags).toEqual([]);
		});
	});
	describe('updateMessagesOnly', () => {
		it('should not unset fields on message', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.INBOX })]);

			await act(async () => {
				handleNotifyMessagesModified([generateMessage({ id: '1', folderId: undefined })]);
			});

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current.parent).toEqual(FOLDERS.INBOX);
		});
	});
	describe('updateMessagesOnly', () => {
		it('should apply changes correctly', async () => {
			const message1 = generateMessage({ id: '1', tags: ['tag1'] });
			const message2 = generateMessage({ id: '2', tags: ['tag2'] });
			setSearchResultsByMessage([message1, message2], false);

			const newMessage1 = { ...message1, tags: [] };
			const newMessage2 = { ...message2, tags: [] };

			await act(async () => {
				handleNotifyMessagesModified([newMessage1, newMessage2]);
			});
			const { result: resultMessage1 } = renderHook(() => useMessageById('1'));
			const { result: resultMessage2 } = renderHook(() => useMessageById('2'));
			expect(resultMessage1.current).toEqual(newMessage1);
			expect(resultMessage2.current).toEqual(newMessage2);
		});
	});

	describe('handleDeleteAttachments', () => {
		it('should delete attachment from message', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message]);

			await act(async () => {
				handleDeleteAttachments({ m: [generateCompleteMessageFromAPI({ id: '1', mp: [] })] });
			});

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current.parts?.length).toBe(0);
		});
	});

	describe('optimisticallyHandleMessageActions', () => {
		it('should flag a message when operation is FLAG', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([{ ...message, flagged: false }]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.FLAG
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.flagged).toBe(true);
			});
		});

		it('should unflag a message when operation is UNFLAG', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([{ ...message, flagged: true }]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.UNFLAG
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.flagged).toBe(false);
			});
		});

		it('should mark a message as read when operation is MARK_READ', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([{ ...message, read: false }]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.MARK_READ
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.read).toBe(true);
			});
		});

		it('should mark a message as unread when operation is MARK_AS_UNREAD', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([{ ...message, read: true }]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.MARK_UNREAD
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.read).toBe(false);
			});
		});

		it('should move a message to trash when operation is TRASH', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.TRASH
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.parent).toBe(FOLDERS.TRASH);
			});
		});

		it('should delete a message when operation is DELETE', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.DELETE
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current).not.toBeDefined();
			});
		});

		it('should move a message to a specified folder when operation is MOVE', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				parent: '77',
				operation: CONVACTIONS.MOVE
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.parent).toBe('77');
			});
		});

		it('should move a message to inbox when operation is MOVE and no parent is specified', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.MOVE
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.parent).toBe(FOLDERS.INBOX);
			});
		});

		it('should mark a message as spam when operation is MARK_SPAM', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([{ ...message, parent: FOLDERS.INBOX }]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.MARK_SPAM
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.parent).toBe(FOLDERS.SPAM);
			});
		});

		it('should mark a message as not spam when operation is MARK_NOT_SPAM', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([{ ...message, parent: FOLDERS.SPAM }]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.MARK_NOT_SPAM
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.parent).toBe(FOLDERS.INBOX);
			});
		});

		it('should tag a message when operation is TAG and tagName is provided', async () => {
			(useTags as jest.Mock).mockReturnValue(mockTags);
			const message = generateMessage({ id: '1' });
			updateMessages([message]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.TAG,
				tagName: 'Test555'
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.tags).toEqual(['Test555']);
			});
		});

		it('should untag a message when operation is UNTAG and tagName is provided', async () => {
			(useTags as jest.Mock).mockReturnValue(mockTags);
			const message = generateMessage({ id: '1', tags: ['Test555', 'AnotherTag'] });
			updateMessages([message]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.UNTAG,
				tagName: 'Test555'
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.tags).toEqual(['AnotherTag']);
			});
		});
	});
});
