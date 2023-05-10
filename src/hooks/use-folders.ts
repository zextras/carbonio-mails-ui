/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { sortBy } from 'lodash';
import { useMemo } from 'react';
import { useRootsArray } from '../carbonio-ui-commons/store/zustand/folder/hooks';
import { Folder } from '../carbonio-ui-commons/types/folder';
import { getFolderIdParts } from '../helpers/folders';

/**
 * calculate the sorting criteria for a given folder
 * system folders are placed before user folders
 * the trash folder is always the last one
 * @param folder
 * @returns the sorting criteria
 */
const getSortCriteria = (folder: Folder): string => {
	const { id } = getFolderIdParts(folder.id);
	if (id === FOLDERS.TRASH) {
		return FOLDERS.LAST_SYSTEM_FOLDER_POSITION;
	}
	return parseInt(id ?? '', 10) < 17 ? `   ${id}` : folder.name.toLowerCase();
};

/**
 * recursively sort the children of a folder according to a given sort function
 * @param children
 * @param sortFunction
 * @returns the sorted children
 */
const sortFolders = ({
	children,
	sortFunction
}: {
	children: Folder[];
	sortFunction: (folder: Folder) => number | string;
}): Folder[] => {
	const childrenSorted = sortBy(children, sortFunction);
	return childrenSorted.map((folder) => ({
		...folder,
		children: sortFolders({ children: folder.children, sortFunction })
	}));
};

/**
 * sorts the children of the useRootsArray hook according to the specified sort function
 * @returns the sorted children
 */
export const useFolders = (): Array<Folder> => {
	const roots = useRootsArray();
	return useMemo(() => sortFolders({ children: roots, sortFunction: getSortCriteria }), [roots]);
};
