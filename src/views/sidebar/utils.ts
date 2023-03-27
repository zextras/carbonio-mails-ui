/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	AccordionFolder,
	FOLDERS,
	Folder,
	LinkFolder,
	LinkFolderFields,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	ROOT_NAME,
	ZIMBRA_STANDARD_COLORS,
	t
} from '@zextras/carbonio-shell-ui';
import { isNil, omitBy, reduce } from 'lodash';
import { MailMessage } from '../../types';

const folderIdRegex = /^(.+:)*(\d+)$/;

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

export const getFolderIconColor = (f: Folder): string => {
	if (f?.color) {
		return Number(f.color) < 10
			? ZIMBRA_STANDARD_COLORS[Number(f.color)].hex
			: f?.rgb ?? ZIMBRA_STANDARD_COLORS[0].hex;
	}
	return ZIMBRA_STANDARD_COLORS[0].hex;
};

export const getFolderIconNameForAccordionFolder = (folder: AccordionFolder): string | null => {
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

export const getFolderIconName = (folder: Folder): string | null => {
	const systemFolders = [
		FOLDERS.USER_ROOT,
		FOLDERS.INBOX,
		FOLDERS.TRASH,
		FOLDERS.DRAFTS,
		FOLDERS.SPAM,
		FOLDERS.SENT
	];

	if (folder.id === FOLDERS.USER_ROOT || (folder.isLink && folder.oname === ROOT_NAME)) {
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
	const id = folderIdRegex.exec(folderId ?? '')?.[2];
	if (id && Object.values(FOLDERS).includes(id)) {
		return getSystemFolderTranslatedName({ folderName });
	}

	return folderName;
};

/**
 * Returns the root account name for a given folder
 * @param folder a Folder or LinkFolder
 * @returns the root account name or null if the folder is not a link or the root folder
 */
export const getRootAccountName = (folder: Folder | LinkFolder): string | null => {
	if (
		folder?.isLink &&
		folder?.owner &&
		folder.parent?.parent === undefined &&
		folder.oname === ROOT_NAME
	) {
		return folder?.owner;
	}
	if (folder?.parent) {
		return getRootAccountName(folder?.parent);
	}
	return null;
};

/**
 * Returns the parent folder id for a given folder
 * @param message a Folder or LinkFolder
 * @returns the parent folder id or null if the folder is not a link or the root folder
 */
export const getParentId = (message: Partial<MailMessage>): string =>
	(message.parent?.includes(':') ? message.parent?.split(':')[1] : message.parent) ?? '0';

/**
 * Returns the parent folder id for a given folder
 * @param folder a Folder or LinkFolder
 * @returns the path to pass down as props to the Breadcrumb component
 */
export const getFolderPathForBreadcrumb = (
	folderPath: string
): { folderPathFirstPart: string; folderPathLastPart: string } => {
	if (folderPath === '') return { folderPathFirstPart: '', folderPathLastPart: '' };
	const folderPathArray = folderPath.split('/');
	const folderPathLastPart = `/ ${folderPathArray[folderPathArray.length - 1]}`;
	folderPathArray.pop();
	const folderPathFirstPart = folderPathArray.join('/');
	return { folderPathFirstPart, folderPathLastPart };
};
