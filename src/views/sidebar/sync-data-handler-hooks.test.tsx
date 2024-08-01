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
	updateConversations,
	updateMessages,
	useConversationById,
	useMessageById
} from '../../store/zustand/message-store/store';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';

const UNREAD = 'u';
const READ = '';
const FLAGGED = 'f';
const NOTFLAGGED = '';
const MARK_AS_SPAM = 's';
const NOT_SPAM = '';

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

function mockSoapModifyConversationFolder(
	mailboxNumber: number,
	messageId: string,
	folder: string
): void {
	mockSoapRefresh(mailboxNumber);
	const soapNotify = generateSoapAction({
		modified: {
			// TODO: mbx is optional and not always received from API, consider removing it in shell-ui
			mbx: [{ s: mailboxNumber }],
			c: [
				{
					id: messageId,
					l: folder
				}
			]
		}
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}

describe('sync data handler', () => {
	const mailboxNumber = 1000;
	describe('conversations', () => {
		it('should mark conversation as read', async () => {
			updateConversations([generateConversation({ id: '123', messages: [], isRead: false })], 0);
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
			updateConversations([generateConversation({ id: '123', messages: [], isRead: true })], 0);
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
			updateConversations([generateConversation({ id: '123', messages: [], isFlagged: false })], 0);
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
			updateConversations([generateConversation({ id: '123', messages: [], isFlagged: true })], 0);
			mockSoapModifyConversationAction(mailboxNumber, [NOTFLAGGED]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.flagged).toBe(false);
			});
		});

		// DOUBT: is it possible to mark a whole conversation as SPAM?
		it.skip('should mark conversation as spam', async () => {
			updateConversations(
				[generateConversation({ id: '123', folderId: FOLDERS.INBOX, messages: [] })],
				0
			);
			mockSoapModifyConversationFolder(mailboxNumber, '123', FOLDERS.SPAM);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.parent).toBe(FOLDERS.SPAM);
			});
		});
		it.skip('should mark conversation as not spam', async () => {
			updateConversations(
				[generateConversation({ id: '123', folderId: FOLDERS.SPAM, messages: [] })],
				0
			);
			mockSoapModifyConversationFolder(mailboxNumber, '123', FOLDERS.INBOX);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.parent).toBe(FOLDERS.INBOX);
			});
		});
	});

	describe('messages', () => {
		it('should mark messages as read', async () => {
			updateMessages([generateMessage({ id: '1', isRead: false })], 0);
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
			updateMessages([generateMessage({ id: '1', isRead: true })], 0);
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
			updateMessages([generateMessage({ id: '1', isFlagged: false })], 0);
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
			updateMessages([generateMessage({ id: '1', isFlagged: true })], 0);
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
			updateMessages([generateMessage({ id: '1', folderId: FOLDERS.INBOX })], 0);
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
			updateMessages([generateMessage({ id: '1', folderId: FOLDERS.SPAM })], 0);
			mockSoapModifyMessageFolder(mailboxNumber, '1', FOLDERS.INBOX);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useMessageById('1'));
			await waitFor(() => {
				expect(result.current.parent).toBe(FOLDERS.INBOX);
			});
		});
	});
});
