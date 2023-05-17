/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import {
	getFolder,
	getFoldersArray,
	getRootsMap
} from '../../carbonio-ui-commons/store/zustand/folder/hooks';
import { getMocksContext } from '../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import {
	getFolderIdParts,
	getFolderOwnerAccountName,
	isDraft,
	isInbox,
	isInboxSubfolder,
	isRoot,
	isSent,
	isTrash,
	isTrashed
} from '../folders';

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
	test('If no folderId is specified false is returned', () => {
		const folderId = undefined;
		expect(
			isRoot(
				// Testing the case in which the parameter is undefined
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				folderId
			)
		).toBe(false);
	});

	test('A folder with a id = 1 is recognized as a root', () => {
		const folderId = '1';
		expect(isRoot(folderId)).toBe(true);
	});

	test('A folder with a id != 1 is not recognized as a root', () => {
		const folderId = '99';
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

describe('isInbox', () => {
	test('If no folderId is specified false is returned', () => {
		const folderId = undefined;
		expect(
			isInbox(
				// Testing the case in which the parameter is undefined
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				folderId
			)
		).toBe(false);
	});

	test('A folder with a id = 2 is recognized as an inbox folder', () => {
		const folderId = FOLDERS.INBOX;
		expect(isInbox(folderId)).toBe(true);
	});

	test('A folder with a id != 2 is not recognized as an inbox folder', () => {
		const folderId = '99';
		expect(isInbox(folderId)).toBe(false);
	});

	test('A folder with a zid and an id = 2 is recognized as an inbox folder', () => {
		const folderId = `somelonghash:${FOLDERS.INBOX}`;
		expect(isInbox(folderId)).toBe(true);
	});

	test('A folder with a zid and an id != 2 is not recognized as an inbox folder', () => {
		const folderId = 'anotherlonghash:99';
		expect(isInbox(folderId)).toBe(false);
	});
});

describe('isTrash', () => {
	test('If no folderId is specified false is returned', () => {
		const folderId = undefined;
		expect(
			isTrash(
				// Testing the case in which the parameter is undefined
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				folderId
			)
		).toBe(false);
	});

	test('A folder with a id = 6 is recognized as a trash', () => {
		const folderId = FOLDERS.TRASH;
		expect(isTrash(folderId)).toBe(true);
	});

	test('A folder with a id != 6 is not recognized as a trash', () => {
		const folderId = '99';
		expect(isTrash(folderId)).toBe(false);
	});

	test('A folder with a zid and an id = 6 is recognized as a trash', () => {
		const folderId = `somelonghash:${FOLDERS.TRASH}`;
		expect(isTrash(folderId)).toBe(true);
	});

	test('A folder with a zid and an id != 6 is not recognized as a trash', () => {
		const folderId = 'anotherlonghash:99';
		expect(isTrash(folderId)).toBe(false);
	});
});

describe('isSent', () => {
	test('If no folderId is specified false is returned', () => {
		const folderId = undefined;
		expect(
			isSent(
				// Testing the case in which the parameter is undefined
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				folderId
			)
		).toBe(false);
	});

	test('A folder with a id = 5 is recognized as a sent folder', () => {
		const folderId = FOLDERS.SENT;
		expect(isSent(folderId)).toBe(true);
	});

	test('A folder with a id != 5 is not recognized as a sent folder', () => {
		const folderId = '99';
		expect(isSent(folderId)).toBe(false);
	});

	test('A folder with a zid and an id = 5 is recognized as a sent folder', () => {
		const folderId = `somelonghash:${FOLDERS.SENT}`;
		expect(isSent(folderId)).toBe(true);
	});

	test('A folder with a zid and an id != 5 is not recognized as a sent folder', () => {
		const folderId = 'anotherlonghash:99';
		expect(isSent(folderId)).toBe(false);
	});
});

describe('isDraft', () => {
	test('If no folderId is specified false is returned', () => {
		const folderId = undefined;
		expect(
			isDraft(
				// Testing the case in which the parameter is undefined
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				folderId
			)
		).toBe(false);
	});

	test('A folder with a id = 6 is recognized as a draft folder', () => {
		const folderId = FOLDERS.DRAFTS;
		expect(isDraft(folderId)).toBe(true);
	});

	test('A folder with a id != 6 is not recognized as a draft folder', () => {
		const folderId = '99';
		expect(isDraft(folderId)).toBe(false);
	});

	test('A folder with a zid and an id = 6 is recognized as a draft folder', () => {
		const folderId = `somelonghash:${FOLDERS.DRAFTS}`;
		expect(isDraft(folderId)).toBe(true);
	});

	test('A folder with a zid and an id != 6 is not recognized as a draft folder', () => {
		const folderId = 'anotherlonghash:99';
		expect(isDraft(folderId)).toBe(false);
	});
});

describe('isInboxSubfolder', () => {
	test('A folder inside the inbox (passed by ref) is recognized an inbox subfolder', () => {
		populateFoldersStore();
		const inbox = getFolder(FOLDERS.INBOX);
		if (!inbox || !inbox.children.length) {
			return;
		}

		expect(isInboxSubfolder({ folder: inbox.children[0] })).toBe(true);
	});

	test('A folder inside the trash (passed by id) is recognized as trashed', () => {
		populateFoldersStore();
		const inbox = getFolder(FOLDERS.INBOX);
		if (!inbox || !inbox.children.length) {
			return;
		}

		expect(isInboxSubfolder({ folderId: inbox.children[0].id })).toBe(true);
	});

	test('A trashed folder (passed by ref) is not recognized as an inbox folder', () => {
		populateFoldersStore();
		const trash = getFolder(FOLDERS.TRASH);
		if (!trash || !trash.children.length) {
			return;
		}

		expect(isInboxSubfolder({ folder: trash.children[0] })).toBe(false);
	});

	test('A trashed folder (passed by id) is not recognized as an inbox folder', () => {
		populateFoldersStore();
		const trash = getFolder(FOLDERS.TRASH);
		if (!trash || !trash.children.length) {
			return;
		}

		expect(isInboxSubfolder({ folderId: trash.children[0].id })).toBe(false);
	});
});

describe('isTrashed', () => {
	test('A folder inside the trash (passed by ref) is recognized as trashed', () => {
		populateFoldersStore();
		const trashFolder = getFoldersArray().find((folder) => isTrash(folder.id));
		if (!trashFolder || !trashFolder.children.length) {
			return;
		}

		expect(isTrashed({ folder: trashFolder.children[0] })).toBe(true);
	});

	test('A folder inside the trash (passed by id) is recognized as trashed', () => {
		populateFoldersStore();
		const trashFolder = getFoldersArray().find((folder) => isTrash(folder.id));
		if (!trashFolder || !trashFolder.children.length) {
			return;
		}

		expect(isTrashed({ folderId: trashFolder.children[0].id })).toBe(true);
	});

	test('The inbox folder (passed by ref) is not recognized as trashed', () => {
		populateFoldersStore();
		const folder = getFolder(FOLDERS.INBOX);
		if (!folder) {
			return;
		}
		expect(isTrashed({ folder })).toBe(false);
	});

	test('The inbox folder (passed by id) is not recognized as trashed', () => {
		populateFoldersStore();
		expect(isTrashed({ folderId: FOLDERS.INBOX })).toBe(false);
	});
});
