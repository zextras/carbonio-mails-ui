/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, ReactElement, useMemo, useState } from 'react';

import { Button, Container, Input, Padding, ThemeProvider } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import type { Folder } from '@zextras/carbonio-ui-commons';
import { FOLDERS, getFolder } from '@zextras/carbonio-ui-commons';

import { useFolders } from 'hooks/use-folders';
import { themeMuiExtension } from 'theme/theme-mui';
import { FlatFolders } from 'views/sidebar/commons/flatten-folders/flat-folders';
import { FolderAccordionCustomComponent } from 'views/sidebar/commons/folder-accordions-custom-component';
import { FoldersAccordion } from 'views/sidebar/commons/folders-accordion';

export type FolderSelectorProps = {
	inputLabel?: string;
	onNewFolderClick?: () => void;
	selectedFolderId?: string;
	onFolderSelected: (arg: Folder) => void;
	showSharedAccounts: boolean;
	allowRootSelection: boolean;
	showSpamFolder?: boolean;
	showTrashFolder?: boolean;
};

export const FolderSelector = ({
	inputLabel,
	onNewFolderClick,
	selectedFolderId,
	onFolderSelected,
	allowRootSelection,
	showSharedAccounts,
	showSpamFolder,
	showTrashFolder
}: FolderSelectorProps): ReactElement => {
	const [inputValue, setInputValue] = useState('');
	const selectedFolder = selectedFolderId && getFolder(selectedFolderId);
	const folders = useFolders();
	const rootFolders = useMemo<Array<Folder>>(
		() => (showSharedAccounts ? folders : folders.filter((root) => root.id === FOLDERS.USER_ROOT)),
		[folders, showSharedAccounts]
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
			<Container
				style={{ overflowY: 'auto', display: 'block' }}
				height="fit"
				width="fill"
				orientation="vertical"
				mainAlignment="flex-start"
				minHeight="30vh"
				maxHeight="60vh"
			>
				{inputValue.length > 0 ? (
					<FlatFolders
						folders={rootFolders}
						searchString={inputValue}
						onFolderSelected={onFolderSelected}
						selectedFolderId={selectedFolderId}
						allowRootSelection={allowRootSelection}
						showSpamFolder={showSpamFolder}
						showTrashFolder={showTrashFolder}
					/>
				) : (
					/*
					 * The ThemeProvider here is necessary because the modals components
					 * belong to a hierarchy branch that is not wrapped by the
					 * ThemeProvider (the one with the extension) in the AppView
					 */
					<ThemeProvider extension={themeMuiExtension}>
						<Padding vertical="medium" />
						<FoldersAccordion
							folders={rootFolders}
							onFolderSelected={onFolderSelected}
							selectedFolderId={selectedFolderId}
							allowRootSelection={allowRootSelection}
							FolderAccordionCustomComponent={FolderAccordionCustomComponent}
							showSpamFolder={showSpamFolder}
							showTrashFolder={showTrashFolder}
						/>
					</ThemeProvider>
				)}
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
