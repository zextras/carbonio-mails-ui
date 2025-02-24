/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SoapNotify, useNotify, useRefresh } from '@zextras/carbonio-shell-ui';

import { SoapIncompleteMessage, SoapConversation } from '../../../types';

export function mockSoapRefresh(mailbox: number): void {
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
					f: `s${action}`
				}
			]
		}
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}
export function mockSoapModifyMessageAction(
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
					f: `s${action}`
				}
			],
			c: [
				{
					id: conversationId,
					f: `s${action}`
				}
			]
		}
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
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
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}

export function mockSoapDelete(mailboxNumber: number, deletedIds: Array<string>): void {
	mockSoapRefresh(mailboxNumber);
	const soapNotify = generateSoapAction({
		deleted: deletedIds
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
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
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
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
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}

export function mockSoapCreatePositiveId(
	messages: Array<SoapIncompleteMessage>,
	conversation: SoapConversation,
	deletedIds: Array<string>
): void {
	mockSoapRefresh(1);
	const soapNotify = generateSoapAction({
		created: {
			m: messages,
			c: [conversation]
		},
		// deleted: [(-Number(conversation.id)).toString()],
		deleted: deletedIds
	});
	(useNotify as jest.Mock).mockReturnValue([soapNotify]);
}
