/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { type AccordionItemType } from '@zextras/carbonio-design-system';
import { FOLDERS, ROOT_NAME, ZIMBRA_STANDARD_COLORS, t } from '@zextras/carbonio-shell-ui';
import { isNil, omitBy, reduce } from 'lodash';

import { isSystemFolder } from '../../carbonio-ui-commons/helpers/folders';
import {
	type AccordionFolder,
	type Folder,
	type LinkFolderFields
} from '../../carbonio-ui-commons/types/folder';
import { getFolderIdParts } from '../../helpers/folders';

export const normalizeFolder = (
	folder: Folder & Partial<LinkFolderFields>
): Partial<Folder & Partial<LinkFolderFields>> =>
	omitBy(
		{
			id: folder.id,
			uuid: folder.uuid,
			color: folder.color,
			name: folder.name,
			path: folder.absFolderPath,
			parent: folder.l,
			parentUuid: folder.luuid,
			itemsCount: folder.n,
			size: folder.s,
			unreadCount: folder.u,
			synced: true,
			rgb: folder.rgb,
			owner: folder.owner,
			rid: folder.rid,
			zid: folder.zid,
			acl: folder.acl,
			perm: folder.perm,
			isSharedFolder: !!folder.owner,
			retentionPolicy: folder.retentionPolicy,
			view: folder.view
		},
		isNil
	);

export const extractFolders = (accordion: Array<any>, acc = {}): any =>
	reduce(
		accordion,
		(acc2, folder) => {
			if (folder.folder) {
				return (folder.view === 'message' &&
					folder.id !== FOLDERS.IM_LOGS &&
					folder.id !== FOLDERS.USER_ROOT) ||
					folder.id === FOLDERS.TRASH
					? {
							...acc2,
							[folder.id]: normalizeFolder(folder),
							...extractFolders(folder.folder, acc2)
						}
					: { ...acc2, ...extractFolders(folder.folder, acc2) };
			}
			return (folder.view === 'message' &&
				folder.id !== FOLDERS.IM_LOGS &&
				folder.id !== FOLDERS.USER_ROOT) ||
				folder.id === FOLDERS.TRASH
				? {
						...acc2,
						[folder.id]: normalizeFolder(folder)
					}
				: acc2;
		},
		acc
	);

export const capitalise = (word: string): string => {
	const asciiRef = word?.charCodeAt(0);
	const newAsciiRef = asciiRef - 32;
	const newChar = String.fromCharCode(newAsciiRef);
	return word ? newChar + word.substring(1) : '';
};

export const getFolderIconColorForAccordionFolder = (f: AccordionFolder): string => {
	if (f?.folder?.color) {
		return f.folder.color < 10
			? ZIMBRA_STANDARD_COLORS[f.folder.color].hex
			: f?.folder.rgb ?? ZIMBRA_STANDARD_COLORS[0].hex;
	}
	return ZIMBRA_STANDARD_COLORS[0].hex;
};

export const getFolderIconColor = (f: Folder | AccordionItemType): string => {
	if ('color' in f && f?.color) {
		return Number(f.color) < 10
			? ZIMBRA_STANDARD_COLORS[Number(f.color)].hex
			: f?.rgb ?? ZIMBRA_STANDARD_COLORS[0].hex;
	}
	return ZIMBRA_STANDARD_COLORS[0].hex;
};

export const getFolderIconName = (folder: Folder | AccordionItemType): string | null => {
	const { id } = getFolderIdParts(folder.id);
	if (
		id === FOLDERS.USER_ROOT ||
		('isLink' in folder && folder.isLink && folder.oname === ROOT_NAME)
	) {
		return null;
	}

	if (id && isSystemFolder(id)) {
		switch (id) {
			case FOLDERS.INBOX:
				return 'InboxOutline';
			case FOLDERS.DRAFTS:
				return 'FileOutline';
			case FOLDERS.SENT:
				return 'PaperPlaneOutline';
			case FOLDERS.SPAM:
				return 'SlashOutline';
			case FOLDERS.TRASH:
				return 'Trash2Outline';
			default:
				return 'FolderOutline';
		}
	}
	return 'FolderOutline';
};

export const translatedSystemFolders = (): Array<string> => [
	t('folders.inbox', 'Inbox'),
	t('folders.sent', 'Sent'),
	t('folders.drafts', 'Drafts'),
	t('folders.trash', 'Trash'),
	t('folders.spam', 'Spam'),
	t('folders.junk', 'Junk')
];

type GetSystemFolderProps = {
	folderId?: string;
	folderName: string;
};

export const getSystemFolderTranslatedName = ({ folderName }: GetSystemFolderProps): string => {
	if (folderName) {
		switch (folderName) {
			case 'Inbox':
				return t('folders.inbox', 'Inbox');
			case 'Sent':
				return t('folders.sent', 'Sent');
			case 'Drafts':
				return t('folders.drafts', 'Drafts');
			case 'Trash':
				return t('folders.trash', 'Trash');
			case 'Spam':
				return t('folders.spam', 'Spam');
			case 'Junk':
				return t('folders.junk', 'Junk');
			default:
				return folderName;
		}
	}
	return folderName;
};

export const getFolderTranslatedName = ({ folderId, folderName }: GetSystemFolderProps): string => {
	const { id } = getFolderIdParts(folderId ?? '');
	if (id && isSystemFolder(id)) {
		return getSystemFolderTranslatedName({ folderName });
	}

	return folderName;
};
