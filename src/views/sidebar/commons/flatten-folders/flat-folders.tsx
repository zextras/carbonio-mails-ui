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
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';

const MAX_ALLOWED_RESULTS = 200;

type FlatFoldersProps = {
	folders: Array<Folder>;
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
	onFolderSelected,
	selectedFolderId,
	allowRootSelection,
	showSharedAccounts = false,
	showTrashFolder,
	showSpamFolder
}: FlatFoldersProps): React.JSX.Element => {
	const filteredAccountsRoots = useMemo<Array<Folder>>(
		() => (showSharedAccounts ? folders : folders.filter((root) => root.id === FOLDERS.USER_ROOT)),
		[folders, showSharedAccounts]
	);
	const flatFolders = useMemo(
		() =>
			flattenRootsFolders(filteredAccountsRoots, {
				showTrashFolder,
				showSpamFolder
			}),
		[filteredAccountsRoots, showSpamFolder, showTrashFolder]
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
