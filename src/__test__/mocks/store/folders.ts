/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, values } from 'lodash';

import { useFolderStore } from '../../../store/zustand/folder/store';
import { FolderState, LinkFolder, PopulateFoldersStoreOptions } from '../../../types/folder';
import { getLinkIdMapKey } from '../../../worker/utils';
import { generateFolders } from '../folders/folders-generator';

/**
 * Initialize the folder's store with roots and folders provided by
 * the mocks generators
 */

export const populateFoldersStore = ({
	view,
	noSharedAccounts,
	customFolders
}: PopulateFoldersStoreOptions = {}): void => {
	const folders = generateFolders({
		view,
		noSharedAccounts,
		customFolders
	});
	const links = filter(values(folders), ['isLink', true]) as Array<LinkFolder>;
	const linksIdMap = links.reduce((result, link) => {
		const key = getLinkIdMapKey(link);
		if (!key) {
			return result;
		}
		return { ...result, [key]: link.id };
	}, {});
	const initialStoreState: FolderState = {
		linksIdMap,
		folders,
		searches: {},
		updateFolder: jest.fn()
	};
	useFolderStore.setState(initialStoreState, true);
};
