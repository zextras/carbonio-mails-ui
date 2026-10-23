/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { generateFolder } from '@test-utils/folders/folders-generator';
import { getConversationDateInFolder, getMessagesParentForFolder } from 'helpers/conversations';

describe('getConversationDateInFolder', () => {
	const conversation = { date: 300 };

	it('returns the date of the newest message in the folder', () => {
		const messages = [
			{ parent: FOLDERS.INBOX, date: 100 },
			{ parent: FOLDERS.DRAFTS, date: 300 },
			{ parent: FOLDERS.INBOX, date: 200 }
		];
		expect(getConversationDateInFolder(conversation, messages, FOLDERS.INBOX)).toBe(200);
	});

	it('falls back to the conversation date when no message is in the folder', () => {
		const messages = [{ parent: FOLDERS.DRAFTS, date: 300 }, undefined];
		expect(getConversationDateInFolder(conversation, messages, FOLDERS.INBOX)).toBe(300);
	});
});

describe('getMessagesParentForFolder', () => {
	it('returns the folder id for a folder of the user', () => {
		expect(getMessagesParentForFolder(generateFolder({ id: '257' }))).toBe('257');
	});

	it('returns <zid>:<rid> for a mounted shared folder', () => {
		const folder = { ...generateFolder({ id: '300' }), zid: 'owner-zid', rid: '2' };
		expect(getMessagesParentForFolder(folder)).toBe('owner-zid:2');
	});
});
