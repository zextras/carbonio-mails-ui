/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';

import { ParticipantRole } from '../../../carbonio-ui-commons/constants/participants';
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
		size: 9999999,
		totalSmartLinksSize: 0,
		text: {
			richText:
				'<html><body><div style="font-family:&#39;arial&#39; , &#39;helvetica&#39; , sans-serif;font-size:12pt;color:#000000"></div></body></html>',
			plainText: 'test'
		},
		recipients: {
			to: [{ type: ParticipantRole.TO, address: faker.internet.email() }],
			cc: [],
			bcc: []
		},
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
				contentType: 'image/jpeg',
				size: 1433935,
				partName: '3',
				isInline: false,
				messageId: FAKE_MESSAGE_ID,
				filename: 'cool-4k-wallpaper-10.jpg',
				requiresSmartLinkConversion: true
			}
		],
		messagesStoreDispatch
	};
};
