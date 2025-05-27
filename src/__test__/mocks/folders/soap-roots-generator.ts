/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { map, orderBy } from 'lodash';

import { FOLDERS } from '../../../constants/folders';
import { BaseFolder, FolderView, SoapFolder, SoapLink } from '../../../types/folder';
import { getMocksContext } from '../utils/mocks-context';

let luuid: string | undefined = '';
const ids: Array<number> = [];
const names: Array<string> = [];

export const BASE_FOLDER_CALENDAR_ARGS = {
	id: '10',
	name: 'Calendar',
	absFolderPath: `/Calendar`,
	l: '1',
	view: 'appointment' as FolderView
};

type SystemFolderRequiredType = {
	id: string;
	name: string;
	absFolderPath: string;
	l: string;
	view: FolderView;
};

export const getUniqueID = (min?: number, max?: number): string => {
	const id = faker.number.int({ min: min ?? 200, max: max ?? 99999 });
	if (ids.includes(id)) {
		return getUniqueID();
	}
	ids.push(id);
	return `${id}`;
};

const getUniqueName = (): string => {
	const name = faker.word.noun();
	if (names.includes(name)) {
		return getUniqueName();
	}
	names.push(name);
	return name;
};

export const getRandomView = (): FolderView => {
	const views = ['search folder', 'message', 'contact', 'appointment'] as FolderView[];
	const randomNumber = faker.number.int({ min: 0, max: views.length });
	return views[randomNumber];
};

/** Generate a random soap custom child given a parent of type BaseFolder | SoapLink
 * @param parent
 * */
export const generateSoapCustomChild = (parent: BaseFolder | SoapLink): BaseFolder | SoapLink => {
	const parentIsSoapLink = 'owner' in parent;
	const id = parentIsSoapLink ? `${parent.uuid}:${getUniqueID()}` : getUniqueID();
	const name = getUniqueName();
	return {
		id,
		uuid: faker.string.uuid(),
		deletable: true,
		name,
		absFolderPath: `${parent && parent.absFolderPath === '/' ? '' : parent.absFolderPath}/${name}`,
		l: parent.id,
		luuid,
		f: '',
		recursive: true,
		color: faker.number.int({ min: 1, max: 7 }),
		u: faker.number.int({ min: 0, max: 5 }),
		view: parent?.view ?? getRandomView(),
		rev: 1,
		ms: faker.number.int({ min: 1, max: 99999 }),
		webOfflineSyncDays: 30,
		activesyncdisabled: false,
		n: faker.number.int({ min: 1, max: 99999 }),
		s: faker.number.int({ min: 1, max: 99999 }),
		i4ms: faker.number.int({ min: 1, max: 99999 }),
		i4next: faker.number.int({ min: 1, max: 99999 }),
		...(parentIsSoapLink ? { perm: 'rwidxc' } : {}),
		acl: {
			grant: []
		}
	};
};

/** Generate a random soap link given a parent of type SoapLink or BaseFolder
 * @param parent
 * */
export const generateSoapLink = (parent: SoapLink | BaseFolder): SoapLink => {
	const link = generateSoapCustomChild(parent);
	return {
		...link,
		perm: 'r',
		broken: false,
		owner: faker.internet.email(),
		rid: `${faker.number.int({ min: 300, max: 900 })}`,
		ruuid: faker.string.uuid(),
		zid: faker.string.uuid(),
		reminder: false
	} as SoapLink;
};

const generateSoapNodes = (
	parent: BaseFolder | SoapLink,
	max: number,
	isLink: boolean,
	traverse: boolean
): SoapFolder[] | SoapLink[] => {
	const childrenNumber = faker.number.int({ min: 0, max });
	const hasChildren = childrenNumber > 0;
	if (hasChildren) {
		return map(Array.from({ length: childrenNumber }), () => {
			const child = isLink
				? generateSoapLink(parent as SoapLink)
				: generateSoapCustomChild(parent as BaseFolder);
			if (isLink && !traverse) {
				return child as SoapLink;
			}
			return {
				...child,
				link: generateSoapNodes(child, max - 1, true, traverse) as SoapLink[],
				folder: generateSoapNodes(child, max - 1, false, traverse)
			} as SoapFolder;
		});
	}
	return [];
};

/** Generate a customizable soap system folder of BaseFolder type
 * @param id
 * @param name
 * @param absFolderPath
 * @param l
 * @param view
 * */
export const generateSoapSystemFolder = ({
	id,
	name,
	absFolderPath,
	l,
	view
}: SystemFolderRequiredType): BaseFolder => ({
	id,
	uuid: faker.string.uuid(),
	deletable: false,
	name,
	absFolderPath,
	l,
	luuid,
	f: 'i',
	color: faker.number.int({ min: 0, max: 7 }),
	u: faker.number.int({ min: 0, max: 5 }),
	view: view ?? getRandomView(),
	rev: 1,
	recursive: true,
	ms: faker.number.int({ min: 1, max: 99999 }),
	webOfflineSyncDays: 30,
	activesyncdisabled: false,
	n: faker.number.int({ min: 1, max: 99999 }),
	s: faker.number.int({ min: 1, max: 99999 }),
	i4ms: faker.number.int({ min: 1, max: 99999 }),
	i4next: faker.number.int({ min: 1, max: 99999 }),
	acl: {
		grant: []
	}
});

const generateSoapInboxFolder = (
	parent: BaseFolder,
	traverse: boolean,
	isPrimaryAccount: boolean
): SoapFolder => {
	const inbox = generateSoapSystemFolder({
		id: isPrimaryAccount ? '2' : `${luuid}:2`,
		name: 'Inbox',
		absFolderPath: `${parent.absFolderPath === '/' ? '' : parent.absFolderPath}/Inbox`,
		l: isPrimaryAccount ? '1' : `${luuid}:1`,
		view: 'message'
	});
	// refs: SHELL-118
	// todo: BaseFolder color type inside shell is still wrong. Wait for a fix before removing this ts-ignore
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return {
		...inbox,
		folder: generateSoapNodes(inbox, 3, false, traverse),
		link: generateSoapNodes(inbox, 2, true, traverse) as SoapLink[]
	};
};

const generateSoapCalendarFolder = (parent: BaseFolder, traverse: boolean): SoapFolder => {
	const inbox = generateSoapSystemFolder(BASE_FOLDER_CALENDAR_ARGS);
	// refs: SHELL-118
	// todo: BaseFolder color type inside shell is still wrong. Wait for a fix before removing this ts-ignore
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return {
		...inbox,
		folder: generateSoapNodes(inbox, 3, false, traverse),
		link: generateSoapNodes(inbox, 2, true, traverse) as SoapLink[]
	};
};

const generateSoapSystemFolders = (
	parent: BaseFolder,
	traverse: boolean,
	isPrimaryAccount: boolean
): SoapFolder[] => {
	const inbox = generateSoapInboxFolder(parent, traverse, isPrimaryAccount);
	const calendar = generateSoapCalendarFolder(parent, traverse);
	return [inbox, calendar];
};

/** Generate an account root of BaseFolder type
 * @param isPrimaryAccount
 * */
export const getAccountSoapRoot = (isPrimaryAccount: boolean): BaseFolder => ({
	id: isPrimaryAccount ? '1' : `${luuid}:1`,
	uuid: faker.string.uuid(),
	deletable: false,
	recursive: true,
	name: isPrimaryAccount ? FOLDERS.USER_ROOT : faker.string.alpha(10),
	...(isPrimaryAccount ? { oname: FOLDERS.USER_ROOT } : {}),
	absFolderPath: '/',
	...(isPrimaryAccount ? { l: '1' } : {}),
	luuid,
	f: 'i',
	rev: 1,
	ms: faker.number.int({ min: 1, max: 99999 }),
	webOfflineSyncDays: 0,
	activesyncdisabled: false,
	n: 1,
	s: 0,
	i4ms: faker.number.int({ min: 1, max: 99999 }),
	i4next: faker.number.int({ min: 1, max: 99999 }),
	...(isPrimaryAccount
		? {
				acl: {
					grant: []
				}
			}
		: {})
});

const generateAccountSoapRoot = (traverse: boolean, isPrimaryAccount: boolean): SoapFolder => {
	const mainAccountSoapRoot = getAccountSoapRoot(isPrimaryAccount);
	const soapSystemFolders = generateSoapSystemFolders(
		mainAccountSoapRoot,
		traverse,
		isPrimaryAccount
	);
	const customSoapChildren = generateSoapNodes(mainAccountSoapRoot, 3, false, traverse);

	const folder = [...soapSystemFolders, ...orderBy(customSoapChildren, 'id', 'asc')];
	const link = generateSoapNodes(mainAccountSoapRoot, 3, true, traverse) as SoapLink[];
	// refs: SHELL-118
	// todo: BaseFolder color type inside shell is still wrong. Wait for a fix before removing this ts-ignore
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return {
		...mainAccountSoapRoot,
		folder,
		link
	};
};

/** Generate a random soap root of SoapFolder type
 * @param traverse
 * @param isPrimaryAccount
 * @param id
 * */
export const generateSoapRoot = (
	traverse: boolean,
	isPrimaryAccount: boolean,
	id: string
): SoapFolder => {
	const { identities } = getMocksContext();
	luuid = isPrimaryAccount ? identities.primary.userRootId : id;
	return generateAccountSoapRoot(traverse, isPrimaryAccount);
};
