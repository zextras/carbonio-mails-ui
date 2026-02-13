/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isTrash } from '@zextras/carbonio-ui-commons';

import type { FolderSortOrder, SortDirection } from '../types';

const fallbackSortOrder: FolderSortOrder = {
	sortType: 'date',
	sortDirection: 'Desc' as SortDirection
};
const trashFolderSortOrder: FolderSortOrder = {
	sortType: 'changeDate',
	sortDirection: 'Desc' as SortDirection
};

export function findFolderEntry(
	prefSortOrder: string,
	folderId: string
): { currentFolder: string | undefined; parameters: string[] | undefined } {
	if (!folderId || !prefSortOrder) return { currentFolder: undefined, parameters: undefined };

	const folders = prefSortOrder.split(',');
	const currentFolder = folders.find((folder) => folder.startsWith(`${folderId}:`));
	if (!currentFolder) return { currentFolder: undefined, parameters: undefined };

	const parameters = currentFolder.replace(',BDLV', '').replace(`${folderId}:`, '').split('-');

	return { currentFolder, parameters };
}
/**
 * Returns sortType, sortDirection and sortOrder for the given folder
 *
 * @param folderId
 * @param prefSortOrder
 *
 * returns an object containing
 * sortType: the sort type for the given folder,
 * sortDirection: the sort direction for the given folder,
 */
export function parseMessageSortingOptions(
	folderId: string,
	prefSortOrder?: string
): FolderSortOrder {
	const isTrashFolder = isTrash(folderId);
	const defaultSortOrder = isTrashFolder ? trashFolderSortOrder : fallbackSortOrder;

	if (!prefSortOrder || !folderId) {
		return defaultSortOrder;
	}
	const { parameters } = findFolderEntry(prefSortOrder ?? '', folderId);
	if (parameters?.length === 2) {
		return {
			sortType: parameters[0],
			sortDirection: parameters[1] as SortDirection
		};
	}
	if (parameters?.length === 3) {
		return {
			sortType: parameters[0],
			sortDirection: parameters[1] as SortDirection,
			filterType: parameters[2]
		};
	}
	return defaultSortOrder;
}
