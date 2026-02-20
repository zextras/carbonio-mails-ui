/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useMemo } from 'react';

import { Folder, FOLDERS, getRootsArray, useRootsArray } from '@zextras/carbonio-ui-commons';
import { sortBy } from 'lodash';

import { getFolderIdParts } from 'helpers/folders';

/**
 * calculate the sorting criteria for a given folder
 * system folders are placed before user folders
 * the trash folder is always the second last one
 * the archive folder is always the last one
 * @param folder
 * @returns the sorting criteria
 */
export const getSortCriteria = (folder: Folder): string => {
	const { id } = getFolderIdParts(folder.id);
	if (id === FOLDERS.ARCHIVE) {
		return FOLDERS.LAST_SYSTEM_FOLDER_POSITION;
	}
	if (id === FOLDERS.TRASH) {
		return (Number.parseFloat(FOLDERS.LAST_SYSTEM_FOLDER_POSITION) - 1).toString();
	}
	const higherThanSystemFolders = Number.parseInt(FOLDERS.LAST_SYSTEM_FOLDER_POSITION, 10) + 1;
	return Number.parseInt(id ?? '', 10) < higherThanSystemFolders
		? `   ${id}`
		: folder.name.toLowerCase();
};

/**
 * recursively sort the children of a folder according to a given sort function
 * @param children
 * @param sortFunction
 * @returns the sorted children
 */
export const sortFolders = ({
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

/**
 * sorts the children of the getRootsArray hook according to the specified sort function
 * @returns the sorted children
 */
export const getFolders = (): Array<Folder> => {
	const roots = getRootsArray();
	return sortFolders({ children: roots, sortFunction: getSortCriteria });
};
