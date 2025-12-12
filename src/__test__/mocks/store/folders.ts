/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Folder,
	FolderState,
	FolderView,
	getLinkIdMapKey,
	LinkFolder,
	useFolderStore
} from '@zextras/carbonio-ui-commons';
import { filter, values } from 'lodash';

import { generateFolders } from '@test-utils/folders/folders-generator';

export type PopulateFoldersStoreOptions = {
	view?: FolderView;
	noSharedAccounts?: boolean;
	customFolders?: Array<Folder>;
	additionalFolders?: Record<string, Folder>;
};

/**
 * Initialize the folder's store with roots and folders provided by
 * the mocks generators
 */

export const populateFoldersStore = ({
	view,
	noSharedAccounts,
	customFolders,
	additionalFolders
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
	const initialStoreState: Partial<FolderState> = {
		linksIdMap,
		folders: {
			...folders,
			...(additionalFolders ?? {})
		},
		searches: {}
	};
	useFolderStore.setState((state) => ({ ...state, ...initialStoreState }), true);
};
