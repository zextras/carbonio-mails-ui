/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { FOLDER_VIEW } from '../../../../carbonio-ui-commons/constants';
import {
	getFolder,
	getFoldersArray,
	getFoldersArrayByRoot,
	getRootsMap
} from '../../../../carbonio-ui-commons/store/zustand/folder';
import { FOLDERS } from '../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { populateFoldersStore } from '../../../../carbonio-ui-commons/test/mocks/store/folders';
import { makeListItemsVisible, setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { Folder } from '../../../../carbonio-ui-commons/types/folder';
import {
	getFolderOwnerAccountName,
	isInbox,
	isSpam,
	isTrash,
	isTrashed
} from '../../../../helpers/folders';
import { generateStore } from '../../../../tests/generators/store';
import { getSystemFolderTranslatedName } from '../../utils';
import { FolderSelector, FolderSelectorProps } from '../folder-selector';

describe('Folder selector', () => {
	const store = generateStore();
	test('The selector is visible', () => {
		populateFoldersStore();
		const props: FolderSelectorProps = {
			allowFolderCreation: false,
			allowRootSelection: false,
			showSharedAccounts: false,
			showSpamFolder: false,
			showTrashFolder: false,
			selectedFolderId: FOLDERS.INBOX,
			onFolderSelected: jest.fn()
		};
		setupTest(<FolderSelector {...props} />, { store });

		expect(screen.getByTestId('folder-name-filter')).toBeVisible();
	});

	/**
	 * Tests that the folder selector is rendering each folder for each root
	 */
	describe('Folders accordion items', () => {
		populateFoldersStore();
		const rootIds = Object.keys(getRootsMap());
		test.each(rootIds)(
			'Exists a folder accordion item for each folder of the root %s',
			(rootId) => {
				populateFoldersStore();
				const folders = getFoldersArrayByRoot(rootId);
				const props: FolderSelectorProps = {
					allowFolderCreation: false,
					allowRootSelection: false,
					showSharedAccounts: true,
					showSpamFolder: true,
					showTrashFolder: true,
					selectedFolderId: FOLDERS.INBOX,
					onFolderSelected: jest.fn()
				};
				setupTest(<FolderSelector {...props} />, { store });
				makeListItemsVisible();
				folders.forEach((folder) => {
					expect(screen.getByTestId(`folder-accordion-item-${folder.id}`)).toBeVisible();
				});
			}
		);
	});

	describe('Roots accordion items', () => {
		populateFoldersStore();
		const rootIds = Object.keys(getRootsMap());
		test.each(rootIds)('There is a folder accordion item for the root %s', (rootId) => {
			populateFoldersStore();
			const roots = getRootsMap();
			const ownerAccountName = getFolderOwnerAccountName(rootId, roots);

			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: true,
				showSpamFolder: false,
				showTrashFolder: false,
				onFolderSelected: jest.fn()
			};
			setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();
			expect(screen.queryByText(ownerAccountName)).toBeVisible();
		});
	});

	describe('Filter', () => {
		test('if the user type "inbox" in the filter only the Inbox folder is displayed', async () => {
			populateFoldersStore(FOLDER_VIEW.message);
			const inboxCount = getFoldersArray().reduce<number>(
				(result, folder) => (isInbox(folder.id) ? result + 1 : result),
				0
			);
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: true,
				showSpamFolder: false,
				showTrashFolder: false,
				selectedFolderId: FOLDERS.INBOX,
				onFolderSelected: jest.fn()
			};
			const inboxFolderName = getSystemFolderTranslatedName({
				folderName: 'Inbox'
			});
			const { user } = setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, inboxFolderName);

			const accordionItems = await screen.findAllByTestId(/^folder-accordion-item-/);
			expect(accordionItems.length).toBe(inboxCount);
			expect(screen.getByTestId(`folder-accordion-item-${FOLDERS.INBOX}`)).toBeVisible();
		});

		test('if the user type "INBOX" in the filter only the Inbox folder is displayed', async () => {
			populateFoldersStore();
			const inboxFolderName = getSystemFolderTranslatedName({
				folderName: 'Inbox'
			});
			const inboxCount = getFoldersArray().reduce<number>(
				(result, folder) => (isInbox(folder.id) ? result + 1 : result),
				0
			);
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: true,
				showSpamFolder: false,
				showTrashFolder: false,
				selectedFolderId: FOLDERS.INBOX,
				onFolderSelected: jest.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, inboxFolderName);
			const accordionItems = screen.queryAllByTestId(/^folder-accordion-item-/);
			expect(accordionItems.length).toBe(inboxCount);
			expect(screen.getByTestId(`folder-accordion-item-${FOLDERS.INBOX}`)).toBeVisible();
		});

		test('if the user type an Inbox subfolder name in the filter that subfolder is displayed', async () => {
			populateFoldersStore();
			const inboxFolder = getFolder(FOLDERS.INBOX);
			if (!inboxFolder) {
				return;
			}
			const { children: inboxChildren } = inboxFolder;
			if (!inboxChildren.length) {
				return;
			}
			const inboxFirstChild = inboxChildren[0];
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: false,
				showTrashFolder: false,
				selectedFolderId: FOLDERS.INBOX,
				onFolderSelected: jest.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, inboxFirstChild.name);
			expect(screen.getByTestId(`folder-accordion-item-${inboxFirstChild.id}`)).toBeVisible();
		});

		test('if the user type an Inbox folder name only the account with results is displayed', async () => {
			populateFoldersStore();
			const rootIds = Object.keys(getRootsMap());
			const folders = getFoldersArrayByRoot(rootIds[0]);
			const folderInPrimaryAccountOnly = folders.find(
				(folder) => folder.name === 'Confluence'
			) as Folder;
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: false,
				showTrashFolder: false,
				onFolderSelected: jest.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, folderInPrimaryAccountOnly.name);
			const roots = getRootsMap();
			const ownerAccountName = getFolderOwnerAccountName(folderInPrimaryAccountOnly.id, roots);

			rootIds.forEach((rootId) => {
				if (rootId === rootIds[0]) {
					const accordionItems = screen.queryAllByTestId(/^folder-accordion-item-/);

					expect(screen.queryByText(ownerAccountName)).toBeVisible();
					expect(accordionItems.length).toBe(1);
				}
				if (rootId !== rootIds[0]) {
					const nullResultsAccountName = getFolder(rootId)?.name as string;
					expect(screen.queryByText(nullResultsAccountName)).not.toBeInTheDocument();
				}
			});
		});
	});

	describe('configuration options', () => {
		test('no shared account is visible if the showSharedAccount is set to false', () => {
			populateFoldersStore();
			const roots = getRootsMap();
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: false,
				showTrashFolder: false,
				onFolderSelected: jest.fn()
			};
			setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();

			// Cycle through all the roots, except for the primary account root
			Object.keys(roots)
				.filter((rootId) => rootId !== FOLDERS.USER_ROOT)
				.forEach((rootId) => {
					const ownerAccountName = getFolderOwnerAccountName(rootId, roots);
					expect(screen.queryByText(ownerAccountName)).not.toBeInTheDocument();
				});
		});

		test('no Trash folder is visible if the showTrashFolder is set to false', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: false,
				showTrashFolder: false,
				onFolderSelected: jest.fn()
			};
			setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const trashFolder = folders.filter((folder) => isTrash(folder.id))?.[0];
			if (!trashFolder) {
				return;
			}
			expect(
				screen.queryByTestId(`folder-accordion-item-${trashFolder.id}`)
			).not.toBeInTheDocument();
		});

		test('Trash folder is visible if the showTrashFolder is set to true', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: false,
				showTrashFolder: true,
				onFolderSelected: jest.fn()
			};
			setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const trashFolder = folders.filter((folder) => isTrash(folder.id))?.[0];
			if (!trashFolder) {
				return;
			}
			expect(screen.queryByTestId(`folder-accordion-item-${trashFolder.id}`)).toBeVisible();
		});

		test('no trashed folder is visible if the showTrashFolder is set to false', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: false,
				showTrashFolder: false,
				onFolderSelected: jest.fn()
			};
			setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const trashedFolder = folders.filter(
				(folder) => isTrashed({ folder }) && !isTrash(folder.id)
			)?.[0];
			if (!trashedFolder) {
				return;
			}
			expect(
				screen.queryByTestId(`folder-accordion-item-${trashedFolder.id}`)
			).not.toBeInTheDocument();
		});

		test('Trashed folder is visible if the showTrashFolder is set to true', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: false,
				showTrashFolder: true,
				onFolderSelected: jest.fn()
			};
			setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const trashedFolder = folders.filter(
				(folder) => isTrashed({ folder }) && !isTrash(folder.id)
			)?.[0];
			if (!trashedFolder) {
				return;
			}
			expect(screen.queryByTestId(`folder-accordion-item-${trashedFolder.id}`)).toBeVisible();
		});

		test('no Spam folder is visible if the showSpamFolder is set to false', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: false,
				showTrashFolder: false,
				onFolderSelected: jest.fn()
			};
			setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const spamFolder = folders.filter((folder) => isSpam(folder.id))?.[0];
			if (!spamFolder) {
				return;
			}
			expect(
				screen.queryByTestId(`folder-accordion-item-${spamFolder.id}`)
			).not.toBeInTheDocument();
		});

		test('Spam folder is visible if the showSpamFolder is set to true', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowFolderCreation: false,
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: true,
				showTrashFolder: false,
				onFolderSelected: jest.fn()
			};
			setupTest(<FolderSelector {...props} />, { store });
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const spamFolder = folders.filter((folder) => isSpam(folder.id))?.[0];
			if (!spamFolder) {
				return;
			}
			expect(screen.queryByTestId(`folder-accordion-item-${spamFolder.id}`)).toBeVisible();
		});
	});
});
