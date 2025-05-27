/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';

import { FOLDERS } from '../../../constants/folders';
import type {
	Folder,
	FolderView,
	Folders,
	LinkFolder,
	PopulateFoldersStoreOptions
} from '../../../types/folder';
import { FakeIdentity } from '../accounts/fakeAccounts';
import {
	getMocksContext,
	getRandomIdentities,
	getRandomIdentity,
	MocksContextIdentity
} from '../utils/mocks-context';

let userFolderIdSequence = 100;
const getNextFolderId = (zid?: string): string => {
	userFolderIdSequence += 1;
	if (zid) {
		return `${zid}:${userFolderIdSequence}`;
	}

	return `${userFolderIdSequence}`;
};

/**
 * Traverse the folder hierarchy and set (byref) the reference to folder's parent
 * @param folder
 * @param parent
 */
const fillReferenceToParent = (folder: Folder, parent?: Folder): void => {
	// eslint-disable-next-line no-param-reassign
	folder.parent = parent?.id;
	folder.children.forEach((child) => {
		fillReferenceToParent(child, folder);
	});
};

/**
 * Recursive function that returns a flat map of the children folders
 * @param children
 */
const getFlatChildren = (children: Array<Folder>): Folders => {
	let destination: Folders = {};
	children.forEach((child) => {
		destination[child.id] = child;
		if (child.children) {
			destination = { ...destination, ...getFlatChildren(child.children) };
		}
	});

	return destination;
};

/**
 * TODO extends with Calendars and Contacts folders
 * @param contextIdentity
 */
const generateSharedAccountSystemFolders = (
	contextIdentity: MocksContextIdentity
): Array<Folder> => {
	if (!contextIdentity) {
		return [];
	}

	return [
		{
			id: `${contextIdentity.identity.id}:${FOLDERS.INBOX}`,
			uuid: faker.string.uuid(),
			name: 'Inbox',
			absFolderPath: '/Inbox',
			l: `${contextIdentity.identity.id}:${FOLDERS.USER_ROOT}`,
			luuid: contextIdentity.userRootId,
			checked: false,
			f: 'ui',
			u: 37,
			view: 'message' as FolderView,
			rev: 1,
			ms: 2633,
			n: 889,
			s: 174031840,
			i4ms: 33663,
			i4next: 17222,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			acl: {
				grant: []
			},
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		},
		{
			id: `${contextIdentity.identity.id}:${FOLDERS.SPAM}`,
			uuid: faker.string.uuid(),
			name: 'Junk',
			absFolderPath: '/Junk',
			l: `${contextIdentity.identity.id}:${FOLDERS.USER_ROOT}`,
			luuid: contextIdentity.userRootId,
			checked: false,
			view: 'message' as FolderView,
			rev: 1,
			ms: 1,
			n: 1,
			s: 10815,
			i4ms: 33396,
			i4next: 17084,
			activesyncdisabled: false,
			webOfflineSyncDays: 0,
			recursive: false,
			deletable: false,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		},
		{
			id: `${contextIdentity.identity.id}:${FOLDERS.SENT}`,
			uuid: faker.string.uuid(),
			name: 'Sent',
			absFolderPath: '/Sent',
			l: `${contextIdentity.identity.id}:${FOLDERS.USER_ROOT}`,
			luuid: contextIdentity.userRootId,
			checked: false,
			view: 'message' as FolderView,
			rev: 1,
			ms: 1,
			n: 313,
			s: 61983538,
			i4ms: 33637,
			i4next: 17208,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		},
		{
			id: `${contextIdentity.identity.id}:${FOLDERS.TRASH}`,
			uuid: faker.string.uuid(),
			name: 'Trash',
			absFolderPath: '/Trash',
			l: `${contextIdentity.identity.id}:${FOLDERS.USER_ROOT}`,
			luuid: contextIdentity.userRootId,
			checked: false,
			rev: 1,
			ms: 28502,
			n: 16,
			s: 319017,
			i4ms: 33653,
			i4next: 17212,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		},
		{
			id: `${contextIdentity.identity.id}:${FOLDERS.DRAFTS}`,
			uuid: faker.string.uuid(),
			name: 'Drafts',
			absFolderPath: '/Drafts',
			l: `${contextIdentity.identity.id}:${FOLDERS.USER_ROOT}`,
			luuid: contextIdentity.userRootId,
			checked: false,
			view: 'message' as FolderView,
			rev: 1,
			ms: 1,
			n: 13,
			s: 19366,
			i4ms: 33653,
			i4next: 17212,
			activesyncdisabled: false,
			webOfflineSyncDays: 30,
			recursive: false,
			deletable: false,
			isLink: false,
			children: [],
			parent: undefined,
			depth: 1
		}
	];
};

/**
 *
 * @param parentId
 * @param parentUuid
 * @param ownerContextIdentity
 */
export const generateFolderLink = (
	parentId: string,
	parentUuid: string,
	ownerIdentity: FakeIdentity
): LinkFolder => {
	const name = `${faker.string.alpha(16)} of ${ownerIdentity.fullName}`;

	const result: LinkFolder = {
		id: getNextFolderId(),
		uuid: faker.string.uuid(),
		name: faker.string.alpha(16),
		absFolderPath: `/${name}`,
		l: parentId,
		luuid: parentUuid,
		checked: false,
		view: 'message',
		rev: 36953,
		ms: 36953,
		n: 4,
		s: 104912,
		activesyncdisabled: false,
		webOfflineSyncDays: 0,
		perm: 'r',
		recursive: false,
		deletable: true,
		owner: ownerIdentity.email,
		zid: ownerIdentity.id,
		rid: getNextFolderId(),
		ruuid: faker.string.uuid(),
		oname: name,
		reminder: false,
		broken: false,
		isLink: true,
		children: [],
		parent: '1',
		depth: 1
	};

	return result;
};

/**
 *
 * @param primaryContextIdentity
 * @param sharedContextIdentity
 */
const generateSharedAccountRoot = (
	primaryContextIdentity: MocksContextIdentity,
	sharedContextIdentity: MocksContextIdentity
): Record<string, Folder> => {
	const id = `${sharedContextIdentity.identity.id}:${FOLDERS.USER_ROOT}`;
	return {
		[id]: {
			// absFolderPath: `/${sharedContextIdentity.identity.email}`,
			// acl: undefined,
			activesyncdisabled: false,
			broken: false,
			checked: false,
			children: generateSharedAccountSystemFolders(sharedContextIdentity),
			// color: undefined,
			deletable: false,
			depth: 1,
			// // f: '*',
			// // i4ms: undefined,
			// // i4n: undefined,
			// // i4next: undefined,
			// // i4u: undefined,
			// // id: `${(rootIdCounter = +1)}`,
			id,
			isLink: true,
			// luuid: primaryContextIdentity.userRootId,
			// md: undefined,
			// meta: undefined,
			// ms: 7037,
			// n: 0,
			name: sharedContextIdentity.identity.email,
			oname: 'USER_ROOT',
			owner: sharedContextIdentity.identity.email,
			// perm: 'rwidxc',
			recursive: false,
			reminder: false,
			parent: FOLDERS.USER_ROOT,
			retentionPolicy: undefined,
			rev: 7036,
			rgb: undefined,
			rid: '1',
			ruuid: faker.string.uuid(),
			s: 0,
			u: undefined,
			url: undefined,
			uuid: sharedContextIdentity.userRootId ?? '',
			// view: undefined,
			// webOfflineSyncDays: 0,
			zid: sharedContextIdentity.identity.id
		}
	};
};

/**
 *
 * @param primaryContextIdentity
 * @param sharedContextIdentities
 */
const generateSharedAccountsRoot = (
	primaryContextIdentity: MocksContextIdentity,
	sharedContextIdentities: Array<MocksContextIdentity>
): Record<string, Folder> => {
	if (!primaryContextIdentity || !sharedContextIdentities || !sharedContextIdentities.length) {
		return {};
	}

	let result = {};
	sharedContextIdentities.forEach((sharedAccount) => {
		result = { ...result, ...generateSharedAccountRoot(primaryContextIdentity, sharedAccount) };
	});

	return result;
};

export const generateFolder = (model: Partial<Folder & { oname: string }> = {}): Folder => {
	const mockContext = getMocksContext();
	const rootUuid = mockContext.identities.primary.userRootId;
	const name = faker.word.noun({ length: { min: 1, max: 2 } });
	return {
		id: model.id ?? getNextFolderId(),
		uuid: model.uuid ?? faker.string.uuid(),
		name: model.name ?? name,
		absFolderPath: model.absFolderPath ?? `/${name}`,
		l: model.l ?? FOLDERS.USER_ROOT,
		luuid: model.luuid ?? rootUuid,
		checked: model.checked ?? false,
		f: model.f ?? 'i',
		view: model.view ?? ('message' as FolderView),
		rev: model.rev ?? 1378,
		ms: model.ms ?? 12599,
		n: model.n ?? 0,
		s: model.s ?? 0,
		i4ms: model.i4ms ?? 1378,
		i4next: model.i4next ?? 684,
		activesyncdisabled: model.activesyncdisabled ?? false,
		webOfflineSyncDays: model.webOfflineSyncDays ?? 0,
		recursive: model.recursive ?? false,
		deletable: model.deletable ?? true,
		...((model as LinkFolder).oname && { oname: (model as LinkFolder).oname }),
		acl: model.acl ?? {
			grant: [
				{
					zid: getRandomIdentity(mockContext.otherUsersIdentities)?.id ?? '',
					gt: 'usr',
					perm: 'r'
				}
			]
		},
		isLink: model.isLink ?? false,
		children: model.children ?? [],
		parent: model.parent ?? undefined,
		depth: model.depth ?? 1,
		reminder: false,
		broken: false,
		...(model.perm && { perm: model.perm })
	};
};

/**
 * Generate a semi-fixed folders structure mock
 * TODO make it more flexible
 */
export const generateFolders = ({
	view,
	noSharedAccounts,
	customFolders
}: PopulateFoldersStoreOptions = {}): Folders => {
	const mockContext = getMocksContext();
	const rootUuid = mockContext.identities.primary.userRootId;
	const inboxUuid = faker.string.uuid();
	const trashUuid = faker.string.uuid();
	const contactsUuid = faker.string.uuid();

	const [calendarsRandomUser1, calendarsRandomUser2] = getRandomIdentities(
		mockContext.viewFreeBusyIdentities,
		2
	);

	const [contactsRandomUser1, mailsRandomUser1] = getRandomIdentities(
		mockContext.otherUsersIdentities,
		2
	);

	const links: Array<LinkFolder> = [];
	const linkOwner = getRandomIdentity(mockContext.otherUsersIdentities);
	if (linkOwner) {
		links.push(generateFolderLink(FOLDERS.INBOX, inboxUuid, linkOwner));
	}

	let roots = {
		[FOLDERS.USER_ROOT]: {
			id: FOLDERS.USER_ROOT,
			uuid: rootUuid,
			name: 'USER_ROOT',
			absFolderPath: '/',
			l: '11',
			luuid: '808e2306-ba25-42f8-9aac-67b3762db30c',
			checked: false,
			rev: 1,
			ms: 1,
			n: 0,
			s: 0,
			i4ms: 399,
			i4next: 300,
			activesyncdisabled: false,
			webOfflineSyncDays: 0,
			recursive: false,
			deletable: false,
			isLink: false,
			children: [
				...(customFolders ?? []),
				{
					id: getNextFolderId(),
					uuid: faker.string.uuid(),
					name: 'blacklisted',
					absFolderPath: '/blacklisted',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					f: 'i',
					view: 'contact' as FolderView,
					rev: 1378,
					ms: 12599,
					n: 0,
					s: 0,
					i4ms: 1378,
					i4next: 684,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					recursive: false,
					deletable: true,
					acl: {
						grant: [
							{
								zid: getRandomIdentity(mockContext.otherUsersIdentities)?.id ?? '',
								gt: 'usr',
								perm: 'r'
							}
						]
					},
					isLink: false,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: FOLDERS.BRIEFCASE,
					uuid: faker.string.uuid(),
					name: 'Briefcase',
					absFolderPath: '/Briefcase',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'document' as FolderView,
					rev: 1,
					ms: 1,
					n: 1,
					s: 12492,
					i4ms: 18659,
					i4next: 8949,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					recursive: false,
					deletable: false,
					isLink: false,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: FOLDERS.CALENDAR,
					uuid: faker.string.uuid(),
					name: 'Calendar',
					absFolderPath: '/Calendar',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: true,
					f: 'b#i',
					color: '6',
					view: 'appointment' as FolderView,
					rev: 1,
					ms: 33272,
					n: 159,
					s: 0,
					i4ms: 33640,
					i4next: 17193,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					recursive: false,
					deletable: false,
					acl: {
						grant: [
							{
								zid: getRandomIdentity(mockContext.otherUsersIdentities)?.id ?? '',
								gt: 'usr',
								perm: 'r'
							},
							{
								zid: getRandomIdentity(mockContext.otherUsersIdentities)?.id ?? '',
								gt: 'usr',
								perm: 'r'
							}
						]
					},
					isLink: false,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: FOLDERS.CONTACTS,
					uuid: contactsUuid,
					name: 'Contacts',
					absFolderPath: '/Contacts',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'contact' as FolderView,
					rev: 1,
					ms: 1,
					n: 6,
					s: 0,
					i4ms: 30800,
					i4next: 3281,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					recursive: false,
					deletable: false,
					isLink: false,
					children: [
						{
							id: getNextFolderId(),
							uuid: faker.string.uuid(),
							name: 'inner',
							absFolderPath: '/Contacts/inner',
							l: FOLDERS.CONTACTS,
							luuid: contactsUuid,
							checked: false,
							f: 'i',
							view: 'contact' as FolderView,
							rev: 1378,
							ms: 12599,
							n: 0,
							s: 0,
							i4ms: 1378,
							i4next: 684,
							activesyncdisabled: false,
							webOfflineSyncDays: 0,
							recursive: false,
							deletable: true,
							isLink: false,
							children: [],
							parent: undefined,
							depth: 2
						}
					],
					parent: undefined,
					depth: 1
				},
				{
					id: getNextFolderId(),
					uuid: faker.string.uuid(),
					name: `Contacts addressbook of ${getRandomIdentity(mockContext.otherUsersIdentities)?.fullName}`,
					absFolderPath: `/Contacts addressbook of ${getRandomIdentity(mockContext.otherUsersIdentities)?.fullName}`,
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					f: 'i',
					view: 'contact' as FolderView,
					rev: 1378,
					ms: 12599,
					n: 0,
					s: 0,
					i4ms: 1378,
					i4next: 684,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					recursive: false,
					deletable: true,
					isLink: true,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: FOLDERS.DRAFTS,
					uuid: faker.string.uuid(),
					name: 'Drafts',
					absFolderPath: '/Drafts',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'message' as FolderView,
					rev: 1,
					ms: 1,
					n: 13,
					s: 19366,
					i4ms: 33653,
					i4next: 17212,
					activesyncdisabled: false,
					webOfflineSyncDays: 30,
					recursive: false,
					deletable: false,
					isLink: false,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: FOLDERS.AUTO_CONTACTS,
					uuid: faker.string.uuid(),
					name: 'Emailed Contacts',
					absFolderPath: '/Emailed Contacts',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'contact' as FolderView,
					rev: 1,
					ms: 2455,
					n: 20,
					s: 0,
					i4ms: 20920,
					i4next: 10419,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					recursive: false,
					deletable: false,
					isLink: false,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: FOLDERS.INBOX,
					uuid: inboxUuid,
					name: 'Inbox',
					absFolderPath: '/Inbox',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					f: 'ui',
					u: 37,
					view: 'message' as FolderView,
					rev: 1,
					ms: 2633,
					n: 889,
					s: 174031840,
					i4ms: 33663,
					i4next: 17222,
					activesyncdisabled: false,
					webOfflineSyncDays: 30,
					recursive: false,
					deletable: false,
					acl: {},
					isLink: false,
					children: [
						{
							id: getNextFolderId(),
							uuid: faker.string.uuid(),
							name: 'Confluence',
							absFolderPath: '/Inbox/Confluence',
							l: FOLDERS.INBOX,
							luuid: inboxUuid,
							checked: false,
							f: 'u',
							u: 25,
							view: 'message' as FolderView,
							rev: 27896,
							ms: 27896,
							n: 37,
							s: 5550022,
							i4ms: 33607,
							i4next: 17183,
							activesyncdisabled: false,
							webOfflineSyncDays: 0,
							recursive: false,
							deletable: true,
							isLink: false,
							children: [],
							parent: undefined,
							depth: 2
						},
						{
							id: getNextFolderId(),
							uuid: faker.string.uuid(),
							name: 'GitHub',
							absFolderPath: '/Inbox/GitHub',
							l: FOLDERS.INBOX,
							luuid: inboxUuid,
							checked: false,
							view: 'message' as FolderView,
							rev: 3217,
							ms: 3217,
							n: 251,
							s: 1754530,
							i4ms: 28153,
							i4next: 4034,
							activesyncdisabled: false,
							webOfflineSyncDays: 0,
							recursive: false,
							deletable: true,
							isLink: false,
							children: [],
							parent: undefined,
							depth: 2
						},
						{
							id: getNextFolderId(),
							uuid: faker.string.uuid(),
							name: 'HR',
							absFolderPath: '/Inbox/HR',
							l: FOLDERS.INBOX,
							luuid: inboxUuid,
							checked: false,
							view: 'message' as FolderView,
							rev: 18622,
							ms: 18622,
							n: 93,
							s: 35627011,
							i4ms: 33528,
							i4next: 17161,
							activesyncdisabled: false,
							webOfflineSyncDays: 0,
							recursive: false,
							deletable: true,
							isLink: false,
							children: [],
							parent: undefined,
							depth: 2
						},
						{
							id: getNextFolderId(),
							uuid: faker.string.uuid(),
							name: 'Jenkins',
							absFolderPath: '/Inbox/Jenkins',
							l: FOLDERS.INBOX,
							luuid: inboxUuid,
							checked: false,
							f: 'u',
							u: 9,
							view: 'message' as FolderView,
							rev: 2863,
							ms: 10162,
							n: 9,
							s: 291992,
							i4ms: 33660,
							i4next: 17220,
							activesyncdisabled: false,
							webOfflineSyncDays: 0,
							recursive: false,
							deletable: true,
							isLink: false,
							children: [],
							parent: undefined,
							depth: 2
						},
						{
							id: getNextFolderId(),
							uuid: faker.string.uuid(),
							name: 'terzo livello',
							absFolderPath: '/Inbox/terzo livello',
							l: FOLDERS.INBOX,
							luuid: inboxUuid,
							checked: false,
							f: 'i',
							view: 'message' as FolderView,
							rev: 11453,
							ms: 22118,
							n: 0,
							s: 0,
							i4ms: 14123,
							i4next: 6508,
							activesyncdisabled: false,
							webOfflineSyncDays: 0,
							recursive: false,
							deletable: true,
							acl: {
								grant: [
									{
										zid: getRandomIdentity(mockContext.otherUsersIdentities)?.id ?? '',
										gt: 'usr',
										perm: 'r'
									},
									{
										zid: getRandomIdentity(mockContext.otherUsersIdentities)?.id ?? '',
										gt: 'usr',
										perm: 'r'
									}
								]
							},
							isLink: false,
							children: [],
							parent: undefined,
							depth: 2
						},
						...links
					],
					parent: undefined,
					depth: 1
				},
				{
					id: FOLDERS.SPAM,
					uuid: faker.string.uuid(),
					name: 'Junk',
					absFolderPath: '/Junk',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'message' as FolderView,
					rev: 1,
					ms: 1,
					n: 1,
					s: 10815,
					i4ms: 33396,
					i4next: 17084,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					recursive: false,
					deletable: false,
					isLink: false,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: FOLDERS.SENT,
					uuid: faker.string.uuid(),
					name: 'Sent',
					absFolderPath: '/Sent',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'message' as FolderView,
					rev: 1,
					ms: 1,
					n: 313,
					s: 61983538,
					i4ms: 33637,
					i4next: 17208,
					activesyncdisabled: false,
					webOfflineSyncDays: 30,
					recursive: false,
					deletable: false,
					isLink: false,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: FOLDERS.TRASH,
					uuid: faker.string.uuid(),
					name: 'Trash',
					absFolderPath: '/Trash',
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					rev: 1,
					ms: 28502,
					n: 16,
					s: 319017,
					i4ms: 33653,
					i4next: 17212,
					activesyncdisabled: false,
					webOfflineSyncDays: 30,
					recursive: false,
					deletable: false,
					isLink: false,
					children: [
						{
							id: getNextFolderId(),
							uuid: faker.string.uuid(),
							name: 'Trashed folder',
							absFolderPath: '/Trash/Trashed folder',
							l: FOLDERS.TRASH,
							luuid: trashUuid,
							checked: false,
							f: 'u',
							u: 1,
							view: 'message' as FolderView,
							rev: 27896,
							ms: 27896,
							n: 37,
							s: 5550022,
							i4ms: 33607,
							i4next: 17183,
							activesyncdisabled: false,
							webOfflineSyncDays: 0,
							recursive: false,
							deletable: true,
							isLink: false,
							children: [],
							parent: undefined,
							depth: 2
						},
						{
							id: getNextFolderId(),
							uuid: faker.string.uuid(),
							name: 'trashed address book',
							absFolderPath: '/Trash/trashed address book',
							l: FOLDERS.TRASH,
							luuid: trashUuid,
							checked: false,
							f: 'i',
							view: 'contact' as FolderView,
							rev: 1378,
							ms: 12599,
							n: 0,
							s: 0,
							i4ms: 1378,
							i4next: 684,
							activesyncdisabled: false,
							webOfflineSyncDays: 0,
							recursive: false,
							deletable: true,
							isLink: false,
							children: [],
							parent: undefined,
							depth: 2
						}
					],
					parent: undefined,
					depth: 1
				},
				{
					id: getNextFolderId(),
					uuid: faker.string.uuid(),
					name: `${calendarsRandomUser1?.fullName}'s Calendar`,
					absFolderPath: `/${calendarsRandomUser1?.fullName}'s Calendar`,
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'appointment' as FolderView,
					rev: 25949,
					ms: 25953,
					n: 7353,
					s: 28604595,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					perm: 'r',
					recursive: false,
					rest: `https://${faker.internet.domainName()}/home/${
						calendarsRandomUser1?.email
					}/Calendar`,
					deletable: true,
					owner: calendarsRandomUser1?.email,
					zid: calendarsRandomUser1?.id,
					rid: FOLDERS.CALENDAR,
					ruuid: faker.string.uuid(),
					oname: 'Calendar',
					reminder: false,
					broken: false,
					isLink: true,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: getNextFolderId(),
					uuid: faker.string.uuid(),
					name: `${calendarsRandomUser2?.fullName}'s Calendar`,
					absFolderPath: `/${calendarsRandomUser2?.fullName}'s Calendar`,
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'appointment' as FolderView,
					rev: 24909,
					ms: 25962,
					n: 2177,
					s: 82709085,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					perm: 'r',
					recursive: false,
					rest: `https://${faker.internet.domainName()}/home/${
						calendarsRandomUser2?.email
					}/Calendar`,
					deletable: true,
					owner: calendarsRandomUser2?.email,
					zid: calendarsRandomUser2?.id,
					rid: FOLDERS.CALENDAR,
					ruuid: faker.string.uuid(),
					oname: 'Calendar',
					reminder: false,
					broken: false,
					isLink: true,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: getNextFolderId(),
					uuid: faker.string.uuid(),
					name: `${contactsRandomUser1?.fullName}'s Contacts`,
					absFolderPath: `/${contactsRandomUser1?.fullName}'s Contacts`,
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'contact' as FolderView,
					rev: 7038,
					ms: 7038,
					n: 0,
					s: 0,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					perm: 'rwidxc',
					recursive: false,
					rest: `https://${faker.internet.domainName()}/home/${
						contactsRandomUser1?.email
					}/Contacts`,
					deletable: true,
					owner: contactsRandomUser1?.email,
					zid: contactsRandomUser1?.id,
					rid: FOLDERS.CONTACTS,
					ruuid: 'b86d7fbf-c9ef-42a0-96a2-72fc7bc9879b',
					oname: 'Contacts',
					reminder: false,
					broken: false,
					isLink: true,
					children: [],
					parent: undefined,
					depth: 1
				},
				{
					id: getNextFolderId(),
					uuid: faker.string.uuid(),
					name: `folder of ${mailsRandomUser1?.fullName}`,
					absFolderPath: `/folder of ${mailsRandomUser1?.fullName}`,
					l: FOLDERS.USER_ROOT,
					luuid: rootUuid,
					checked: false,
					view: 'message',
					rev: 36953,
					ms: 36953,
					activesyncdisabled: false,
					webOfflineSyncDays: 0,
					recursive: false,
					deletable: true,
					owner: mailsRandomUser1?.email,
					zid: mailsRandomUser1?.id,
					rid: 19564,
					ruuid: 'a0a9d63b-e27e-48cb-8d9d-6f5ae0832ac3',
					reminder: false,
					broken: false,
					isLink: true,
					children: [],
					parent: FOLDERS.USER_ROOT,
					depth: 1
				}
			],
			parent: undefined,
			depth: 0
		},
		...(!noSharedAccounts &&
			generateSharedAccountsRoot(mockContext.identities.primary, mockContext.identities.sendAs)),
		...(!noSharedAccounts &&
			generateSharedAccountsRoot(
				mockContext.identities.primary,
				mockContext.identities.sendOnBehalf
			))
	} as Folders;

	// Add any child folder to the first level
	roots = { ...roots, ...getFlatChildren(Object.values(roots)) };

	fillReferenceToParent(roots[FOLDERS.USER_ROOT]);

	return roots;
};
