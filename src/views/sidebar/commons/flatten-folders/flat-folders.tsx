/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { slice } from 'lodash';

import { FlatRoot } from './flat-root';
import { flattenFolders } from './utils';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';
import { filterFoldersByName } from '../utils';

const MAX_ALLOWED_RESULTS = 200;

type FlatFoldersProps = {
	folders: Array<Folder>;
	searchString: string;
	selectedFolderId?: string;
	onFolderSelected?: (folder: Folder) => void;
	allowRootSelection?: boolean;
	showSharedAccounts?: boolean;
	showTrashFolder?: boolean;
	showSpamFolder?: boolean;
};

const flattenRootsFolders = (
	roots: Array<Folder>,
	options?: {
		showTrashFolder?: boolean;
		showSpamFolder?: boolean;
	}
): Array<Folder> =>
	roots.map((root) => ({
		...root,
		children: flattenFolders(root.children, options)
	}));

export const FlatFolders = ({
	folders,
	searchString,
	onFolderSelected,
	selectedFolderId,
	allowRootSelection,
	showTrashFolder,
	showSpamFolder
}: FlatFoldersProps): React.JSX.Element => {
	const filteredFolders = useMemo(
		() => filterFoldersByName(folders, searchString),
		[folders, searchString]
	);

	const flatFolders = useMemo(
		() =>
			flattenRootsFolders(filteredFolders, {
				showTrashFolder,
				showSpamFolder
			}),
		[filteredFolders, showSpamFolder, showTrashFolder]
	);

	return (
		<Container orientation={'vertical'} style={{ overflowY: 'auto' }}>
			{flatFolders.map<ReactElement>((folder) => (
				<FlatRoot
					key={folder.id}
					folder={folder}
					childrenFolders={slice(folder.children, 0, MAX_ALLOWED_RESULTS)}
					isOpen
					onFolderSelected={onFolderSelected}
					selectedFolderId={selectedFolderId}
					allowRootSelection={allowRootSelection}
				/>
			))}
		</Container>
	);
};
