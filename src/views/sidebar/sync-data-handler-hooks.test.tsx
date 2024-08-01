/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, ReactNode } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useRefresh } from '@zextras/carbonio-shell-ui';
import { Provider } from 'react-redux';

import { useSyncDataHandler } from './commons/sync-data-handler-hooks';
import { useNotify } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { updateConversations, useConversationById } from '../../store/zustand/message-store/store';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateStore } from '../../tests/generators/store';

const UNREAD = 'u';
const READ = '';
const FLAGGED = 'f';
const UNFLAGGED = '';

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

function mockSoapModifyForConversationAction(mailboxNumber: number, actions: Array<string>): void {
	mockSoapRefresh(mailboxNumber);
	const action = actions.join('');
	const soapNotify = {
		deleted: [],
		seq: 0,
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
	};
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}

describe('sync data handler', () => {
	const mailboxNumber = 1000;
	describe('conversations', () => {
		it('should mark conversation as read', async () => {
			updateConversations([generateConversation({ id: '123', messages: [], isRead: false })], 0);
			mockSoapModifyForConversationAction(mailboxNumber, [READ]);

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
			mockSoapModifyForConversationAction(mailboxNumber, [UNREAD]);

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
			mockSoapModifyForConversationAction(mailboxNumber, [FLAGGED]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.flagged).toBe(true);
			});
		});
		it('should mark conversation as unflagged', async () => {
			updateConversations([generateConversation({ id: '123', messages: [], isFlagged: true })], 0);
			mockSoapModifyForConversationAction(mailboxNumber, [UNFLAGGED]);

			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.flagged).toBe(false);
			});
		});
	});
});
