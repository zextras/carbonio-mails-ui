/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
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
