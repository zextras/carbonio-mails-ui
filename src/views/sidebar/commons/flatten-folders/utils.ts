/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/no-use-before-define */

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

export function flattenRootsFolders(
	roots: Array<Folder>,
	options?: {
		showTrashFolder?: boolean;
		showSpamFolder?: boolean;
	}
): Array<Folder> {
	return roots.map((root) => ({
		...root,
		children: flattenFolders(root.children, options)
	}));
}

function filterFolder(folder: Folder, searchString: string): Folder | null {
	const matched = folder.name.toLowerCase().includes(searchString);

	const children =
		folder.children?.length > 0 ? filterFoldersByName(folder.children, searchString) : [];

	if (matched || children.length > 0) {
		return children.length > 0 || folder.children?.length !== children.length
			? { ...folder, children }
			: folder;
	}

	return null;
}

export function filterFoldersByName(folders: Folder[], search: string): Folder[] {
	if (search.length === 0) return folders;

	const lowerCaseSearch = search.toLowerCase();

	return folders.reduce<Folder[]>((acc, folder) => {
		const filteredFolder = filterFolder(folder, lowerCaseSearch);
		if (filteredFolder) acc.push(filteredFolder);
		return acc;
	}, []);
}
