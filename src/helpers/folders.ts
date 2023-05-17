/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, FOLDERS } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';
import { getFolder } from '../carbonio-ui-commons/store/zustand/folder';
import type { Folder, Folders, LinkFolder } from '../carbonio-ui-commons/types/folder';
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

	// If the id contains the zid, the account is considered the owner if the zid matches the account id
	const matchingFolderRoot = find(folderRoots, { zid });
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
 * @param primaryAccount
 * @param folderRoots
 */
export const getFolderOwnerAccountName = (
	folderId: string,
	primaryAccount: Account,
	folderRoots: Folders
): string => {
	/*
	 * Try to get the account of the "other" owner, aka an owner which is not the primary account of the current user
	 */
	const otherOwnerAccount = getFolderOtherOwnerAccountName(folderId, folderRoots);

	if (!otherOwnerAccount) {
		return primaryAccount.name;
	}

	return otherOwnerAccount;
};

/**
 * Returns the account name of the owner of the message, based on the message's parent folder
 * @param message
 * @param primaryAccount
 * @param folderRoots
 */
export const getMessageOwnerAccountName = (
	message: MailMessage,
	primaryAccount: Account,
	folderRoots: Folders
): string => getFolderOwnerAccountName(message.parent, primaryAccount, folderRoots);

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

/**
 * Tells if a folder with the given id is a spam folder
 * @param folderId
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
export const isDraft = (folderId: string): boolean => isA(folderId, FOLDERS.DRAFT);

/**
 * Tells if a folder with the given id is a spam folder
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

	const path = folder ? folder.absFolderPath : getFolder(folderId ?? '')?.absFolderPath;
	if (!path) {
		return false;
	}

	return path.toLowerCase().startsWith('/trash');
};
