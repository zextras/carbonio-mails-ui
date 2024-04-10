/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type FolderSortOrder = {
	sortType: string;
	sortDirection: 'Asc' | 'Desc';
	sortOrder: string;
	remainingFoldersSortOrder: string;
	remainingSortOptions: string;
};
