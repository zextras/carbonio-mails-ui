/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, ReactElement, useMemo, useState } from 'react';

import { Button, Container, Input, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, startsWith } from 'lodash';
import styled from 'styled-components';

import { FlatFoldersAccordion } from './flat-folders-accordion/flat-folders-accordion';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { getFolder, useRootsArray } from '../../../carbonio-ui-commons/store/zustand/folder/hooks';
import type { Folder } from '../../../carbonio-ui-commons/types/folder';
import { isRoot, isSpam, isTrash, isTrashed } from '../../../helpers/folders';
import { getSortCriteria, sortFolders } from '../../../hooks/use-folders';
import { getSystemFolderTranslatedName } from '../utils';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

export type FolderSelectorProps = {
	inputLabel?: string;
	onNewFolderClick?: () => void;
	selectedFolderId?: string;
	onFolderSelected: (arg: Folder) => void;
	showSharedAccounts: boolean;
	showTrashFolder: boolean;
	showSpamFolder: boolean;
	allowRootSelection: boolean;
	allowFolderCreation: boolean;
};

const flattenFolders = (
	folders: Array<Folder>,
	options?: {
		showTrashFolder?: boolean;
		showSpamFolder?: boolean;
	}
): Array<Folder> => {
	const result: Array<Folder> = [];
	const sortedFolders = sortFolders({ children: folders, sortFunction: getSortCriteria });

	sortedFolders.forEach((folder) => {
		if (!options?.showTrashFolder && (isTrash(folder.id) || isTrashed({ folder }))) {
			return;
		}

		if (!options?.showSpamFolder && isSpam(folder.id)) {
			return;
		}

		result.push({
			...folder,
			name: getSystemFolderTranslatedName({ folderName: folder.name }),
			children: []
		});
		folder.children && result.push(...flattenFolders(folder.children, options));
	});

	return result;
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

function filterRootChildren(folders: Array<Folder>, nameCriteria: string): Array<Folder> {
	return filter(folders, (folder) => {
		const folderName = folder.name?.toLowerCase();
		return startsWith(folderName, nameCriteria.toLowerCase());
	});
}

function filterRoots(roots: Array<Folder>, nameCriteria: string): Array<Folder> {
	return roots.reduce((acc, root) => {
		if (isRoot(root.id)) {
			acc.push({
				...root,
				children: root.children ? filterRootChildren(root.children, nameCriteria) : []
			});
		}
		return acc.filter((accItem) => !!accItem.children?.length);
	}, [] as Array<Folder>);
}

export const FolderSelector = ({
	inputLabel,
	onNewFolderClick,
	selectedFolderId,
	onFolderSelected,
	allowRootSelection,
	allowFolderCreation,
	showTrashFolder,
	showSpamFolder,
	showSharedAccounts
}: FolderSelectorProps): ReactElement => {
	const [inputValue, setInputValue] = useState('');
	const selectedFolder = selectedFolderId && getFolder(selectedFolderId);
	const roots = useRootsArray();
	const filteredAccountsRoots = useMemo<Array<Folder>>(
		() => (showSharedAccounts ? roots : roots.filter((root) => root.id === FOLDERS.USER_ROOT)),
		[roots, showSharedAccounts]
	);
	const flattenRoots = useMemo(
		() =>
			flattenRootsFolders(filteredAccountsRoots, {
				showTrashFolder,
				showSpamFolder
			}),
		[filteredAccountsRoots, showSpamFolder, showTrashFolder]
	);
	const filteredRoots = filterRoots(flattenRoots, inputValue);
	const inputName = selectedFolder ? selectedFolder.name : '';
	return (
		<>
			<Input
				data-testid={'folder-name-filter'}
				inputName={inputName}
				label={inputLabel ?? t('label.filter_folders', 'Filter folders')}
				backgroundColor="gray5"
				value={inputValue}
				onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
			/>
			<Padding vertical="medium" />
			<ContainerEl
				orientation="vertical"
				mainAlignment="flex-start"
				minHeight="30vh"
				maxHeight="60vh"
			>
				<FlatFoldersAccordion
					roots={filteredRoots}
					onFolderSelected={onFolderSelected}
					selectedFolderId={selectedFolderId}
					allowRootSelection={allowRootSelection}
				/>
			</ContainerEl>
			{onNewFolderClick && (
				<Container
					padding={{ top: 'medium', bottom: 'medium' }}
					mainAlignment="center"
					crossAlignment="flex-start"
				>
					<Button
						type="ghost"
						label={t('label.new_folder', 'New Folder')}
						color="primary"
						onClick={onNewFolderClick}
					/>
				</Container>
			)}
		</>
	);
};
