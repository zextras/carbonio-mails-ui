/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ZIMBRA_STANDARD_COLORS, FOLDERS, ROOT_NAME } from '@zextras/carbonio-shell-ui';
import { isNil, omitBy, reduce } from 'lodash';

export const normalizeFolder = (folder) =>
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

export const extractFolders = (accordion, acc = {}) =>
	reduce(
		accordion,
		(acc2, folder) => {
			if (folder.folder) {
				return (folder.view === 'message' && folder.id !== '14' && folder.id !== '1') ||
					folder.id === '3'
					? {
							...acc2,
							[folder.id]: normalizeFolder(folder),
							...extractFolders(folder.folder, acc2)
					  }
					: { ...acc2, ...extractFolders(folder.folder, acc2) };
			}
			return (folder.view === 'message' && folder.id !== '14' && folder.id !== '1') ||
				folder.id === '3'
				? {
						...acc2,
						[folder.id]: normalizeFolder(folder)
				  }
				: acc2;
		},
		acc
	);

export function capitalise(word) {
	const asciiRef = word.charCodeAt(0);
	const newAsciiRef = asciiRef - 32;
	const newChar = String.fromCharCode(newAsciiRef);
	return newChar + word.substr(1);
}

export const getFolderIconColor = (f) =>
	f.folder.color < 10
		? ZIMBRA_STANDARD_COLORS[f.folder.color].hex
		: f?.folder.rgb ?? ZIMBRA_STANDARD_COLORS[0].hex;

export const getFolderIconName = (folder) => {
	const systemFolders = [
		FOLDERS.USER_ROOT,
		FOLDERS.INBOX,
		FOLDERS.TRASH,
		FOLDERS.DRAFTS,
		FOLDERS.SPAM,
		FOLDERS.SENTa
	];

	if (folder.id === FOLDERS.USER_ROOT || folder.oname === ROOT_NAME) {
		return null;
	}
	if (folder.folder.isLink) {
		return 'ShareOutline';
	}
	if (systemFolders.includes(folder.id)) {
		switch (folder.id) {
			case FOLDERS.INBOX:
				return 'InboxOutline';
			case FOLDERS.USER_ROOT:
				return 'PersonOutline';
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
