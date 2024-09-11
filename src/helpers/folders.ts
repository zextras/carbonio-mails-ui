/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getUserAccount } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { FOLDERS } from '../carbonio-ui-commons/constants/folders';
import { useFolderStore } from '../carbonio-ui-commons/store/zustand/folder/store';
import type { Folder, Folders } from '../carbonio-ui-commons/types/folder';
import { NO_ACCOUNT_NAME } from '../constants';
import type { MailMessage } from '../types';

/*
 * Describe the folder id syntax
 *
 * [<zid>:]<folderId>
 *
 * e.g. a79fa996-e90e-4f04-97c4-c84209bb8277:2
 */
const FOLDERID_REGEX = /^([^:]+(?=:))*:?(\d+)$/;

type FolderIdType = { zid: string | null; id: string | null };

/**
 * Parse the given folder id and returns on object with the composing parts of the folder id
 * @param folderId
 */
export const getFolderIdParts = (folderId: string): FolderIdType => {
	const result: FolderIdType = { zid: null, id: null };

	if (!folderId || !folderId.match(FOLDERID_REGEX)) {
		return result;
	}

	const parts = FOLDERID_REGEX.exec(folderId);
	if (!parts) {
		return result;
	}

	[, result.zid = null, result.id = null] = parts;
	return result;
};

/**
 * Get the account name of the owner of the given folder, if the owner is an
 * "other" account, different from the primary account of the current user.
 * If the owner is the primary account then <code>null</code> is returned
 * @param folderId
 * @param folderRoots
 */
export const getFolderOtherOwnerAccountName = (
	folderId: string,
	folderRoots: Folders
): string | null => {
	if (!folderId) {
		return null;
	}

	const { zid } = getFolderIdParts(folderId);
	if (!zid) {
		return null;
	}

	/** find the folderRoots for which the id corresponds to the message zid
	 * if the folderRoots has an owner, return the owner
	 * if not, return null
	 * */

	const matchingFolderRoot = find(folderRoots, (c) => c.id.includes(zid));
	if (!matchingFolderRoot) {
		return null;
	}

	return 'owner' in matchingFolderRoot && matchingFolderRoot.owner
		? matchingFolderRoot.owner
		: null;
};

/**
 * Returns the account name of the owner of the folder, based on the folder id
 * @param folderId
 * @param folderRoots
 */
export const getFolderOwnerAccountName = (folderId: string, folderRoots: Folders): string => {
	const primaryAccount = getUserAccount();

	/*
	 * Try to get the account of the "other" owner, aka an owner which
	 * is not the primary account of the current user
	 */
	const otherOwnerAccount = getFolderOtherOwnerAccountName(folderId, folderRoots);

	if (!otherOwnerAccount) {
		return primaryAccount?.name ?? NO_ACCOUNT_NAME;
	}

	return otherOwnerAccount;
};

/**
 * Returns the account name of the owner of the message, based on the message's parent folder
 * @param message
 * @param folderRoots
 */
export const getMessageOwnerAccountName = (message: MailMessage, folderRoots: Folders): string =>
	getFolderOwnerAccountName(message.parent, folderRoots);

/**
 * Returns the parent folder id for a given folder
 * @param folderPath a Folder or LinkFolder
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

/**
 * Tells if a folder with the given id is a spam folder
 * @param folderId
 * @param folderType
 */
export const isA = (folderId: string, folderType: keyof Folders): boolean => {
	if (!folderId) {
		return false;
	}
	return getFolderIdParts(folderId).id === folderType;
};

/**
 * Tells if a folder with the given id is a root folder
 * @param folderId
 */
export const isRoot = (folderId: string): boolean => isA(folderId, FOLDERS.USER_ROOT);

/**
 * Tells if a folder with the given id is am inbox folder
 * @param folderId
 */
export const isInbox = (folderId: string): boolean => isA(folderId, FOLDERS.INBOX);

/**
 * Tells if a folder with the given id is a trash folder
 * @param folderId
 */
export const isTrash = (folderId: string): boolean => isA(folderId, FOLDERS.TRASH);

/**
 * Tells if a folder with the given id is a spam folder
 * @param folderId
 */
export const isSpam = (folderId: string): boolean => isA(folderId, FOLDERS.SPAM);

/**
 * Tells if a folder with the given id is a spam folder
 * @param folderId
 */
export const isSent = (folderId: string): boolean => isA(folderId, FOLDERS.SENT);

/**
 * Tells if a folder with the given id is a draft folder
 * @param folderId
 */
export const isDraft = (folderId: string): boolean => isA(folderId, FOLDERS.DRAFTS);

/**
 * Tells if a folder is a trashed folder
 * @param folder
 * @param folderId
 */
export const isTrashed = ({
	folder,
	folderId
}: {
	folder?: Folder;
	folderId?: string;
}): boolean => {
	if (!folder && !folderId) {
		return false;
	}
	const folderIdAbsPath = useFolderStore.getState()?.folders?.[folderId ?? '']?.absFolderPath;

	const path = folder ? folder.absFolderPath : folderIdAbsPath;
	if (!path) {
		return false;
	}

	return path.toLowerCase().startsWith('/trash');
};

/**
 * Tells if a folder is a subfolder of the inbox folder
 * @param folderId
 */
export const isInboxSubfolder = ({
	folder,
	folderId
}: {
	folder?: Folder;
	folderId?: string;
}): boolean => {
	if (!folder && !folderId) {
		return false;
	}

	const folderIdAbsPath = useFolderStore.getState()?.folders?.[folderId ?? '']?.absFolderPath;
	const path = folder ? folder.absFolderPath : folderIdAbsPath;
	if (!path) {
		return false;
	}

	return path.toLowerCase().startsWith('/inbox');
};

/**
 * Returns the parent folder id of the given message.
 *
 * In most of the cases the id coincide with the "parent" property of
 * the message, but they differ when the message is contained in a linked folder: in this
 * case the "parent" refers to the original owner folder zid and id, so there is the need
 * to "translate" those ids
 *
 * @param parentId - string
 */
export const getParentFolderId = (parentId: string): string => {
	const parentParts = getFolderIdParts(parentId);

	/*
	 * If the zid is not present the id is referring to a normal user's folder
	 * so there is no need to search among the stored folders
	 */
	if (!parentParts.zid) {
		return parentId;
	}

	/*
	 * If the parentId is in the form zid:(r)id it could refer to a shared account folder
	 * or a linked folder.
	 */

	// First attempt: search for a shared account folder among the stored folders.
	if (useFolderStore.getState()?.folders?.[parentId]) {
		return parentId;
	}

	// Second attempt: search for an entry on the links id map, or return null otherwise
	const state = useFolderStore.getState();
	return state.linksIdMap[parentId] ?? null;
};

/*
 * Tells if a folder is a folder of a shared account
 * @param folderId
 */
export function isSharedAccountFolder(folderId: string): boolean {
	return getFolderIdParts(folderId).zid !== null;
}

export function getFoldersArray(folders: Folders): Folder[] {
	return Object.values(folders);
}
