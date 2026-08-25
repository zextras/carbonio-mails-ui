/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { MAILS_ROUTE, SEARCH_ROUTE } from 'constants/index';
import { getFolderIdFromPathname } from 'helpers/routes';

describe('getFolderIdFromPathname', () => {
	test('returns the folder id of a folder of the primary account', () => {
		expect(getFolderIdFromPathname(`/${MAILS_ROUTE}/folder/${FOLDERS.INBOX}`)).toBe(FOLDERS.INBOX);
	});

	test('returns the folder id when the shell is served under a base path', () => {
		expect(getFolderIdFromPathname(`/carbonio/${MAILS_ROUTE}/folder/${FOLDERS.INBOX}`)).toBe(
			FOLDERS.INBOX
		);
	});

	test('returns the folder id of a folder of a shared account', () => {
		const sharedFolderId = `a79fa996-e90e-4f04-97c4-c84209bb8277:${FOLDERS.INBOX}`;
		expect(getFolderIdFromPathname(`/carbonio/${MAILS_ROUTE}/folder/${sharedFolderId}`)).toBe(
			sharedFolderId
		);
	});

	test('returns the folder id when the pathname contains the type and the item id', () => {
		expect(getFolderIdFromPathname(`/${MAILS_ROUTE}/folder/${FOLDERS.INBOX}/message/123`)).toBe(
			FOLDERS.INBOX
		);
	});

	test('returns undefined for the search route', () => {
		expect(getFolderIdFromPathname(`/${SEARCH_ROUTE}/any`)).toBeUndefined();
	});

	test('returns undefined for the route of another module', () => {
		expect(getFolderIdFromPathname(`/carbonio/calendars/folder/${FOLDERS.INBOX}`)).toBeUndefined();
	});

	test('returns undefined for a mails route which is not a folder route', () => {
		expect(getFolderIdFromPathname(`/carbonio/${MAILS_ROUTE}`)).toBeUndefined();
	});

	test('does not match a route whose last segment merely ends with the mails route', () => {
		expect(getFolderIdFromPathname(`/carbonio/notmails/folder/${FOLDERS.INBOX}`)).toBeUndefined();
	});
});
