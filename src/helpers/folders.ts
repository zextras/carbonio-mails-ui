/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, Folder, LinkFolder, ROOT_NAME } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';
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
const getFolderIdParts = (folderId: string): FolderIdType => {
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
const getFolderOtherOwnerAccountName = (
	folderId: string,
	folderRoots: Record<string, Folder & { owner: string }>
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

	return matchingFolderRoot.owner;
};

/**
 * Returns the account name of the owner of the folder, based on the folder id
 * @param folderId
 * @param primaryAccount
 * @param folderRoots
 */
const getFolderOwnerAccountName = (
	folderId: string,
	primaryAccount: Account,
	folderRoots: Record<string, Folder & { owner: string }>
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
const getMessageOwnerAccountName = (
	message: MailMessage,
	primaryAccount: Account,
	folderRoots: Record<string, Folder & { owner: string }>
): string => getFolderOwnerAccountName(message.parent, primaryAccount, folderRoots);

export {
	getFolderIdParts,
	getFolderOwnerAccountName,
	getMessageOwnerAccountName,
	getFolderOtherOwnerAccountName
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
 * Removes the uuid and colon from a folder id (e.g. 123456:2 -> 2)
 * @param folderId a folder id
 * @returns the folder id without the uuid and colon
 */
export const getSystemFolderParentId = (folderId: string): string =>
	(folderId.includes(':') ? folderId?.split(':')[1] : folderId) ?? '0';

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
