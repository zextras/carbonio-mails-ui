/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { updateSettings } from '@zextras/carbonio-shell-ui';
import { isTrash, JSNS } from '@zextras/carbonio-ui-commons';
import { AccountSettingsPrefs, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';
import { TFunction } from 'i18next';

import { FILTER_OPTIONS, SORTING_OPTIONS } from '../constants';
import { findFolderEntry } from './parseMessageSortingOptions';

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

export function modifySettingString(
	zimbraPrefSortOrder: string,
	prefToUpdate: string,
	folderId: string
): string {
	const defaultSortSuffix = isTrash(folderId) ? 'changeDate-Desc' : 'date-Desc';

	if (prefToUpdate.endsWith(defaultSortSuffix)) {
		const removedFolder = zimbraPrefSortOrder.replaceAll(
			new RegExp(`(?:^|,)${folderId}:[^,]*`, 'g'),
			''
		);

		const cleaned = removedFolder.replaceAll(/^,|,,|,$/g, '');

		return cleaned === 'BDLV' ? '' : cleaned;
	}

	const { currentFolder } = findFolderEntry(zimbraPrefSortOrder, folderId);

	if (!currentFolder) {
		return `${prefToUpdate},${zimbraPrefSortOrder}`;
	}

	return zimbraPrefSortOrder.replaceAll(
		new RegExp(`(^|,)${currentFolder}(?=,|$)`, 'g'),
		`$1${prefToUpdate}`
	);
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
		const translationKey = sortOpt.label.replaceAll(' ', '_');
		return t(`sorting_dropdown.${translationKey}`, sortOpt.label);
	}
	const filterOpt = Object.values(FILTER_OPTIONS).find((opt) => opt.value === value);
	if (filterOpt) {
		const translationKey = filterOpt.label.replaceAll(' ', '_');
		return t(`sorting_dropdown.${translationKey}`, filterOpt.label);
	}
	return value;
};
