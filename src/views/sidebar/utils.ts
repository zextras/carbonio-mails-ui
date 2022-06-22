/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	ZIMBRA_STANDARD_COLORS,
	FOLDERS,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	ROOT_NAME,
	AccordionFolder,
	Folder,
	LinkFolderFields
} from '@zextras/carbonio-shell-ui';
import { isNil, omitBy, reduce } from 'lodash';
import { TFunction } from 'react-i18next';

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
	const asciiRef = word.charCodeAt(0);
	const newAsciiRef = asciiRef - 32;
	const newChar = String.fromCharCode(newAsciiRef);
	return newChar + word.substring(1);
};

export const getFolderIconColor = (f: AccordionFolder): string => {
	if (f?.folder?.color) {
		return Number(f.folder.color) < 10
			? ZIMBRA_STANDARD_COLORS[Number(f.folder.color)].hex
			: f?.folder.rgb ?? ZIMBRA_STANDARD_COLORS[0].hex;
	}
	return ZIMBRA_STANDARD_COLORS[0].hex;
};

export const getFolderIconName = (folder: AccordionFolder): string | null => {
	const systemFolders = [
		FOLDERS.USER_ROOT,
		FOLDERS.INBOX,
		FOLDERS.TRASH,
		FOLDERS.DRAFTS,
		FOLDERS.SPAM,
		FOLDERS.SENT
	];

	if (folder.id === FOLDERS.USER_ROOT || folder.folder?.oname === ROOT_NAME) {
		return null;
	}

	if (folder.id && systemFolders.includes(folder.id)) {
		switch (folder.id) {
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
	if (
		folder.id?.charAt(folder.id.length - 2) === ':' &&
		systemFolders.includes(folder.id.slice(-1))
	) {
		switch (folder.id.slice(-1)) {
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

export const translatedSystemFolders = (t: TFunction): Array<string> => [
	t('folders.inbox', 'Inbox'),
	t('label.sent', 'Sent'),
	t('folders.drafts', 'Drafts'),
	t('folders.trash', 'Trash'),
	t('folders.spam', 'Spam')
];

type GetSystemFolderProps = {
	t: TFunction;
	folderName: string;
};

export const getSystemFolderTranslatedName = ({ t, folderName }: GetSystemFolderProps): string => {
	if (folderName) {
		switch (folderName) {
			case 'Inbox':
				return t('folders.inbox', 'Inbox');
			case 'Sent':
				return t('label.sent', 'Sent');
			case 'Drafts':
				return t('folders.drafts', 'Drafts');
			case 'Trash':
				return t('folders.trash', 'Trash');
			case 'Spam':
				return t('folders.spam', 'Spam');
			default:
				return folderName;
		}
	}
	return folderName;
};
