/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';

import { getMocksContext } from '../../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { EditViewActions } from '../../../constants';
import { AppDispatch } from '../../../store/redux';
import { MailsEditorV2 } from '../../../types';

const FAKE_MESSAGE_ID = '11215';

export const buildEditorCase = (messagesStoreDispatch: AppDispatch): MailsEditorV2 => {
	const mocksContext = getMocksContext();

	return {
		id: faker.string.uuid(),
		did: FAKE_MESSAGE_ID,
		action: EditViewActions.EDIT_AS_NEW,
		identityId: mocksContext.identities.primary.identity.id,
		isRichText: true,
		isUrgent: false,
		requestReadReceipt: false,
		text: {
			richText:
				'<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"></div></body></html>',
			plainText: 'test'
		},
		recipients: { to: [], cc: [], bcc: [] },
		subject: faker.lorem.words(3),
		unsavedAttachments: [],
		savedAttachments: [
			{
				contentType: 'message/rfc822',
				size: 8539,
				isInline: false,
				filename: 'Conquista del mondo senza meeting room.eml',
				partName: '2',
				messageId: FAKE_MESSAGE_ID,
				requiresSmartLinkConversion: false
			},
			{
				contentType: 'message/rfc822',
				size: 7063,
				partName: '3',
				messageId: FAKE_MESSAGE_ID,
				isInline: false,
				filename: 'Conquista di Giove (con meeting room) - carbonio.eml',
				requiresSmartLinkConversion: false
			},
			{
				contentType: 'message/rfc822',
				size: 9887,
				partName: '4',
				isInline: false,
				messageId: FAKE_MESSAGE_ID,
				filename: 'Conquista di Giove (con meeting room) - gmail.eml',
				requiresSmartLinkConversion: false
			},
			{
				contentType: 'message/rfc822',
				size: 14261,
				partName: '5',
				isInline: false,
				messageId: FAKE_MESSAGE_ID,
				filename: 'Conquista di Giove (con meeting room) - outlook.eml',
				requiresSmartLinkConversion: false
			},
			{
				contentType: 'message/rfc822',
				size: 9887,
				partName: '6',
				isInline: false,
				messageId: FAKE_MESSAGE_ID,
				filename: 'Conquista di Giove (con meeting room).eml',
				requiresSmartLinkConversion: false
			},
			{
				contentType: 'message/rfc822',
				size: 5752,
				partName: '7',
				isInline: false,
				messageId: FAKE_MESSAGE_ID,
				filename: 'Conquista di Nettuno (senza meeting room)-carbonio.eml',
				requiresSmartLinkConversion: false
			},
			{
				contentType: 'message/rfc822',
				size: 8391,
				partName: '8',
				isInline: false,
				messageId: FAKE_MESSAGE_ID,
				filename: 'Conquista di Nettuno (senza meeting room)-gmail.eml',
				requiresSmartLinkConversion: false
			},
			{
				contentType: 'message/rfc822',
				size: 12937,
				partName: '9',
				isInline: false,
				messageId: FAKE_MESSAGE_ID,
				filename: 'Conquista di Nettuno (senza meeting room)-outlook.eml',
				requiresSmartLinkConversion: false
			},
			{
				contentType: 'image/jpeg',
				size: 1433935,
				partName: '10',
				isInline: false,
				messageId: FAKE_MESSAGE_ID,
				filename: 'cool-4k-wallpaper-10.jpg',
				requiresSmartLinkConversion: false
			}
		],
		messagesStoreDispatch
	};
};
