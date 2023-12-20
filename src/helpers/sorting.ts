/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { editSettings } from '@zextras/carbonio-shell-ui';
import { find } from 'lodash';

import { SORTING_OPTIONS } from '../constants';
import { FolderSortOrder } from '../types';

/**
 * Returns sortType, sortDirection and sortOrder for the given folder
 *
 * @param folderId
 * @param zimbraPrefSortOrder
 *
 * returns an object containing
 * sortType: the sort type for the given folder,
 * sortDirection: the sort direction for the given folder,
 * sortOrder: the concatenation of sortType and sortDirection,
 * remainingFoldersSortOrder: the sort order of the other folders,
 * remainingSortOptions: the sort order of the other options not related to mails
 */
export function parseMessageSortingOptions(
	folderId?: string,
	zimbraPrefSortOrder?: string
): FolderSortOrder {
	const fallbackSortOrder = {
		sortType: 'date',
		sortDirection: 'Desc' as 'Asc' | 'Desc',
		sortOrder: 'dateDesc',
		remainingFoldersSortOrder: '',
		remainingSortOptions: ''
	};
	if (!zimbraPrefSortOrder || !folderId) {
		return fallbackSortOrder;
	}
	const splitString = ',BDLV';
	const sortOrderString = zimbraPrefSortOrder.split(splitString)[0];
	const sortingFolders = sortOrderString.split(',');
	const sortOrderOfFolder = find(sortingFolders, (item) => item.split(':')[0] === folderId);
	const remainingSortOptions = splitString.concat(zimbraPrefSortOrder.split(splitString)[1]) ?? '';
	const remainingFoldersSortOrder =
		sortingFolders.filter((item) => item.split(':')[0] !== folderId).join(',') ?? '';
	if (
		!!sortOrderOfFolder &&
		sortOrderOfFolder.split(':').length === 2 &&
		!sortOrderOfFolder.includes(SORTING_OPTIONS.size.value)
	) {
		const sortOrder = sortOrderOfFolder.split(':')[1];
		const sortDirection = sortOrder.includes('Desc') ? 'Desc' : 'Asc';
		const sortType = sortOrder.split(/Asc|Desc/i)[0];

		return { sortType, sortDirection, sortOrder, remainingFoldersSortOrder, remainingSortOptions };
	}
	return fallbackSortOrder;
}

function modifySettingString(
	inputStringA: string,
	inputStringB: string,
	folderId?: string
): string {
	const replaceStr = new RegExp(`${folderId}:(.*?)(Asc|Desc)`);
	return replaceStr.test(inputStringA)
		? inputStringA.replace(replaceStr, `${inputStringB}`)
		: `${inputStringA},${inputStringB}`;
}

export function updateSortingSettings({
	prefSortOrder,
	sortingTypeValue,
	sortingDirection,
	folderId
}: {
	prefSortOrder?: string;
	sortingTypeValue: string;
	sortingDirection: string;
	folderId?: string;
}): void {
	if (!prefSortOrder) {
		const changes = {
			prefs: {
				zimbraPrefSortOrder: `${folderId}:${sortingTypeValue}${sortingDirection},BDLV`
			}
		};
		editSettings(changes);
		return;
	}
	const secondString = prefSortOrder.substring(prefSortOrder.indexOf(',BDLV'));
	const sortingString = `${folderId}:${sortingTypeValue}${sortingDirection}`;
	const splitString = ',BDLV';
	const sortOrderString = prefSortOrder.split(splitString)[0];
	const replacedString = modifySettingString(sortOrderString, sortingString, folderId);
	const finalString = replacedString + secondString;

	const changes = {
		prefs: {
			zimbraPrefSortOrder: finalString
		}
	};
	editSettings(changes);
}
