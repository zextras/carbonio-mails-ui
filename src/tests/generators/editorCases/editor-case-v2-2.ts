/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { createFakeIdentity } from '../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import { MailsEditorV2 } from '../../../types';

const identity = createFakeIdentity();
const text = faker.lorem.sentence();
export const editorCaseV2: MailsEditorV2 = {
	isRichText: true,
	text: { richText: `<p>${text}</p>`, plainText: text },
	recipients: { to: [], cc: [], bcc: [] },
	from: {
		address: identity.email,
		fullName: identity.fullName,
		name: identity.fullName,
		type: 'f'
	},
	inlineAttachments: [],
	id: 'new-{faker.random.uuid}',
	subject: faker.lorem.sentence(),
	attachments: {
		mp: [
			{
				part: faker.random.numeric(),
				mid: faker.random.numeric()
			}
		]
	},
	isUrgent: false,
	requestReadReceipt: false,
	originalId: faker.random.numeric().toString(),
	attachmentFiles: [
		{
			contentType: 'message/rfc822',
			size: parseInt(faker.random.numeric(), 10),
			name: faker.random.numeric(),
			disposition: 'attachment',
			filename: `${faker.lorem.sentence()}.eml`
		},
		{
			contentType: 'image/jpeg',
			size: 1433935,
			name: '10',
			disposition: 'attachment',
			filename: 'cool-4k-wallpaper-10.jpg'
		}
	],
	did: '11215',
	originalMessage: {
		conversation: '-11215',
		id: '11215',
		date: 1670947197000,
		size: 2041944,
		parent: '6',
		subject: '',
		participants: [
			{
				address: identity.email,
				fullName: identity.fullName,
				name: identity.fullName,
				type: 'f'
			}
		],
		tags: [],
		parts: [],
		attachments: [
			{
				part: '2',
				ct: 'message/rfc822',
				s: 8539,
				cd: 'attachment',
				filename: 'Conquista del mondo senza meeting room.eml',
				mp: [
					{
						part: '2.TEXT',
						ct: 'multipart/alternative',
						mp: []
					}
				],
				contentType: 'message/rfc822',
				name: '2',
				size: 8539
			},
			{
				part: '10',
				ct: 'image/jpeg',
				s: 1433935,
				cd: 'attachment',
				filename: 'cool-4k-wallpaper-10.jpg',
				contentType: 'image/jpeg',
				name: '10',
				size: 1433935
			}
		],
		body: {
			contentType: 'text/html',
			content:
				'<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"></div></body></html>'
		},
		isComplete: true,
		isScheduled: false,
		read: true,
		hasAttachment: true,
		flagged: false,
		urgent: false,
		isDeleted: false,
		isDraft: true,
		isForwarded: false,
		isSentByMe: true,
		isInvite: false,
		isReplied: false,
		isReadReceiptRequested: true
	}
};
