/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapNotify } from '@zextras/carbonio-shell-ui';
import { useInfoRefresh, useSync } from '@zextras/carbonio-ui-soap-lib';

import { SoapConversation } from 'types/soap/soap-conversation';
import { SoapIncompleteMessage } from 'types/soap/soap-mail-message';

export function mockSoapRefresh(mailbox: number): void {
	const result = {
		mbx: [{ s: mailbox }] satisfies [{ s: number }]
	};
	vi.mocked(useInfoRefresh).mockReturnValue(result);
}

export function mockSoapSync(notify: Array<SoapNotify>): void {
	vi.mocked(useSync).mockReturnValue(notify);
}

function generateSoapAction(partial?: Partial<SoapNotify>): SoapNotify {
	return {
		deleted: [],
		seq: 0,
		...partial
	};
}
export function mockSoapModifyConversationAction(
	mailboxNumber: number,
	actions: Array<string>
): void {
	mockSoapRefresh(mailboxNumber);
	const action = actions.join('');
	const soapNotify = generateSoapAction({
		modified: {
			// TODO: mbx is optional and not always received from API, consider removing it in shell-ui
			mbx: [{ s: mailboxNumber }],
			c: [
				{
					id: '123',
					f: action
				}
			]
		}
	});
	mockSoapSync([soapNotify]);
}
export function mockSoapModifyMessageAction(
	mailboxNumber: number,
	messageId: string,
	actions: Array<string>,
	seq?: number
): void {
	mockSoapRefresh(mailboxNumber);
	const action = actions.join('');
	const soapNotify = generateSoapAction({
		modified: {
			mbx: [{ s: mailboxNumber }],
			m: [
				{
					id: messageId,
					f: action
				}
			]
		},
		...(seq ? { seq } : {})
	});
	mockSoapSync([soapNotify]);
}

export function mockSoapModifyMessage(
	mailboxNumber: number,
	messageId: string,
	mod: Record<string, unknown>,
	seq?: number
): void {
	mockSoapRefresh(mailboxNumber);
	const soapNotify = generateSoapAction({
		modified: {
			mbx: [{ s: mailboxNumber }],
			m: [
				{
					id: messageId,
					...(mod ?? {})
				}
			]
		},
		...(seq ? { seq } : {})
	});
	mockSoapSync([soapNotify]);
}

export function mockSoapMessageActionAndConversationModified(
	mailboxNumber: number,
	messageId: string,
	conversationId: string,
	actions: Array<string>
): void {
	mockSoapRefresh(mailboxNumber);
	const action = actions.join('');
	const soapNotify = generateSoapAction({
		modified: {
			mbx: [{ s: 1000 }],
			m: [
				{
					id: messageId,
					f: action
				}
			],
			c: [
				{
					id: conversationId,
					f: action
				}
			]
		}
	});
	mockSoapSync([soapNotify]);
}

export function mockSoapModifyMessageFolder(
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
	mockSoapSync([soapNotify]);
}

export function mockSoapDelete(mailboxNumber: number, deletedIds: Array<string>): void {
	mockSoapRefresh(mailboxNumber);
	// TODO: check me, was: Array<string>
	const soapNotify = generateSoapAction({
		deleted: deletedIds
	});
	mockSoapSync([soapNotify]);
}

export function mockSoapCreateMessage(
	mailboxNumber: number,
	messages: Array<SoapIncompleteMessage>
): void {
	mockSoapRefresh(mailboxNumber);
	const soapNotify = generateSoapAction({
		created: {
			m: messages
		}
	});
	mockSoapSync([soapNotify]);
}

export function mockSoapCreateConversation(soapConversations: Array<SoapConversation>): void {
	const mailboxNumber = 1000;
	mockSoapRefresh(mailboxNumber);
	const soapNotify = generateSoapAction({
		created: {
			c: soapConversations,
			m: []
		}
	});
	mockSoapSync([soapNotify]);
}

export function mockSoapCreateMessageAndConversation(
	mailboxNumber: number,
	messages: Array<SoapIncompleteMessage>,
	conversation: Array<SoapConversation>
): void {
	mockSoapRefresh(mailboxNumber);
	const soapNotify = generateSoapAction({
		created: {
			m: messages,
			c: conversation
		}
	});
	mockSoapSync([soapNotify]);
}

export function mockShellSoapNotify(shellNotifyResponse: Partial<SoapNotify>): void {
	mockSoapRefresh(1);
	const soapNotify = generateSoapAction(shellNotifyResponse);
	mockSoapSync([soapNotify]);
}
