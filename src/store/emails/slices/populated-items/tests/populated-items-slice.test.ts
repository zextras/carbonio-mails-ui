/* eslint-disable */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { awaitExpression } from '@babel/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { useTags } from '../../../../../carbonio-ui-commons/store/zustand/tags';
import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import { tags as mockTags } from '../../../../../carbonio-ui-commons/test/mocks/tags/tags';
import { buildSoapErrorResponseBody } from '../../../../../carbonio-ui-commons/test/mocks/utils/soap';
import { CONVACTIONS } from '../../../../../commons/utilities';
import { API_REQUEST_STATUS } from '../../../../../constants';
import { generateCompleteMessageFromAPI } from '../../../../../tests/generators/api';
import {
	generateConversation,
	populateConversationInEmailStore
} from '../../../../../tests/generators/generateConversation';
import {
	generateMessage,
	populateMessagesInEmailStore
} from '../../../../../tests/generators/generateMessage';
import { ConvActionResponse, IncompleteMessage, MailMessage } from '../../../../../types';
import {
	appendConversations,
	getConversationMessages,
	getUseEmailStoreAndHooksForTesting,
	handleConvActionResponse,
	handleDeleteAttachments,
	handleNotifyMessagesModified,
	optimisticallyHandleConvActions,
	optimisticallyHandleMessageActions,
	setConversationsInEmailStore,
	setMessagesInEmailStore,
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	createOrUpdateConversations,
	updateConversationStatus,
	createOrUpdateMessages,
	updateMessageStatus,
	useConversationById,
	useConversationIndexSlice,
	useConversationMessages,
	useConversationsByIds,
	useConversationStatus,
	useMessageById,
	useMessagesByFolder,
	useMessagesByIds,
	useMessageStatus
} from '../../../store';

const { setMessagesInSearchSlice } = getUseEmailStoreAndHooksForTesting();

jest.mock('../../../../../carbonio-ui-commons/store/zustand/tags/hooks', () => ({
	useTags: jest.fn()
}));

describe('store-populated-items-slice', () => {
	describe('updateMessages', () => {
		it('updates messages correctly', async () => {
			const messages = [generateMessage({ id: '1' }), generateMessage({ id: '2' })];
			act(() => {
				createOrUpdateMessages(messages);
			});

			const { result: message1 } = renderHook(() => useMessageById('1'));
			const { result: message2 } = renderHook(() => useMessageById('2'));

			expect(message1.current?.id).toBe('1');
			expect(message2.current?.id).toBe('2');
		});

		it('does not update messages without id', async () => {
			const messages = [
				{ ...generateMessage({}), id: undefined as never, folderId: FOLDERS.INBOX }, // No id
				generateMessage({ id: '2', folderId: FOLDERS.INBOX }) // Has id
			];

			act(() => {
				createOrUpdateMessages(messages);
			});

			// @ts-ignore
			const { result: messageWithoutId } = renderHook(() => useMessageById(undefined));
			const { result: message2 } = renderHook(() => useMessageById('2'));

			expect(messageWithoutId.current).toBeUndefined();
			expect(message2.current?.id).toBe('2');
		});

		it('updates message status to fulfilled if complete', () => {
			const messages = [generateMessage({ id: '1', isComplete: true })];
			act(() => {
				createOrUpdateMessages(messages);
			});

			const { result: message1 } = renderHook(() => useMessageById('1'));
			const { result: message1Status } = renderHook(() => useMessageStatus('1'));

			expect(message1.current?.id).toBe('1');
			expect(message1Status.current).toBe(API_REQUEST_STATUS.fulfilled);
		});

		it('does not update message status if not complete', () => {
			const messages = [generateMessage({ id: '1', isComplete: false })];
			act(() => {
				createOrUpdateMessages(messages);
			});

			const { result: message1 } = renderHook(() => useMessageById('1'));
			const { result: message1Status } = renderHook(() => useMessageStatus('1'));

			expect(message1.current?.id).toBe('1');
			expect(message1Status.current).toBeUndefined();
		});
	});

	describe('updateConversations', () => {
		it('updates conversations correctly', async () => {
			const conversationId = '1';

			const oldSubject = 'Old Subject';
			await waitFor(() => {
				populateConversationInEmailStore({
					conversationParams: {
						id: conversationId,
						subject: oldSubject,
						folderId: FOLDERS.INBOX
					}
				});
			});

			const updatedSubject = 'Updated Subject';
			const updatedConversation = generateConversation({
				id: conversationId,
				subject: updatedSubject
			});

			await act(async () => {
				createOrUpdateConversations([updatedConversation]);
			});

			const { result: updatedConversationFromStore } = renderHook(() =>
				useConversationById(conversationId)
			);

			expect(updatedConversationFromStore.current?.subject).not.toEqual(oldSubject);
			expect(updatedConversationFromStore.current?.subject).toEqual(updatedSubject);
		});
	});

	describe('useMessagesByIds', () => {
		it('returns messages by ids, respecting the order', async () => {
			const message1 = generateMessage({ id: '1' });
			const message2 = generateMessage({ id: '2' });
			const messages = [message1, message2];

			createOrUpdateMessages(messages);

			const { result } = renderHook(() => useMessagesByIds([message2.id, message1.id]));

			await waitFor(async () => {
				expect(result.current).toEqual([message2, message1]);
			});
		});
	});

	describe('useMessagesByFolder', () => {
		it('should return messages by folder', async () => {
			populateFoldersStore();

			const message1 = generateMessage({ id: '1', folderId: FOLDERS.INBOX });
			const message2 = generateMessage({ id: '2', folderId: FOLDERS.SENT });
			const messages = [message1, message2];

			setMessagesInEmailStore(messages, false);

			const { result } = renderHook(() => useMessagesByFolder(FOLDERS.INBOX));

			await waitFor(async () => {
				expect(result.current).toEqual([message1]);
			});
		});

		it('should return messages by folder keeping the order from the messageIndexSlice', async () => {
			populateFoldersStore();

			const message1 = generateMessage({ id: '1', folderId: FOLDERS.INBOX });
			const message2 = generateMessage({ id: '2', folderId: FOLDERS.INBOX });
			const message3 = generateMessage({ id: '3', folderId: FOLDERS.INBOX });
			const message4 = generateMessage({ id: '4', folderId: FOLDERS.SENT });

			const messages = [message2, message1, message4, message3];

			setMessagesInEmailStore(messages, false);

			const { result } = renderHook(() => useMessagesByFolder(FOLDERS.INBOX));

			await waitFor(async () => {
				expect(result.current).toEqual([message2, message1, message3]);
			});
		});

		it('should return an empty array if folder or messages are missing', async () => {
			const { result } = renderHook(() => useMessagesByFolder(FOLDERS.INBOX));

			expect(result.current).toHaveLength(0);
		});

		it('should return an empty array if folder is invalid', async () => {
			const { result } = renderHook(() => useMessagesByFolder('invalid-folder'));

			expect(result.current).toHaveLength(0);
		});
	});

	describe('useConversationsByIds', () => {
		it('returns conversation by ids, respecting the order', async () => {
			const conversation1 = generateConversation({ id: '1' });
			const conversation2 = generateConversation({ id: '2' });
			const conversations = [conversation1, conversation2];

			createOrUpdateConversations(conversations);

			const { result } = renderHook(() =>
				useConversationsByIds([conversation2.id, conversation1.id])
			);

			await waitFor(async () => {
				expect(result.current).toEqual([conversation2, conversation1]);
			});
		});
	});

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
			createOrUpdateMessages([message]);

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current).toEqual(message);
		});
	});

	describe('useConversationMessages', () => {
		it('should return messages from conversation', async () => {
			const conversationId = '1';

			await waitFor(() => {
				populateConversationInEmailStore({
					conversationParams: {
						id: conversationId
					},
					messageIds: ['10', '22', '35']
				});
			});

			const { result: conversationMessages } = renderHook(() =>
				useConversationMessages(conversationId)
			);

			expect(conversationMessages.current).toHaveLength(3);
			expect(conversationMessages.current[0].id).toBe('10');
			expect(conversationMessages.current[1].id).toBe('22');
			expect(conversationMessages.current[2].id).toBe('35');
		});

		it('should return an empty array if conversation or messages are missing', async () => {
			const conversationId = 'non-existent-id';

			const { result } = renderHook(() => useConversationMessages(conversationId));

			expect(result.current).toHaveLength(0);
		});

		it('should not override other conversation messages', async () => {
			const conversation1Messages = [
				generateMessage({ id: '1' }),
				generateMessage({ id: '2' }),
				generateMessage({ id: '3' })
			];
			const conversation1 = generateConversation({
				id: '1',
				messageIds: conversation1Messages.map((message) => message.id)
			});
			const conversation2Messages = [generateMessage({ id: '4' }), generateMessage({ id: '5' })];
			const conversation2 = generateConversation({
				id: '2',
				messageIds: conversation2Messages.map((message) => message.id)
			});
			setSearchResultsByConversation([conversation1, conversation2], false);

			setMessagesInSearchSlice([...conversation1Messages, ...conversation2Messages]);

			await act(async () => {
				createOrUpdateMessages([generateMessage({ id: '100' })]);
			});

			const { result: conversation2StoreMessages } = renderHook(() => useConversationMessages('2'));
			const messages2 = conversation2StoreMessages.current;
			expect(messages2).toHaveLength(2);
			expect(messages2[0].id).toBe('4');
			expect(messages2[1].id).toBe('5');
		});
	});

	describe('getConversationMessages', () => {
		it('should return messages from conversation', async () => {
			const conversationId = '1';

			await waitFor(() => {
				populateConversationInEmailStore({
					conversationParams: {
						id: conversationId
					},
					messageIds: ['10', '22', '35']
				});
			});

			await waitFor(() => {
				populateMessagesInEmailStore({
					messageGeneratorParams: [
						{ id: '10', cid: conversationId },
						{ id: '22', cid: conversationId },
						{ id: '35', cid: conversationId }
					]
				});
			});

			const messages = getConversationMessages(conversationId);

			expect(messages).toHaveLength(3);
			expect(messages[0].id).toBe('10');
			expect(messages[1].id).toBe('22');
			expect(messages[2].id).toBe('35');
		});

		it('should return an empty array if conversation or messages are missing', () => {
			const conversationId = 'non-existent-id';

			const messages = getConversationMessages(conversationId);

			expect(messages).toHaveLength(0);
		});
	});

	describe('appendConversations', () => {
		it('should append conversations to the store when appendConversations is called', async () => {
			setSearchResultsByConversation([generateConversation({ id: '1', messageIds: [] })], false);

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
				createOrUpdateConversations([newConversation]);
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

			expect(result.current?.parent).toEqual(FOLDERS.INBOX);
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
			createOrUpdateMessages([message]);

			await act(async () => {
				handleDeleteAttachments({ m: [generateCompleteMessageFromAPI({ id: '1', mp: [] })] });
			});

			const { result } = renderHook(() => useMessageById('1'));
			expect(result.current?.parts?.length).toBe(0);
		});

		it('should not delete attachment from message if API response contains FAULT', async () => {
			const message = generateMessage({ id: '1' });
			createOrUpdateMessages([message]);
			const attachmentCountsBeforeAPICall = message?.parts?.length;

			const response: ErrorSoapBodyResponse = buildSoapErrorResponseBody({ reason: 'any reason' });

			await act(async () => {
				handleDeleteAttachments(response);
			});

			const { result } = renderHook(() => useMessageById('1'));
			expect(result.current?.parts?.length).toBe(attachmentCountsBeforeAPICall);
		});

		it('should not affect other messages in the store if there is no message in the store to update', async () => {
			const message = generateMessage({ id: '1' });
			createOrUpdateMessages([message]);

			await act(async () => {
				handleDeleteAttachments({ m: [generateCompleteMessageFromAPI({ id: '2', mp: [] })] });
			});

			const { result } = renderHook(() => useMessageById('1'));
			expect(result.current?.parts?.length).toBe(1);
		});
	});

	describe('optimisticallyHandleMessageActions', () => {
		it('should flag a message when operation is FLAG', async () => {
			const message = generateMessage({ id: '1' });
			createOrUpdateMessages([{ ...message, flagged: false }]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.FLAG
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.flagged).toBe(true);
			});
		});

		it('should un-flag a message when operation is UNFLAG', async () => {
			const message = generateMessage({ id: '1' });
			createOrUpdateMessages([{ ...message, flagged: true }]);
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
			createOrUpdateMessages([{ ...message, read: false }]);
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
			createOrUpdateMessages([{ ...message, read: true }]);
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
			createOrUpdateMessages([message]);
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
			createOrUpdateMessages([message]);
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
			createOrUpdateMessages([message]);
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
			createOrUpdateMessages([message]);
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
			createOrUpdateMessages([{ ...message, parent: FOLDERS.INBOX }]);
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
			createOrUpdateMessages([{ ...message, parent: FOLDERS.SPAM }]);
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
			createOrUpdateMessages([message]);
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
			createOrUpdateMessages([message]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.UNTAG,
				tagName: 'Test555'
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.tags).toEqual(['AnotherTag']);
			});
		});

		it('should not untag a message when operation is UNTAG but tagName is not provided or is undefined', async () => {
			(useTags as jest.Mock).mockReturnValue(mockTags);
			const message = generateMessage({ id: '1', tags: ['Test555', 'AnotherTag'] });
			createOrUpdateMessages([message]);
			optimisticallyHandleMessageActions({
				ids: ['1'],
				operation: CONVACTIONS.UNTAG
			});
			await waitFor(async () => {
				expect(renderHook(() => useMessageById('1')).result.current?.tags).toEqual([
					'Test555',
					'AnotherTag'
				]);
			});
		});
	});

	describe('optimisticallyHandleConvActions', () => {
		it('should flag a conversation when operation is FLAG', async () => {
			const conversation = generateConversation({ id: '1' });
			setConversationsInEmailStore([conversation], false);
			optimisticallyHandleConvActions({
				ids: ['1'],
				operation: CONVACTIONS.FLAG
			});
			await waitFor(async () => {
				expect(renderHook(() => useConversationById('1')).result.current?.flagged).toBe(true);
			});
		});

		it('should un-flag a conversation when operation is UNFLAG', async () => {
			const conversation = generateConversation({ id: '1', isFlagged: true });
			setConversationsInEmailStore([conversation], false);
			optimisticallyHandleConvActions({
				ids: ['1'],
				operation: CONVACTIONS.UNFLAG
			});
			await waitFor(async () => {
				expect(renderHook(() => useConversationById('1')).result.current?.flagged).toBe(false);
			});
		});

		it('should mark a conversation as read when operation is MARK_READ', async () => {
			const conversation = generateConversation({ id: '1', isRead: false });
			setConversationsInEmailStore([conversation], false);
			optimisticallyHandleConvActions({
				ids: ['1'],
				operation: CONVACTIONS.MARK_READ
			});
			await waitFor(async () => {
				expect(renderHook(() => useConversationById('1')).result.current?.read).toBe(true);
			});
		});

		it('should mark a conversation as unread when operation is MARK_UNREAD', async () => {
			const conversation = generateConversation({ id: '1', isRead: true });
			setConversationsInEmailStore([conversation], false);
			optimisticallyHandleConvActions({
				ids: ['1'],
				operation: CONVACTIONS.MARK_UNREAD
			});
			await waitFor(async () => {
				expect(renderHook(() => useConversationById('1')).result.current?.read).toBe(false);
			});
		});
	});

	describe('handleConvActionResponse', () => {
		it('should handle a Fault response by updating conversation flags when operation is FLAG', async () => {
			const conversation = generateConversation({ id: '1', isFlagged: false });
			setConversationsInEmailStore([conversation], false);
			const convActionParams = {
				ids: ['1'],
				operation: CONVACTIONS.FLAG
			};
			const response: ErrorSoapBodyResponse = buildSoapErrorResponseBody({ reason: 'any reason' });

			handleConvActionResponse(response, convActionParams);
			const { result } = renderHook(() => useConversationById('1'));
			await waitFor(async () => {
				expect(result.current?.flagged).toBe(false);
			});
		});

		it('should handle a Fault response by updating conversation flags when operation is UNFLAG', async () => {
			const conversation = generateConversation({ id: '1', isFlagged: true });
			setConversationsInEmailStore([conversation], false);
			const convActionParams = {
				ids: ['1'],
				operation: CONVACTIONS.UNFLAG
			};
			const response: ErrorSoapBodyResponse = buildSoapErrorResponseBody({ reason: 'any reason' });

			handleConvActionResponse(response, convActionParams);
			const { result } = renderHook(() => useConversationById('1'));
			await waitFor(async () => {
				expect(result.current?.flagged).toBe(true);
			});
		});

		it('should handle a Fault response by updating conversation read status when operation is MARK_READ', async () => {
			const conversation = generateConversation({ id: '1', isRead: false });
			setConversationsInEmailStore([conversation], false);
			const convActionParams = {
				ids: ['1'],
				operation: CONVACTIONS.MARK_READ
			};
			const response: ErrorSoapBodyResponse = buildSoapErrorResponseBody({ reason: 'any reason' });

			handleConvActionResponse(response, convActionParams);
			const { result } = renderHook(() => useConversationById('1'));
			await waitFor(async () => {
				expect(result.current?.read).toBe(false);
			});
		});

		it('should handle a Fault response by updating conversation read status when operation is MARK_UNREAD', async () => {
			const conversation = generateConversation({ id: '1', isRead: true });
			setConversationsInEmailStore([conversation], false);
			const convActionParams = {
				ids: ['1'],
				operation: CONVACTIONS.MARK_UNREAD
			};
			const response: ErrorSoapBodyResponse = buildSoapErrorResponseBody({ reason: 'any reason' });

			handleConvActionResponse(response, convActionParams);
			const { result } = renderHook(() => useConversationById('1'));
			await waitFor(async () => {
				expect(result.current?.read).toBe(true);
			});
		});

		it('should do nothing if the response is null', async () => {
			const conversation = generateConversation({ id: '1' });
			setConversationsInEmailStore([conversation], false);
			const convActionParams = {
				ids: ['1'],
				operation: CONVACTIONS.MARK_UNREAD
			};

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			handleConvActionResponse(null, convActionParams);
			const { result } = renderHook(() => useConversationById('1'));
			await waitFor(async () => {
				expect(result.current).toEqual(conversation);
			});
		});

		it('should delete conversations if action is DELETE', async () => {
			const conversation1 = generateConversation({ id: '1' });
			const conversation2 = generateConversation({ id: '2' });
			setConversationsInEmailStore([conversation1, conversation2], false);
			const convActionParams = {
				ids: ['1'],
				operation: CONVACTIONS.DELETE
			};

			const response: ConvActionResponse = {
				action: {
					id: '1',
					op: CONVACTIONS.DELETE
				}
			};
			handleConvActionResponse(response, convActionParams);
			const { result: list } = renderHook(() => useConversationIndexSlice());
			await waitFor(async () => {
				expect(list.current?.conversationListIndex).toEqual(['2']);
			});
			const { result: conversation1Result } = renderHook(() => useConversationById('1'));
			await waitFor(async () => {
				expect(conversation1Result.current).toBeUndefined();
			});
		});

		it('should not delete existing conversations in the store if the requested conversation does not exists in the store ', async () => {
			const conversation1 = generateConversation({ id: '1' });
			const conversation2 = generateConversation({ id: '2' });
			setConversationsInEmailStore([conversation1, conversation2], false);
			const convActionParams = {
				ids: ['3'],
				operation: CONVACTIONS.DELETE
			};

			const response: ConvActionResponse = {
				action: {
					id: '3',
					op: CONVACTIONS.DELETE
				}
			};
			handleConvActionResponse(response, convActionParams);
			const { result: list } = renderHook(() => useConversationIndexSlice());
			await waitFor(async () => {
				expect(list.current?.conversationListIndex).toEqual(['1', '2']);
			});
		});
	});
});
