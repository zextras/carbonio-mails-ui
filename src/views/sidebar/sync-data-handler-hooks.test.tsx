/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, ReactNode } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { SoapNotify, useRefresh } from '@zextras/carbonio-shell-ui';
import { SoapRefresh } from '@zextras/carbonio-shell-ui/lib/types/network';
import { Provider } from 'react-redux';

import { useSyncDataHandler } from './commons/sync-data-handler-hooks';
import { useNotify } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import {
	updateConversations,
	updateMessages,
	useConversationById
} from '../../store/zustand/message-store/store';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';

const UNREAD = 'u';
const READ = '';
const FLAGGED = 'f';

function getWrapper() {
	// eslint-disable-next-line react/display-name
	return ({ children }: { children: ReactNode }): ReactElement => (
		<Provider store={generateStore()}>{children}</Provider>
	);
}

function getSoapRefresh(mailbox: number): SoapRefresh {
	return {
		mbx: [{ s: mailbox }]
	};
}

describe('sync data handler', () => {
	const mailboxNumber = 1000;
	describe('conversations', () => {
		it('should mark conversation as unread', async () => {
			const message = generateMessage({ id: '100', isRead: true });
			updateConversations(
				[generateConversation({ id: '123', messages: [message], isRead: true })],
				0
			);
			updateMessages([message], 0);
			const numberOfUnreadMessages = 1;
			const soapRefresh: SoapRefresh = getSoapRefresh(mailboxNumber);
			const soapNotify: SoapNotify = {
				deleted: [],
				seq: 0,
				modified: {
					// TODO: mbx is optional and not always received from API, consider removing it in shell-ui
					mbx: [{ s: mailboxNumber }],
					c: [
						{
							id: '123',
							f: `s${UNREAD}`,
							u: numberOfUnreadMessages
						}
					]
				}
			};
			(useNotify as jest.Mock).mockReturnValue([soapNotify]);
			(useRefresh as jest.Mock).mockReturnValue(soapRefresh);
			renderHook(() => useSyncDataHandler(), {
				wrapper: getWrapper()
			});

			const { result } = renderHook(() => useConversationById('123'));
			await waitFor(() => {
				expect(result.current.read).toBe(false);
			});
		});
	});
});
