/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Folder } from 'types/index.d';
import { getFolderTranslatedName } from 'views/sidebar/utils';

export const getFolderPath = (
	folder: Folder | undefined,
	root: Folder | undefined,
	isSearchModule = false
): string => {
	if (isSearchModule) {
		return '';
	}
	return (
		folder?.absFolderPath
			?.split('/')
			?.map((p, idx) =>
				getFolderTranslatedName({
					folderId: idx === 1 ? root?.id : folder?.id,
					folderName: p
				})
			)
			.join(' / ') ?? ''
	);
};
