/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/*
 When replying to a single message conversation we see that:
 - the conversation id changes from negative to positive
 - the negative conversation id is deleted
 - a draft message is created, associated to the new conversation id
 - the original message changes to the new conversation id
*/
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { mockShellSoapNotify } from 'views/sidebar/tests/test-helpers';

export function simulateReplyToSingleMessageConversation({
	deletedConversationId,
	newConversationId,
	originalMessageId,
	newMessageId
}: {
	deletedConversationId: string;
	newConversationId: string;
	originalMessageId: string;
	newMessageId: string;
}): void {
	const realLifeNotifyResponse = {
		seq: 6,
		deleted: [deletedConversationId],
		created: {
			m: [
				{
					s: 1427,
					d: 1740495650000,
					l: FOLDERS.DRAFTS,
					cid: newConversationId,
					f: 'sd',
					rev: 57246,
					id: newMessageId,
					e: [
						{
							a: 'user@demo.test.io',
							d: 'user',
							p: 'user',
							t: 't'
						},
						{
							a: 'user@demo.test.io',
							d: 'Carbonio',
							p: 'Carbonio Admin',
							t: 'f'
						}
					],
					su: 'RE: Email with 1 attachments',
					fr: '-- From: "undefined" <user@demo.test.io> To: "undefined" <user@demo.test.io> Sent: Wednesday, December 11, 2024 2:58 PM Subject: Email ...'
				}
			],
			c: [
				{
					id: newConversationId,
					u: 0,
					n: 2,
					f: 'sad',
					d: 1740495650000,
					su: 'Email with 1 attachments',
					e: [
						{
							a: 'user@demo.test.io',
							d: 'Carbonio',
							p: 'Carbonio Admin',
							t: 'f'
						}
					]
				}
			]
		},
		modified: {
			m: [
				{
					cid: newConversationId,
					id: originalMessageId
				}
			],
			mbx: [
				{
					s: 1068264279
				}
			] as [{ s: number }],
			folder: [
				{
					id: FOLDERS.DRAFTS,
					uuid: 'f7346160-c02c-408b-aa18-bd3efe05b804',
					deletable: false,
					n: 58,
					s: 4374,
					i4ms: 57247,
					i4next: 7993
				},
				{
					id: FOLDERS.INBOX,
					uuid: '418437ae-5bc6-43e4-b865-bbf4d48c157c',
					deletable: true,
					n: 4,
					s: 7312,
					i4ms: 57246,
					i4next: 7992
				}
			]
		}
	};
	mockShellSoapNotify(realLifeNotifyResponse);
}
