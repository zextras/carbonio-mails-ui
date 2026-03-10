/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { FOLDERS, useTags } from '@zextras/carbonio-ui-commons';
import { omit } from 'lodash';
import type { Mock } from 'vitest';

import { populateFoldersStore } from '@test-utils/store/folders';
import { tags as mockTags } from '@test-utils/tags/tags';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { generateCompleteMessageFromAPI } from '__test__/generators/api';
import {
	generateConversation,
	populateConversationInEmailStore
} from '__test__/generators/generateConversation';
import { generateMessage, populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { CONVACTIONS } from 'commons/utilities';
import { API_REQUEST_STATUS } from 'constants/index';
import {
	appendConversations,
	getConversationMessages,
	getConversationMessagesParents,
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
	updateConversations,
	updateConversationStatus,
	updateMessages,
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
} from 'store/emails/store';
import { MailMessage } from 'types/messages';
import { ConvActionResponse } from 'types/soap/conv-action';

const { setMessagesInSearchSlice } = getUseEmailStoreAndHooksForTesting();

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	useTags: vi.fn()
}));

describe('store-populated-items-slice', () => {
	describe('updateMessages', () => {
		it('updates messages correctly', async () => {
			const messages = [generateMessage({ id: '1' }), generateMessage({ id: '2' })];
			act(() => {
				updateMessages(messages);
			});

			const { result: message1 } = renderHook(() => useMessageById('1'));
			const { result: message2 } = renderHook(() => useMessageById('2'));

			expect(message1.current?.id).toBe('1');
			expect(message2.current?.id).toBe('2');
		});
		it('replaces the existing message with the new one when the new message is complete', async () => {
			const initialMessage = generateMessage({ id: '1', subject: 'initial subject' });
			await waitFor(async () => {
				setMessagesInEmailStore([initialMessage], false);
			});
			const updatedMessage = { ...initialMessage, isComplete: true, subject: undefined };
			act(() => {
				// passing undefined to subject to make sure it is not updated
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				updateMessages([updatedMessage]);
			});
			const { result: message1 } = renderHook(() => useMessageById('1'));
			expect(message1.current?.subject).toBe(undefined);
		});
		it('merges the existing message with the new one when the new message is not complete', async () => {
			const initialMessage = generateMessage({ id: '1', subject: 'initial subject' });
			await waitFor(async () => {
				setMessagesInEmailStore([initialMessage], false);
			});
			const updatedMessage = { ...initialMessage, isComplete: false, subject: undefined };
			act(() => {
				// passing undefined to subject to make sure it is not updated
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				updateMessages([updatedMessage]);
			});
			const { result: message1 } = renderHook(() => useMessageById('1'));
			expect(message1.current?.subject).toBe(initialMessage.subject);
		});
		describe('Updating Parts', () => {
			it('keeps the message original parts when new parts is an empty array', async () => {
				const originalParts = [
					{
						contentType: 'text/plain',
						size: 0,
						name: 'My Part'
					}
				];
				populateMessagesInEmailStore({
					messageGeneratorParams: [
						{
							id: '1',
							parts: originalParts
						}
					]
				});
				const messages = [
					generateMessage({
						id: '1',
						parts: []
					})
				];
				await act(async () => {
					updateMessages(messages);
				});

				const { result: message1 } = renderHook(() => useMessageById('1'));

				expect(message1.current?.parts).toEqual(originalParts);
			});
			it('updates the message with the new parts when new parts is a non-empty array', async () => {
				const originalParts = [
					{
						contentType: 'text/plain',
						size: 0,
						name: 'My Part'
					}
				];
				populateMessagesInEmailStore({
					messageGeneratorParams: [
						{
							id: '1',
							parts: originalParts
						}
					]
				});
				const newParts = [
					{
						contentType: 'text/html',
						size: 100,
						name: 'My Part updated'
					}
				];
				const messages = [
					generateMessage({
						id: '1',
						parts: newParts
					})
				];
				await act(async () => {
					updateMessages(messages);
				});

				const { result: message1 } = renderHook(() => useMessageById('1'));

				expect(message1.current?.parts).toEqual(newParts);
			});
		});

		it('does not update messages without id', async () => {
			const messages = [
				{ ...generateMessage({}), id: undefined as never, folderId: FOLDERS.INBOX }, // No id
				generateMessage({ id: '2', folderId: FOLDERS.INBOX }) // Has id
			];

			act(() => {
				updateMessages(messages);
			});

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const { result: messageWithoutId } = renderHook(() => useMessageById(undefined));
			const { result: message2 } = renderHook(() => useMessageById('2'));

			expect(messageWithoutId.current).toBeUndefined();
			expect(message2.current?.id).toBe('2');
		});

		it('updates message status to fulfilled if complete', () => {
			const messages = [generateMessage({ id: '1', isComplete: true })];
			act(() => {
				updateMessages(messages);
			});

			const { result: message1 } = renderHook(() => useMessageById('1'));
			const { result: message1Status } = renderHook(() => useMessageStatus('1'));

			expect(message1.current?.id).toBe('1');
			expect(message1Status.current).toBe(API_REQUEST_STATUS.fulfilled);
		});

		it('does not update message status if not complete', () => {
			const messages = [generateMessage({ id: '1', isComplete: false })];
			act(() => {
				updateMessages(messages);
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
				updateConversations([updatedConversation]);
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

			updateMessages(messages);

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

			updateConversations(conversations);

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
			updateMessages([message]);

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
				updateMessages([generateMessage({ id: '100' })]);
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

	describe('getConversationMessagesParents', () => {
		it('should return messages  parents from conversation', async () => {
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
						{ id: '10', cid: conversationId, folderId: FOLDERS.INBOX },
						{ id: '22', cid: conversationId, folderId: FOLDERS.TRASH },
						{ id: '35', cid: conversationId, folderId: FOLDERS.DRAFTS }
					]
				});
			});

			const messagesParents = getConversationMessagesParents(conversationId);

			expect(messagesParents).toHaveLength(3);
			expect(messagesParents[0]).toBe(FOLDERS.INBOX);
			expect(messagesParents[1]).toBe(FOLDERS.TRASH);
			expect(messagesParents[2]).toBe(FOLDERS.DRAFTS);
		});

		it('should return an empty array if conversation or messages are missing', () => {
			const conversationId = 'non-existent-id';

			const messagesParents = getConversationMessagesParents(conversationId);

			expect(messagesParents).toHaveLength(0);
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
				updateConversations([newConversation]);
			});
			const { result } = renderHook(() => useConversationById('1'));

			expect(result.current.tags).toEqual([]);
		});
	});

	describe('handleNotifyMessagesModified', () => {
		it('should not unset fields on message', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.INBOX })]);

			await act(async () => {
				handleNotifyMessagesModified([generateMessage({ id: '1', folderId: undefined })]);
			});

			const { result } = renderHook(() => useMessageById('1'));

			expect(result.current?.parent).toEqual(FOLDERS.INBOX);
		});

		describe('tags', () => {
			it('should apply changes when tags of the updated message are an empty array', async () => {
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

			it('should keep existing tags when updated message has no tags ', async () => {
				const message1 = generateMessage({ id: '1', tags: ['tag1'] });
				const message2 = generateMessage({ id: '2', tags: ['tag2'] });
				setSearchResultsByMessage([message1, message2], false);

				const newMessage1 = omit(message1, 'tags') as MailMessage;
				const newMessage2 = omit(message2, 'tags') as MailMessage;

				await act(async () => {
					handleNotifyMessagesModified([newMessage1, newMessage2]);
				});
				const { result: resultMessage1 } = renderHook(() => useMessageById('1'));
				const { result: resultMessage2 } = renderHook(() => useMessageById('2'));
				expect(resultMessage1.current).toEqual(message1);
				expect(resultMessage2.current).toEqual(message2);
			});
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
			expect(result.current?.parts?.length).toBe(0);
		});

		it('should not delete attachment from message if API response contains FAULT', async () => {
			const message = generateMessage({ id: '1' });
			updateMessages([message]);
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
			updateMessages([message]);

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
			updateMessages([{ ...message, flagged: false }]);
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
			(useTags as Mock).mockReturnValue(mockTags);
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
			(useTags as Mock).mockReturnValue(mockTags);
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

		it('should not untag a message when operation is UNTAG but tagName is not provided or is undefined', async () => {
			(useTags as Mock).mockReturnValue(mockTags);
			const message = generateMessage({ id: '1', tags: ['Test555', 'AnotherTag'] });
			updateMessages([message]);
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
