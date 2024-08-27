/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, ReactNode } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { SoapNotify, useRefresh } from '@zextras/carbonio-shell-ui';
import { Provider } from 'react-redux';

import { useSyncDataHandler } from './commons/sync-data-handler-hooks';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { useNotify } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import {
	setSearchResultsByConversation,
	setMessages,
	useConversationById,
	useMessageById,
	setSearchResultsByMessage
} from '../../store/zustand/search/store';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';

const UNREAD = 'u';
const READ = '';
const FLAGGED = 'f';
const NOTFLAGGED = '';

function getWrapper() {
	// eslint-disable-next-line react/display-name
	return ({ children }: { children: ReactNode }): ReactElement => (
		<Provider store={generateStore()}>{children}</Provider>
	);
}

function mockSoapRefresh(mailbox: number): void {
	(useRefresh as jest.Mock).mockReturnValue({
		mbx: [{ s: mailbox }]
	});
}

function generateSoapAction(partial?: Partial<SoapNotify>): SoapNotify {
	return {
		deleted: [],
		seq: 0,
		...partial
	};
}

function mockSoapModifyConversationAction(mailboxNumber: number, actions: Array<string>): void {
	mockSoapRefresh(mailboxNumber);
	const action = actions.join('');
	const soapNotify = generateSoapAction({
		modified: {
			// TODO: mbx is optional and not always received from API, consider removing it in shell-ui
			mbx: [{ s: mailboxNumber }],
			c: [
				{
					id: '123',
					f: `s${action}`
				}
			]
		}
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}

function mockSoapModifyMessageAction(
	mailboxNumber: number,
	messageId: string,
	actions: Array<string>
): void {
	mockSoapRefresh(mailboxNumber);
	const action = actions.join('');
	const soapNotify = generateSoapAction({
		modified: {
			mbx: [{ s: mailboxNumber }],
			m: [
				{
					id: messageId,
					f: `s${action}`
				}
			]
		}
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}

function mockSoapModifyMessageFolder(
	mailboxNumber: number,
	messageId: string,
	folder: string
): void {
	mockSoapRefresh(mailboxNumber);
	const soapNotify = generateSoapAction({
		modified: {
			// TODO: mbx is optional and not always received from API, consider removing it in shell-ui
			mbx: [{ s: mailboxNumber }],
			m: [
				{
					id: messageId,
					l: folder
				}
			]
		}
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}

function mockSoapDelete(mailboxNumber: number, deletedIds: Array<string>): void {
	mockSoapRefresh(mailboxNumber);
	const soapNotify = generateSoapAction({
		deleted: deletedIds
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}

describe('sync data handler', () => {
	const mailboxNumber = 1000;
	describe('conversations', () => {
		it('should mark conversation as read', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messages: [], isRead: false })],
				false
			);
			mockSoapModifyConversationAction(mailboxNumber, [READ]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.read).toBe(true);
			});
		});
		it('should mark conversation as unread', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messages: [], isRead: true })],
				false
			);
			mockSoapModifyConversationAction(mailboxNumber, [UNREAD]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.read).toBe(false);
			});
		});

		it('should mark conversation as flagged', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messages: [], isFlagged: false })],
				false
			);
			mockSoapModifyConversationAction(mailboxNumber, [FLAGGED]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.flagged).toBe(true);
			});
		});
		it('should mark conversation as not flagged', async () => {
			setSearchResultsByConversation(
				[generateConversation({ id: '123', messages: [], isFlagged: true })],
				false
			);
			mockSoapModifyConversationAction(mailboxNumber, [NOTFLAGGED]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.flagged).toBe(false);
			});
		});
	});

	describe('messages', () => {
		it('should mark messages as read', async () => {
			setMessages([generateMessage({ id: '1', isRead: false })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [READ]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.read).toBe(true);
			});
		});
		it('should mark messages as unread', async () => {
			setMessages([generateMessage({ id: '1', isRead: true })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [UNREAD]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.read).toBe(false);
			});
		});

		it('should mark messages as flagged', async () => {
			setMessages([generateMessage({ id: '1', isFlagged: false })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [FLAGGED]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.flagged).toBe(true);
			});
		});
		it('should mark messages as not flagged', async () => {
			setMessages([generateMessage({ id: '1', isFlagged: true })]);
			mockSoapModifyMessageAction(mailboxNumber, '1', [NOTFLAGGED]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.flagged).toBe(false);
			});
		});

		it('should mark message as spam', async () => {
			setMessages([generateMessage({ id: '1', folderId: FOLDERS.INBOX })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.SPAM);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.parent).toBe(FOLDERS.SPAM);
			});
		});
		it('should mark message as not spam', async () => {
			setMessages([generateMessage({ id: '1', folderId: FOLDERS.SPAM })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.INBOX);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.parent).toBe(FOLDERS.INBOX);
			});
		});

		it('should move message to trash', async () => {
			setMessages([generateMessage({ id: '1', folderId: FOLDERS.INBOX })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.TRASH);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.parent).toBe(FOLDERS.TRASH);
			});
		});

		it('should restore message', async () => {
			setMessages([generateMessage({ id: '1', folderId: FOLDERS.TRASH })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.INBOX);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.parent).toBe(FOLDERS.INBOX);
			});
		});

		it('should move message to a folder', async () => {
			setMessages([generateMessage({ id: '1', folderId: 'aaa' })]);
			mockSoapModifyMessageFolder(mailboxNumber, '1', 'bbb');

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.parent).toBe('bbb');
			});
		});

		it('should remove messages from store when permanently deleted', async () => {
			const completeMessage1 = generateMessage({ id: '1', folderId: 'aaa', isComplete: true });
			const completeMessage2 = generateMessage({ id: '2', folderId: 'bbb', isComplete: true });
			const completeMessage3 = generateMessage({ id: '3', folderId: 'bbb', isComplete: true });
			setSearchResultsByMessage([completeMessage1, completeMessage2, completeMessage3], false);
			mockSoapDelete(mailboxNumber, ['1', '2']);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

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
	});
});
