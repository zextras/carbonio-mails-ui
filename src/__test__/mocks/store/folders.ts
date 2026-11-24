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

/** The owner of `SHARED_FOLDER_LINK`, named by the tooltip of the tags of its messages. */
export const SHARED_FOLDER_OWNER = 'marta.rossi@example.com';

/** The folder of a message in the folder mounted by `SHARED_FOLDER_LINK`: "<zid>:<rid>". */
export const SHARED_FOLDER_ID = 'z3:257';

/** A folder another account shares, mounted on its own: pass it as `additionalFolders`. */
export const SHARED_FOLDER_LINK: Record<string, Folder> = {
	'267': {
		id: '267',
		name: 'Shared projects',
		zid: 'z3',
		rid: '257',
		owner: SHARED_FOLDER_OWNER
	} as unknown as Folder
};
