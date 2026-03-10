/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import {
	FOLDERS,
	folderWorker,
	tagsWorker,
	useFolderStore,
	useTagStore
} from '@zextras/carbonio-ui-commons';
import { http } from 'msw';
import { vi } from 'vitest';

import { getSetupServer } from '../../../../__test__/vitest-setup';
import { normalizeConversations } from '../../../../normalizations/normalize-conversation';
import {
	mockShellSoapNotify,
	mockSoapCreateConversation,
	mockSoapCreateMessage,
	mockSoapCreateMessageAndConversation,
	mockSoapDelete,
	mockSoapMessageActionAndConversationModified,
	mockSoapModifyConversationAction,
	mockSoapModifyMessage,
	mockSoapModifyMessageAction,
	mockSoapModifyMessageFolder,
	mockSoapRefresh,
	mockSoapSync
} from '../../tests/test-helpers';
import { setupHook } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { handleGetFolderRequest } from '@test-utils/network/msw/handle-get-folder';
import { handleGetShareInfoRequest } from '@test-utils/network/msw/handle-get-share-info';
import { populateFoldersStore } from '@test-utils/store/folders';
import { generateConversationFromAPI, generateMessageFromAPI } from '__test__/generators/api';
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import {
	getMessageById,
	getUseEmailStoreAndHooksForTesting,
	setConversationsInEmailStore,
	setSearchResultsByConversation,
	setSearchResultsByMessage,
	useConversationById,
	useConversationIndexSlice,
	useConversationsByIds,
	useMessageById
} from 'store/emails/store';
import * as triggerNotification from 'store/emails/sync-data-handler/trigger-notification';
import { SoapConversation } from 'types/soap/soap-conversation';
import { SoapIncompleteMessage, SoapMailMessage } from 'types/soap/soap-mail-message';
import { useSyncDataHandler } from 'views/sidebar/commons/use-sync-data-handler';

const UNREAD = 'u';
const READ = '';
const FLAGGED = 'f';
const NOTFLAGGED = '';

const { setMessagesInSearchSlice } = getUseEmailStoreAndHooksForTesting();
vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	folderWorker: {
		postMessage: vi.fn()
	},
	tagsWorker: {
		postMessage: vi.fn()
	}
}));
vi.mock('../../../../store/emails/sync-data-handler/trigger-notification', () => ({
	triggerNotification: vi.fn()
}));

function getSoapMessage(
	messageId: string,
	initialData?: Partial<SoapIncompleteMessage>
): SoapMailMessage {
	return {
		id: messageId,
		cid: '1',
		e: [],
		su: 'message Subject',
		s: 71116,
		l: '2',
		f: 'au',
		fr: 'fragment',
		mp: [],
		d: 1717752296000,
		...initialData
	};
}

function getSoapConversation(id: string): SoapConversation {
	return {
		id,
		n: 1,
		u: 1,
		f: 'flag',
		tn: 'tag names',
		d: 123,
		m: [getSoapMessage('123')],
		e: [],
		su: 'conversations Subject',
		fr: 'fragment'
	};
}

describe('sync data handler', () => {
	const mailboxNumber = 1000;
	describe('conversations', () => {
		it('should add new conversations to the store when created', async () => {
			populateFoldersStore();
			setConversationsInEmailStore(normalizeConversations([getSoapConversation('1')]), false);
			const newConversation = getSoapConversation('2');
			mockSoapCreateConversation([newConversation]);

			setupHook(() => useSyncDataHandler());

			const expectedConversationsInStore = ['1', '2'];
			const { result: conversationsInStore } = renderHook(() =>
				useConversationsByIds(expectedConversationsInStore)
			);

			await waitFor(() => {
				expect(conversationsInStore.current.length).toBe(2);
			});

			await waitFor(() => {
				expect(conversationsInStore.current.map((c) => c.id)).toEqual(expectedConversationsInStore);
			});
		});

		it('should not duplicate conversations when created', async () => {
			setConversationsInEmailStore(normalizeConversations([getSoapConversation('1')]), false);

			const newConversation = getSoapConversation('1');
			mockSoapCreateConversation([newConversation]);

			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => {
				setupHook(() => useSyncDataHandler());
			});
			const { result: conversationsInStore } = renderHook(() => useConversationsByIds(['1']));

			expect(conversationsInStore.current.length).toBe(1);
			expect(conversationsInStore.current.map((c) => c.id)).toEqual(['1']);
		});

		it('should handle empty conversations array', async () => {
			mockSoapCreateConversation([]);

			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => {
				setupHook(() => useSyncDataHandler());
			});

			const { result: conversationsInStore } = renderHook(() => useConversationsByIds([]));
			await waitFor(() => {
				expect(conversationsInStore.current).toEqual([]);
			});
		});

		it('should delete conversation', async () => {
			populateFoldersStore();
			setConversationsInEmailStore([generateConversation({ id: '10' })], false);
			mockShellSoapNotify({
				deleted: ['10']
			});
			const { result: conversationsInStoreBeforeUpdate } = renderHook(() =>
				useConversationIndexSlice()
			);
			expect(conversationsInStoreBeforeUpdate.current.conversationListIndex.length).toBe(1);

			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => {
				setupHook(() => useSyncDataHandler());
			});

			const { result: conversationsInStore } = renderHook(() => useConversationIndexSlice());
			await waitFor(() => {
				expect(conversationsInStore.current.conversationListIndex.length).toBe(0);
			});
		});

		it('should add new conversations to the store when the convId changes from negative to positive', async () => {
			populateFoldersStore();

			await waitFor(() => {
				setConversationsInEmailStore(
					[generateConversation({ id: '-1', folderId: FOLDERS.INBOX })],
					false
				);
			});

			const { result: conversationsInStoreBefore } = renderHook(() => useConversationIndexSlice());
			expect(conversationsInStoreBefore.current.conversationListIndex.length).toBe(1);

			const newConversation = getSoapConversation('1');
			const newMessages = getSoapMessage('100', { cid: '1', l: FOLDERS.INBOX });
			mockShellSoapNotify({
				created: {
					m: [newMessages],
					c: [newConversation]
				},
				deleted: ['-1']
			});

			setupHook(() => useSyncDataHandler());

			const { result: conversationSlice } = renderHook(() => useConversationIndexSlice());

			await waitFor(() => expect(conversationSlice.current.conversationListIndex.length).toBe(1));
			const expectedConversationsInStore = ['1'];
			await waitFor(() =>
				expect(conversationSlice.current.conversationListIndex).toEqual(
					expectedConversationsInStore
				)
			);
		});

		it('should mark conversation as read', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messageIds: [], isRead: false })],
				false
			);
			mockSoapModifyConversationAction(mailboxNumber, [READ]);

			setupHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current?.read).toBe(true);
			});
		});

		it('should mark conversation as unread', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messageIds: [], isRead: true })],
				false
			);
			mockSoapModifyConversationAction(mailboxNumber, [UNREAD]);

			setupHook(() => useSyncDataHandler());

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current?.read).toBe(false);
			});
		});

		it('should mark conversation as flagged', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messageIds: [], isFlagged: false })],
				false
			);
			mockSoapModifyConversationAction(mailboxNumber, [FLAGGED]);

			setupHook(() => useSyncDataHandler());

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current?.flagged).toBe(true);
			});
		});

		it('should mark conversation as not flagged', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messageIds: [], isFlagged: true })],
				false
			);
			mockSoapModifyConversationAction(mailboxNumber, [NOTFLAGGED]);

			setupHook(() => useSyncDataHandler());

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current?.flagged).toBe(false);
			});
		});
	});

	describe('messages', () => {
		it('should mark messages as read', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: false })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [READ]);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});

			const message = getMessageById('1');
			expect(message.read).toBe(true);
		});

		it('should mark messages as unread', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: true })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [UNREAD], 2);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});

			const message = getMessageById('1');
			expect(message.read).toBe(false);
		});

		it('should not change flag read to true when f is undefined', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: false })]);
			mockSoapModifyMessage(mailboxNumber, '1', { t: '', tn: '' }, 2);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});

			const message = getMessageById('1');
			expect(message.read).toBe(false);
		});

		it('should not change flag read to false when f is undefined', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: true })]);
			mockSoapModifyMessage(mailboxNumber, '1', { t: '', tn: '' }, 2);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});

			const message = getMessageById('1');
			expect(message.read).toBe(true);
		});

		it('should mark messages as flagged', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', isFlagged: false })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [FLAGGED]);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.flagged).toBe(true);
			});
		});
		it('should mark messages as not flagged', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', isFlagged: true })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [NOTFLAGGED], 2);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});

			const message = getMessageById('1');
			expect(message.flagged).toBe(false);
		});

		it('should mark message as spam', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.INBOX })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.SPAM);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});

			const message = getMessageById('1');
			expect(message.parent).toBe(FOLDERS.SPAM);
		});
		it('should mark message as not spam', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.SPAM })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.INBOX);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});

			const message = getMessageById('1');
			expect(message.parent).toBe(FOLDERS.INBOX);
		});

		it('should move message to trash', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.INBOX })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.TRASH);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});
			const message = getMessageById('1');
			expect(message.parent).toBe(FOLDERS.TRASH);
		});

		it('should restore message', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.TRASH })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.INBOX);

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});
			const message = getMessageById('1');
			expect(message.parent).toBe(FOLDERS.INBOX);
		});

		it('should move message to a folder', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: 'aaa' })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', 'bbb');

			await act(async () => {
				await setupHook(() => useSyncDataHandler());
			});
			const message = getMessageById('1');
			expect(message.parent).toBe('bbb');
		});

		it('should remove messages from store when permanently deleted', async () => {
			const completeMessage1 = generateMessage({ id: '1', folderId: 'aaa', isComplete: true });
			const completeMessage2 = generateMessage({ id: '2', folderId: 'bbb', isComplete: true });
			const completeMessage3 = generateMessage({ id: '3', folderId: 'bbb', isComplete: true });
			setSearchResultsByMessage([completeMessage1, completeMessage2, completeMessage3], false);
			mockSoapDelete(mailboxNumber, ['1', '2']);

			setupHook(() => useSyncDataHandler());

			const { result: message1Result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(message1Result.current).toBeUndefined();
			});

			const { result: message2Result } = renderHook(() => useMessageById('2'));
			await waitFor(() => {
				expect(message2Result.current).toBeUndefined();
			});

			const { result: message3Result } = renderHook(() => useMessageById('3'));
			await waitFor(() => {
				expect(message3Result.current).toBeDefined();
			});
		});

		it('should add message to store when created', async () => {
			const messageSubject = 'Message subject';
			const completeMessage1 = generateMessageFromAPI({
				id: '1',
				su: messageSubject
			});
			mockSoapCreateMessage(mailboxNumber, [completeMessage1]);

			setupHook(() => useSyncDataHandler());

			const { result: message1Result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(message1Result.current).toEqual(
					expect.objectContaining({
						id: '1',
						subject: messageSubject
					})
				);
			});
		});

		it('should trigger a notification when a new message is received', async () => {
			const triggerNotificationSpy = vi.fn();
			vi.spyOn(triggerNotification, 'triggerNotification').mockImplementation(
				triggerNotificationSpy
			);
			const messageSubject = 'Message subject';
			const completeMessage1 = generateMessageFromAPI({
				id: '1',
				su: messageSubject
			});
			mockSoapCreateMessage(mailboxNumber, [completeMessage1]);

			setupHook(() => useSyncDataHandler(), {});

			await waitFor(async () => {
				expect(triggerNotificationSpy).toHaveBeenCalled();
			});
		});
	});

	describe('conversation and messages both', () => {
		it('should modify conversation and message by marking them as read', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messageIds: ['1'], isRead: false })],
				false
			);
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: false })]);

			mockSoapMessageActionAndConversationModified(mailboxNumber, '1', '123', [READ]);

			setupHook(() => useSyncDataHandler());

			const { result: conversationResult } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(conversationResult.current?.read).toBe(true);
			});

			const { result: messageResult } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(messageResult.current?.read).toBe(true);
			});
		});

		it('should create message and conversation when received', async () => {
			mockSoapCreateMessageAndConversation(
				mailboxNumber,
				[
					generateMessageFromAPI({
						id: '1',
						su: 'Message subject',
						cid: '123'
					})
				],
				[
					generateConversationFromAPI({
						id: '123',
						su: 'Conversation subject'
					})
				]
			);

			setupHook(() => useSyncDataHandler());

			const { result: conversationResult } = renderHook(() => useConversationById('123'));
			await act(async () => {
				expect(conversationResult.current).toBeDefined();
			});

			const { result: messageResult } = renderHook(() => useMessageById('1'));
			await act(async () => {
				expect(messageResult.current).toBeDefined();
			});
		});
	});

	describe('folders', () => {
		test('it will invoke the folders worker when a folders related notify is received', async () => {
			const folder = generateFolder({ id: '1' });
			useFolderStore.setState({ folders: { [folder.id]: folder } });
			const notify = { deleted: ['1'], seq: 0 };
			const workerSpy = vi.spyOn(folderWorker, 'postMessage');
			mockSoapDelete(mailboxNumber, ['1']);
			getSetupServer().use(http.post('/service/soap/GetFolderRequest', handleGetFolderRequest));
			getSetupServer().use(
				http.post('/service/soap/GetShareInfoRequest', handleGetShareInfoRequest)
			);

			mockSoapSync([notify]);
			setupHook(() => useSyncDataHandler());

			expect(workerSpy).toHaveBeenCalledTimes(1);
			expect(workerSpy).toHaveBeenCalledWith(
				expect.objectContaining({ op: 'notify', notify, state: expect.any(Object) })
			);
		});
	});

	describe('tags', () => {
		test('it will invoke the tags worker when a notify is received', async () => {
			useTagStore.setState({ tags: {} });
			const notify = { deleted: ['1'], seq: 0 };
			mockSoapDelete(mailboxNumber, ['1']);
			const workerSpy = vi.spyOn(tagsWorker, 'postMessage');
			mockSoapRefresh(mailboxNumber);
			setupHook(() => useSyncDataHandler());

			expect(workerSpy).toHaveBeenCalledTimes(1);
			expect(workerSpy).toHaveBeenCalledWith(
				expect.objectContaining({ op: 'notify', notify, state: expect.any(Object) })
			);
		});
	});

	describe('sequence number logic', () => {
		beforeAll(() => {
			/*
			 * Intercept and stop the postMessage calls to the workers because the current Worker mock is buggy
			 * and it causes a call to the "onMessage" event listener of the worker without a proper payload.
			 * This results in a reset of the stores (the tags store in this case) which leads to errors in the test execution
			 */
			vi.spyOn(tagsWorker, 'postMessage').mockImplementation(vi.fn());
		});

		it('should not process notify if seq is less than or equal to current seq (but not 1)', async () => {
			const sequence = 5;

			// First notify
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: false })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [READ], sequence);
			const { rerender } = await act(async () => setupHook(useSyncDataHandler));

			// Second notify with the same sequence number
			mockSoapModifyMessageAction(mailboxNumber, '1', [UNREAD], sequence);
			rerender();
			const {
				result: { current: message }
			} = setupHook(useMessageById, { initialProps: ['1'] });

			expect(message?.read).toBe(true);
		});

		it('should process notify if seq is 1 and current seq is greater than 1', async () => {
			const lastSequence = 5;

			// First notify
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: false })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [READ], lastSequence);
			const { rerender } = await act(async () => setupHook(useSyncDataHandler));

			// ...the backend resets the sequence number to 1...

			// Next notify after the idle period
			mockSoapModifyMessageAction(mailboxNumber, '1', [UNREAD], 1);
			rerender();
			const {
				result: { current: message }
			} = setupHook(useMessageById, { initialProps: ['1'] });

			expect(message?.read).toBe(false);
		});

		it('should process notify if seq is greater than current seq', async () => {
			// First notify
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: false })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [READ], 12);
			const { rerender } = await act(async () => setupHook(useSyncDataHandler));

			// Next notify
			mockSoapModifyMessageAction(mailboxNumber, '1', [UNREAD], 13);
			rerender();
			const {
				result: { current: message }
			} = setupHook(useMessageById, { initialProps: ['1'] });

			expect(message?.read).toBe(false);
		});
	});
});
