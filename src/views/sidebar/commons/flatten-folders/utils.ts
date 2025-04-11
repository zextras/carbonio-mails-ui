/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isTrash } from '../../../../carbonio-ui-commons/helpers/folders';
import { isSpam, isTrashed } from '../../../../helpers/folders';
import { sortFolders, getSortCriteria } from '../../../../hooks/use-folders';
import { Folder } from '../../../../types';
import { getSystemFolderTranslatedName } from '../../utils';

export function flattenFolders(
	folders: Array<Folder>,
	options?: {
		showTrashFolder?: boolean;
		showSpamFolder?: boolean;
	}
): Array<Folder> {
	const sortedFolders = sortFolders({ children: folders, sortFunction: getSortCriteria });

	return sortedFolders.flatMap((folder) => {
		const isFilteredOut =
			(!options?.showTrashFolder && (isTrash(folder.id) || isTrashed({ folder }))) ||
			(!options?.showSpamFolder && isSpam(folder.id));

		if (isFilteredOut) {
			return [];
		}

		const currentFolder = {
			...folder,
			name: getSystemFolderTranslatedName({ folderName: folder.name }),
			children: []
		};

		const childFolders = folder.children ? flattenFolders(folder.children, options) : [];

		return [currentFolder, ...childFolders];
	});
}
