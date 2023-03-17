/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS, getRoots, getUserAccount } from '@zextras/carbonio-shell-ui';
import { getMocksContext } from '../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { getFolderOwnerAccountName } from '../folders';

describe('Folder owner', () => {
	const mocksContext = getMocksContext();
	const roots = getRoots();
	const primaryAccount = getUserAccount();
	const sharedAccount = mocksContext.identities.sendAs[0];

	test('For a folder with an id without the zid, the primary account name is returned', () => {
		const folderId = FOLDERS.INBOX;
		const ownerAccountName = getFolderOwnerAccountName(folderId, primaryAccount, roots);
		expect(ownerAccountName).toBe(primaryAccount.name);
	});

	test("For a folder with an id containing the zid, the name of the shared account owning that folder's root is returned", () => {
		const folderId = `${sharedAccount.identity.id}:${FOLDERS.INBOX}`;
		const ownerAccountName = getFolderOwnerAccountName(folderId, primaryAccount, roots);
		expect(ownerAccountName).toBe(sharedAccount.identity.email);
	});

	test('For a folder with an id containing an unknown zid, the primary account name is returned', () => {
		const folderId = `TheAnswerIs42:${FOLDERS.INBOX}`;
		const ownerAccountName = getFolderOwnerAccountName(folderId, primaryAccount, roots);
		expect(ownerAccountName).toBe(primaryAccount.name);
	});
});
