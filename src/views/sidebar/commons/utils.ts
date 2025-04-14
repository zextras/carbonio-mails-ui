/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Folder } from '../../../types';

function filterFolder(folder: Folder, searchString: string): Folder | null {
	const matched = folder.name.toLowerCase().startsWith(searchString);

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
