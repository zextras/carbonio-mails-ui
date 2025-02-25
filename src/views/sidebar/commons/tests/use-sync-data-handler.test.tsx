/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor, renderHook, act } from '@testing-library/react';
import { http } from 'msw';

import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { useFolderStore } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { getTags, useTagStore } from '../../../../carbonio-ui-commons/store/zustand/tags';
import { getSetupServer } from '../../../../carbonio-ui-commons/test/jest-setup';
import { useNotify } from '../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { generateFolder } from '../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { handleGetFolderRequest } from '../../../../carbonio-ui-commons/test/mocks/network/msw/handle-get-folder';
import { handleGetShareInfoRequest } from '../../../../carbonio-ui-commons/test/mocks/network/msw/handle-get-share-info';
import { populateFoldersStore } from '../../../../carbonio-ui-commons/test/mocks/store/folders';
import { folderWorker, tagsWorker } from '../../../../carbonio-ui-commons/worker';
import { normalizeConversations } from '../../../../normalizations/normalize-conversation';
import {
	useConversationById,
	useMessageById,
	setSearchResultsByMessage,
	setSearchResultsByConversation,
	getUseEmailStoreAndHooksForTesting,
	setConversationsInEmailStore,
	useConversationsByIds
} from '../../../../store/emails/store';
import {
	generateConversationFromAPI,
	generateMessageFromAPI
} from '../../../../tests/generators/api';
import { generateConversation } from '../../../../tests/generators/generateConversation';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { SoapConversation, SoapIncompleteMessage, SoapMailMessage } from '../../../../types';
import {
	mockSoapModifyConversationAction,
	mockSoapModifyMessageAction,
	mockSoapModifyMessageFolder,
	mockSoapDelete,
	mockSoapCreateMessage,
	mockSoapMessageActionAndConversationModified,
	mockSoapCreateMessageAndConversation,
	mockSoapRefresh,
	mockSoapCreateConversation
} from '../../tests/test-helpers';
import { useSyncDataHandler } from '../use-sync-data-handler';

getTags();
const UNREAD = 'u';
const READ = '';
const FLAGGED = 'f';
const NOTFLAGGED = '';

const { setMessagesInSearchSlice } = getUseEmailStoreAndHooksForTesting();

jest.mock('../../../../carbonio-ui-commons/store/zustand/tags', () => ({
	...jest.requireActual('../../../../carbonio-ui-commons/store/zustand/tags'),
	getTags: jest.fn()
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

			renderHook(() => useSyncDataHandler());

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
				renderHook(() => useSyncDataHandler());
			});
			const { result: conversationsInStore } = renderHook(() => useConversationsByIds(['1']));

			expect(conversationsInStore.current.length).toBe(1);
			expect(conversationsInStore.current.map((c) => c.id)).toEqual(['1']);
		});

		it('should handle empty conversations array', async () => {
			mockSoapCreateConversation([]);

			// eslint-disable-next-line testing-library/no-unnecessary-act
			await act(async () => {
				renderHook(() => useSyncDataHandler());
			});

			const { result: conversationsInStore } = renderHook(() => useConversationsByIds([]));
			await waitFor(() => {
				expect(conversationsInStore.current).toEqual([]);
			});
		});
		it('should mark conversation as read', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messageIds: [], isRead: false })],
				false
			);
			mockSoapModifyConversationAction(mailboxNumber, [READ]);

			renderHook(() => useSyncDataHandler(), {});

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

			renderHook(() => useSyncDataHandler(), {});

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

			renderHook(() => useSyncDataHandler(), {});

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

			renderHook(() => useSyncDataHandler(), {});

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

			renderHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.read).toBe(true);
			});
		});
		it('should mark messages as unread', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: true })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [UNREAD]);

			renderHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.read).toBe(false);
			});
		});

		it('should mark messages as flagged', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', isFlagged: false })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [FLAGGED]);

			renderHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.flagged).toBe(true);
			});
		});
		it('should mark messages as not flagged', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', isFlagged: true })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [NOTFLAGGED]);

			renderHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.flagged).toBe(false);
			});
		});

		it('should mark message as spam', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.INBOX })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.SPAM);

			renderHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.parent).toBe(FOLDERS.SPAM);
			});
		});
		it('should mark message as not spam', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.SPAM })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.INBOX);

			renderHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.parent).toBe(FOLDERS.INBOX);
			});
		});

		it('should move message to trash', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.INBOX })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.TRASH);

			renderHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.parent).toBe(FOLDERS.TRASH);
			});
		});

		it('should restore message', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: FOLDERS.TRASH })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.INBOX);

			renderHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.parent).toBe(FOLDERS.INBOX);
			});
		});

		it('should move message to a folder', async () => {
			setMessagesInSearchSlice([generateMessage({ id: '1', folderId: 'aaa' })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', 'bbb');

			renderHook(() => useSyncDataHandler(), {});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current?.parent).toBe('bbb');
			});
		});

		it('should remove messages from store when permanently deleted', async () => {
			const completeMessage1 = generateMessage({ id: '1', folderId: 'aaa', isComplete: true });
			const completeMessage2 = generateMessage({ id: '2', folderId: 'bbb', isComplete: true });
			const completeMessage3 = generateMessage({ id: '3', folderId: 'bbb', isComplete: true });
			setSearchResultsByMessage([completeMessage1, completeMessage2, completeMessage3], false);
			mockSoapDelete(mailboxNumber, ['1', '2']);

			renderHook(() => useSyncDataHandler(), {});

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

			renderHook(() => useSyncDataHandler(), {});

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
	});

	describe('conversation and messages both', () => {
		it('should modify conversation and message by marking them as read', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messageIds: ['1'], isRead: false })],
				false
			);
			setMessagesInSearchSlice([generateMessage({ id: '1', isRead: false })]);

			mockSoapMessageActionAndConversationModified(mailboxNumber, '1', '123', [READ]);

			renderHook(() => useSyncDataHandler(), {});

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

			renderHook(() => useSyncDataHandler(), {});

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
			const workerSpy = jest.spyOn(folderWorker, 'postMessage');
			mockSoapDelete(mailboxNumber, ['1']);
			getSetupServer().use(http.post('/service/soap/GetFolderRequest', handleGetFolderRequest));
			getSetupServer().use(
				http.post('/service/soap/GetShareInfoRequest', handleGetShareInfoRequest)
			);

			useNotify.mockReturnValueOnce([notify]);
			renderHook(() => useSyncDataHandler(), {});

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
			const workerSpy = jest.spyOn(tagsWorker, 'postMessage');
			mockSoapRefresh(mailboxNumber);
			renderHook(() => useSyncDataHandler(), {});

			expect(workerSpy).toHaveBeenCalledTimes(1);
			expect(workerSpy).toHaveBeenCalledWith(
				expect.objectContaining({ op: 'notify', notify, state: expect.any(Object) })
			);
		});
	});
});
