/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { editSettings } from '@zextras/carbonio-shell-ui';

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

const fallbackSortOrder = {
	sortType: 'date',
	sortDirection: 'Desc' as 'Asc' | 'Desc'
};

export type FolderSortOrder = {
	sortType: string;
	sortDirection: 'Asc' | 'Desc';
	filterType?: string;
};

export function parseMessageSortingOptions(
	folderId: string,
	prefSortOrder?: string
): FolderSortOrder {
	if (!prefSortOrder || !folderId) {
		return fallbackSortOrder;
	}

	const folders = prefSortOrder.split(',');
	const currentFolder = folders.find((folder) => folder.startsWith(`${folderId}:`));
	const parameters = currentFolder?.replace(`,BDLV`, '').replace(`${folderId}:`, '').split('-');

	if (parameters?.length === 2) {
		return {
			sortType: parameters[0],
			sortDirection: parameters[1] as 'Asc' | 'Desc'
		};
	}
	if (parameters?.length === 3) {
		return {
			sortType: parameters[0],
			sortDirection: parameters[1] as 'Asc' | 'Desc',
			filterType: parameters[2]
		};
	}
	return fallbackSortOrder;
}

function modifySettingString(
	zimbraPrefSortOrder: string,
	prefToUpdate: string,
	folderId?: string
): string | undefined {
	const folders = zimbraPrefSortOrder.split(',');
	const folderToUpdate = folders.find((folder) => folder.startsWith(`${folderId}:`));
	if (!folderToUpdate) {
		zimbraPrefSortOrder.replace(',BDLV', '');
		zimbraPrefSortOrder.concat(`,${prefToUpdate},BDLV`);
		return zimbraPrefSortOrder;
	}
	return folderToUpdate && zimbraPrefSortOrder.replace(folderToUpdate, prefToUpdate);
}

export function undateSortAndFilteringSettings({
	folderId,
	prefSortOrder,
	sortType,
	sortDirection,
	filter
}: {
	folderId: string;
	prefSortOrder?: string;
	sortType: string;
	sortDirection: string;
	filter?: string;
}): void {
	const sortingAndFilteringString = `${folderId}:${sortType}-${sortDirection}`.concat(
		filter ? `-${filter}` : ''
	);
	if (!prefSortOrder) {
		editSettings({
			prefs: {
				zimbraPrefSortOrder: `${sortingAndFilteringString},BDLV`
			}
		});
		return;
	}
	editSettings({
		prefs: {
			zimbraPrefSortOrder: modifySettingString(prefSortOrder, sortingAndFilteringString, folderId)
		}
	});
}
