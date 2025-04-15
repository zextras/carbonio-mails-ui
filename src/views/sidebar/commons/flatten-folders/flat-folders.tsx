/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { slice } from 'lodash';

import { FlatRoot } from './flat-root';
import { flattenAndFilterFoldersWithCap } from './utils';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';
import { isTrash, isTrashed, isSpam } from '../../../../helpers/folders';
import { getSystemFolderTranslatedName } from '../../utils';

const MAX_ALLOWED_RESULTS = 100;

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

export const FlatFolders = ({
	folders,
	searchString,
	onFolderSelected,
	selectedFolderId,
	allowRootSelection,
	showTrashFolder,
	showSpamFolder
}: FlatFoldersProps): React.JSX.Element => {
	const flatFilteredFolders = useMemo(() => {
		let remaining = MAX_ALLOWED_RESULTS;

		return folders
			.map((folder) => {
				if (remaining <= 0) {
					return { ...folder, children: [] };
				}
				const isFilteredOut =
					(!showTrashFolder && (isTrash(folder.id) || isTrashed({ folder }))) ||
					(!showSpamFolder && isSpam(folder.id));

				if (isFilteredOut) {
					return null;
				}

				const currentFolder = {
					...folder,
					name: getSystemFolderTranslatedName({ folderName: folder.name }),
					children: []
				};
				const children = flattenAndFilterFoldersWithCap(folder.children, searchString, remaining);
				remaining -= children.length;

				return { ...currentFolder, children };
			})
			.filter((folder): folder is Folder => folder !== null);
	}, [folders, searchString, showSpamFolder, showTrashFolder]);

	return (
		<Container orientation={'vertical'} style={{ overflowY: 'auto' }}>
			{flatFilteredFolders.map<ReactElement>((folder) => (
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
