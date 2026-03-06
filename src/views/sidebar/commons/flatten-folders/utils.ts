/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Folder } from '@zextras/carbonio-ui-commons';

export function flattenAndFilterFoldersWithCap(
	folders: Array<Folder>,
	search: string,
	limit: number
): Array<Folder> {
	if (limit <= 0) return [];

	const lowerCaseSearch = search.toLowerCase();

	const flattenAndFilter = (foldersToProcess: Array<Folder>): Array<Folder> =>
		foldersToProcess.flatMap((folder) => {
			const isMatch = folder.name.toLowerCase().includes(lowerCaseSearch);
			const matched = isMatch ? [{ ...folder, children: [] }] : [];
			return [...matched, ...flattenAndFilter(folder.children)];
		});

	return flattenAndFilter(folders).slice(0, limit);
}
