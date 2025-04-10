/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, ReactElement, useMemo, useState } from 'react';

import { ThemeProvider } from '@mui/material';
import { Button, Container, Input, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { FolderAccordionCustomComponent } from './folder-accordions-custom-component';
import { FoldersAccordion } from './folders-accordion';
import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { getFolder, useRootsArray } from '../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { themeMui } from '../../../carbonio-ui-commons/theme/theme-mui';
import type { Folder } from '../../../carbonio-ui-commons/types/folder';

export type FolderSelectorProps = {
	inputLabel?: string;
	onNewFolderClick?: () => void;
	selectedFolderId?: string;
	onFolderSelected: (arg: Folder) => void;
	showSharedAccounts: boolean;
	allowRootSelection: boolean;
};

function filterFoldersByName(folders: Folder[], search: string): Folder[] {
	return folders
		.map((folder) => {
			const matched = folder.name.toLowerCase().includes(search.toLowerCase());

			const children = filterFoldersByName(folder.children || [], search);

			if (matched || children.length > 0) {
				return {
					...folder,
					children
				};
			}

			return null;
		})
		.filter(Boolean) as Folder[];
}

export const FolderSelector = ({
	inputLabel,
	onNewFolderClick,
	selectedFolderId,
	onFolderSelected,
	allowRootSelection,
	showSharedAccounts
}: FolderSelectorProps): ReactElement => {
	const [inputValue, setInputValue] = useState('');
	const selectedFolder = selectedFolderId && getFolder(selectedFolderId);
	const roots = useRootsArray();
	const rootFolders = useMemo<Array<Folder>>(
		() => (showSharedAccounts ? roots : roots.filter((root) => root.id === FOLDERS.USER_ROOT)),
		[roots, showSharedAccounts]
	);

	const filteredRoots = useMemo(
		() => filterFoldersByName(rootFolders, inputValue),
		[inputValue, rootFolders]
	);

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
			<Container
				style={{ overflowY: 'auto', display: 'block' }}
				height="fit"
				width="fill"
				orientation="vertical"
				mainAlignment="flex-start"
				minHeight="30vh"
				maxHeight="60vh"
			>
				<ThemeProvider theme={themeMui}>
					<FoldersAccordion
						folders={filteredRoots}
						onFolderSelected={onFolderSelected}
						selectedFolderId={selectedFolderId}
						allowRootSelection={allowRootSelection}
						FolderAccordionCustomComponent={FolderAccordionCustomComponent}
					/>
				</ThemeProvider>
			</Container>
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
