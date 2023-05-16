/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS, getUserAccount } from '@zextras/carbonio-shell-ui';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import { getRootsMap } from '../../carbonio-ui-commons/store/zustand/folder/hooks';
import { getMocksContext } from '../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { getFolderIdParts, getFolderOwnerAccountName, isRoot } from '../folders';

describe('Folder id', () => {
	test('with zid', () => {
		const parts = getFolderIdParts('a79fa996-e90e-4f04-97c4-c84209bb8277:1087');
		expect(parts.zid).toBe('a79fa996-e90e-4f04-97c4-c84209bb8277');
		expect(parts.id).toBe('1087');
	});

	test('without zid', () => {
		const parts = getFolderIdParts('1087');
		expect(parts.zid).toBeNull();
		expect(parts.id).toBe('1087');
	});

	test('without id', () => {
		const parts = getFolderIdParts('a79fa996-e90e-4f04-97c4-c84209bb8277:');
		expect(parts.zid).toBeNull();
		expect(parts.id).toBeNull();
	});

	test('with zid only', () => {
		const parts = getFolderIdParts('a79fa996-e90e-4f04-97c4-c84209bb8277');
		expect(parts.zid).toBeNull();
		expect(parts.id).toBeNull();
	});
});

describe('Folder owner', () => {
	const mocksContext = getMocksContext();
	const primaryAccount = getUserAccount();

	test('For a folder with an id without the zid, the primary account name is returned', () => {
		populateFoldersStore();
		const roots = getRootsMap();
		const folderId = FOLDERS.INBOX;
		const ownerAccountName = getFolderOwnerAccountName(folderId, primaryAccount, roots);
		expect(ownerAccountName).toBe(primaryAccount.name);
	});

	test("For a folder with an id containing the zid, the name of the shared account owning that folder's root is returned", () => {
		populateFoldersStore();
		const roots = getRootsMap();
		const sharedAccount = mocksContext.identities.sendAs[0];
		const folderId = `${sharedAccount.identity.id}:${FOLDERS.INBOX}`;
		const ownerAccountName = getFolderOwnerAccountName(folderId, primaryAccount, roots);
		expect(ownerAccountName).toBe(sharedAccount.identity.email);
	});

	test('For a folder with an id containing an unknown zid, the primary account name is returned', () => {
		populateFoldersStore();
		const roots = getRootsMap();
		const folderId = `TheAnswerIs42:${FOLDERS.INBOX}`;
		const ownerAccountName = getFolderOwnerAccountName(folderId, primaryAccount, roots);
		expect(ownerAccountName).toBe(primaryAccount.name);
	});
});

describe('isRoot', () => {
	test('A folder with a id = 1 is recognized as a root', () => {
		const folderId = '1';
		expect(isRoot(folderId)).toBe(true);
	});

	test('A folder with a id != 1 is not recognized as a root', () => {
		const folderId = '99';
		expect(isRoot(folderId)).toBe(false);
	});

	test('If no folderId is specified false is returned', () => {
		const folderId = undefined;
		// Testing the case in which the parameter is undefined
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		expect(isRoot(folderId)).toBe(false);
	});

	test('A folder with a zid and an id = 1 is recognized as a root', () => {
		const folderId = 'somelonghash:1';
		expect(isRoot(folderId)).toBe(true);
	});

	test('A folder with a zid and an id != 1 is not recognized as a root', () => {
		const folderId = 'anotherlonghash:99';
		expect(isRoot(folderId)).toBe(false);
	});
});
