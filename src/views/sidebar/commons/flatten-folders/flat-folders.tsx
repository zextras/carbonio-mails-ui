/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useMemo } from 'react';

import { Container, Padding, Row, Text } from '@zextras/carbonio-design-system';
import { Folder } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import { FOLDER_SELECTOR_MAX_RESULTS } from 'constants/index';
import { isSpam, isTrash, isTrashed } from 'helpers/folders';
import { FlatRoot } from 'views/sidebar/commons/flatten-folders/flat-root';
import { flattenAndFilterFoldersWithCap } from 'views/sidebar/commons/flatten-folders/utils';
import { getSystemFolderTranslatedName } from 'views/sidebar/utils';

type FlatFoldersProps = {
	folders: Array<Folder>;
	searchString: string;
	selectedFolderId?: string;
	onFolderSelected?: (folder: Folder) => void;
	allowRootSelection?: boolean;
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
	const [hasMoreResults, setHasMoreResults] = React.useState(false);
	const [t] = useTranslation();
	const flatFilteredFolders = useMemo(() => {
		let remaining = FOLDER_SELECTOR_MAX_RESULTS;

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
				if (remaining <= 0) {
					setHasMoreResults(true);
				} else {
					setHasMoreResults(false);
				}

				return { ...currentFolder, children };
			})
			.filter((folder): folder is Folder => folder !== null);
	}, [folders, searchString, showSpamFolder, showTrashFolder]);

	const hasMoreResultsWarningLabel = t(
		'modal.messageFilteringList',
		'Only the first 100 results are displayed. Narrow your search criteria to view the complete list.'
	);

	return (
		<>
			{hasMoreResults && (
				<Padding top="small" bottom="large">
					<Row wrap="nowrap" takeAvailableSpace width="fill">
						<Text data-testid={'has-more-results'} textAlign="left" size="small">
							{hasMoreResultsWarningLabel}
						</Text>
					</Row>
				</Padding>
			)}
			{!hasMoreResults && <Padding vertical="medium" />}
			<Container orientation={'vertical'} style={{ overflowY: 'auto' }}>
				{flatFilteredFolders.map<ReactElement>((folder) => (
					<FlatRoot
						key={folder.id}
						folder={folder}
						childrenFolders={folder.children}
						isOpen
						onFolderSelected={onFolderSelected}
						selectedFolderId={selectedFolderId}
						allowRootSelection={allowRootSelection}
					/>
				))}
			</Container>
		</>
	);
};
