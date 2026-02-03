/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { updateSettings, useUserSettings } from '@zextras/carbonio-shell-ui';
import { isTrash, JSNS } from '@zextras/carbonio-ui-commons';
import { AccountSettingsPrefs, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';

import type {
	FilterOption,
	FolderSortOrder,
	SortAndFilterState,
	SortDirection,
	SortOption
} from '../types';
import { FILTER_OPTIONS, SORTING_DIRECTION, SORTING_OPTIONS } from '../constants';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

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

const fallbackSortOrder: FolderSortOrder = {
	sortType: 'date',
	sortDirection: 'Desc' as SortDirection
};

const trashFolderSortOrder: FolderSortOrder = {
	sortType: 'changeDate',
	sortDirection: 'Desc' as SortDirection
};

export const getFilterQuery = (filter: string | undefined, folderId: string): string => {
	if (!filter) return `inId:"${folderId}"`;
	switch (filter) {
		case 'read':
			return `inId:"${folderId}" is:unread`;
		case 'priority':
			return `inId:"${folderId}" priority:high`;
		case 'flag':
			return `inId:"${folderId}" is:flagged`;
		case 'attach':
			return `inId:"${folderId}" has:attachment`;
		default:
			return `inId:"${folderId}"`;
	}
};

function findFolderEntry(
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

function modifySettingString(
	zimbraPrefSortOrder: string,
	prefToUpdate: string,
	folderId?: string
): string {
	const { currentFolder } = findFolderEntry(zimbraPrefSortOrder, folderId ?? '');
	if (!currentFolder) {
		const replacedString = zimbraPrefSortOrder.replace(',BDLV', '');
		return replacedString.concat(`,${prefToUpdate},BDLV`);
	}
	return zimbraPrefSortOrder.replace(currentFolder, prefToUpdate);
}

export function updateSortAndFilterSettings({
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
	const zimbraPrefSortOrder = !prefSortOrder
		? `${sortingAndFilteringString},BDLV`
		: modifySettingString(prefSortOrder, sortingAndFilteringString, folderId);

	soapFetchV2<
		{ _attrs: AccountSettingsPrefs; _jsns: JSNS },
		{ ModifyPrefsResponse: Record<string, unknown> }
	>('ModifyPrefs', {
		_jsns: JSNS.ACCOUNT,
		_attrs: { zimbraPrefSortOrder }
	}).then((rawSoapResponse) => {
		if (!('Fault' in rawSoapResponse.Body)) {
			updateSettings({ prefs: { zimbraPrefSortOrder } });
		}
	});
}

/**
 * Translates a sort or filter option value to its localized label
 *
 * This function looks up the corresponding sorting or filtering option by its value
 * and returns the translated label. Spaces in label keys are converted to underscores
 * for translation key lookup (e.g., "last modified" becomes "sorting_dropdown.last_modified").
 *
 * @param value - The value of the sort/filter option (e.g., 'date', 'changeDate', 'read')
 * @param t - The i18next translation function
 * @returns The translated label for the option, or the original value if no match is found
 *
 * @example
 * // For sort option with value 'changeDate'
 * getTranslatedSortFilterLabel('changeDate', t)
 * // Returns: t('sorting_dropdown.last_modified', 'last modified')
 */
export const getTranslatedSortFilterLabel = (
	value: string | null | undefined,
	t: TFunction<'translation', undefined, 'translation'>
): string => {
	if (!value) return '';
	const sortOpt = Object.values(SORTING_OPTIONS).find((opt) => opt.value === value);
	if (sortOpt) {
		const translationKey = sortOpt.label.replace(/ /g, '_');
		return t(`sorting_dropdown.${translationKey}`, sortOpt.label);
	}
	const filterOpt = Object.values(FILTER_OPTIONS).find((opt) => opt.value === value);
	if (filterOpt) {
		const translationKey = filterOpt.label.replace(/ /g, '_');
		return t(`sorting_dropdown.${translationKey}`, filterOpt.label);
	}
	return value;
};
