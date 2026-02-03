/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { updateSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS, isTrash, JSNS } from '@zextras/carbonio-ui-commons';
import { AccountSettingsPrefs, soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';

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

const trashFolderSortOrder = {
	sortType: 'changeDate',
	sortDirection: 'Desc' as 'Asc' | 'Desc'
};

export type FolderSortOrder = {
	sortType: string;
	sortDirection: 'Asc' | 'Desc';
	filterType?: string;
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
