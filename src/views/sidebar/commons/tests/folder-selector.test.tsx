/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import {
	Folder,
	FOLDER_VIEW,
	FOLDERS,
	getFolder,
	getFoldersArrayByRoot,
	getFoldersMap,
	getRootsMap,
	useFolderStore
} from '@zextras/carbonio-ui-commons';

import { makeListItemsVisible, setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { populateFoldersStore } from '@test-utils/store/folders';
import {
	getFolderOwnerAccountName,
	getFoldersArray,
	isInbox,
	isSpam,
	isTrash,
	isTrashed
} from 'helpers/folders';
import { FolderSelector, FolderSelectorProps } from 'views/sidebar/commons/folder-selector';

describe('Folder selector', () => {
	test('The selector is visible', () => {
		populateFoldersStore();
		const props: FolderSelectorProps = {
			allowRootSelection: false,
			showSharedAccounts: false,
			selectedFolderId: FOLDERS.INBOX,
			onFolderSelected: vi.fn()
		};
		setupTest(<FolderSelector {...props} />);

		expect(screen.getByTestId('folder-name-filter')).toBeVisible();
	});
	/**
	 * Tests that the folder selector is rendering each folder for each root
	 */
	describe('Folders accordion items', () => {
		it('should show a folder accordion item for each folder in the main account', () => {
			const folder1 = generateFolder({ id: '100', name: 'folder1' });
			const folder2 = generateFolder({ id: '200', name: 'folder2' });
			const folder3 = generateFolder({ id: '300', name: 'folder3' });
			const mockRoot: Folder = generateFolder({
				id: FOLDERS.USER_ROOT,
				children: [
					generateFolder({
						id: '2',
						name: 'inbox',
						children: [folder1, folder2, folder3]
					}),
					generateFolder({
						id: '5',
						name: 'sent',
						children: [folder1]
					})
				]
			});
			useFolderStore.setState({ folders: { [mockRoot.id]: mockRoot } });
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: true,
				showSpamFolder: true,
				showTrashFolder: true,
				selectedFolderId: FOLDERS.INBOX,
				onFolderSelected: vi.fn()
			};
			setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();

			expect(screen.getByTestId('folder-accordion-item-2')).toBeVisible();
			expect(screen.getByTestId('folder-accordion-item-5')).toBeVisible();
		});

		it('should warn when results are limited to the max available number', async () => {
			const children = Array.from({ length: 110 }, (_, i) =>
				generateFolder({ id: `${i}`, name: `folder${i}` })
			);
			const mockRoot: Folder = generateFolder({
				id: FOLDERS.USER_ROOT,
				children: [
					generateFolder({
						id: '2',
						name: 'inbox',
						children
					})
				]
			});
			useFolderStore.setState({ folders: { [mockRoot.id]: mockRoot } });
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: true,
				showSpamFolder: true,
				showTrashFolder: true,
				selectedFolderId: FOLDERS.INBOX,
				onFolderSelected: vi.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();
			const input = screen.getByTestId('folder-name-filter');
			user.type(input, 'folder');
			makeListItemsVisible();

			await waitFor(() => {
				expect(screen.getByTestId('has-more-results')).toBeVisible();
			});
		});

		it('should not warn when all results are shown', async () => {
			const children = Array.from({ length: 90 }, (_, i) =>
				generateFolder({ id: `${i}`, name: `folder${i}` })
			);
			const mockRoot: Folder = generateFolder({
				id: FOLDERS.USER_ROOT,
				children: [
					generateFolder({
						id: '2',
						name: 'inbox',
						children
					})
				]
			});
			useFolderStore.setState({ folders: { [mockRoot.id]: mockRoot } });
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: true,
				showSpamFolder: true,
				showTrashFolder: true,
				selectedFolderId: FOLDERS.INBOX,
				onFolderSelected: vi.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();
			const input = screen.getByTestId('folder-name-filter');
			user.type(input, 'folder');
			makeListItemsVisible();

			expect(screen.queryByTestId('has-more-results')).not.toBeInTheDocument();
		});
	});

	describe('Roots accordion items', () => {
		populateFoldersStore();
		const rootIds = Object.keys(getRootsMap());
		test.each(rootIds)('There is a folder accordion item for the root %s', (rootId) => {
			populateFoldersStore();
			const roots = getRootsMap();
			const ownerAccountName = getFolderOwnerAccountName(rootId, roots);

			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: true,
				onFolderSelected: vi.fn()
			};
			setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();
			expect(screen.queryByText(ownerAccountName)).toBeVisible();
		});
	});

	describe('Filter', () => {
		test('if the user type "inbox" in the filter only the Inbox folder is displayed', async () => {
			populateFoldersStore({ view: FOLDER_VIEW.message });

			const inboxCount = getFoldersArray(getFoldersMap()).reduce<number>(
				(result, folder) => (isInbox(folder.id) ? result + 1 : result),
				0
			);
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: true,
				selectedFolderId: FOLDERS.INBOX,
				onFolderSelected: vi.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />);
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, 'inbox');
			makeListItemsVisible();

			const accordionItems = await screen.findAllByText(/folders\.inbox/i);
			expect(accordionItems.length).toBe(inboxCount);
			expect(accordionItems[0]).toBeVisible();
		});

		test('if the user type "INBOX" in the filter only the Inbox folder is displayed', async () => {
			populateFoldersStore();
			const inboxCount = getFoldersArray(getFoldersMap()).reduce<number>(
				(result, folder) => (isInbox(folder.id) ? result + 1 : result),
				0
			);
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: true,
				selectedFolderId: FOLDERS.INBOX,
				onFolderSelected: vi.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, 'INBOX');
			makeListItemsVisible();

			const accordionItems = await screen.findAllByText(/folders\.inbox/i);
			expect(accordionItems.length).toBe(inboxCount);
			expect(accordionItems[0]).toBeVisible();
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
				allowRootSelection: false,
				showSharedAccounts: false,
				selectedFolderId: FOLDERS.INBOX,
				onFolderSelected: vi.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, inboxFirstChild.name);
			makeListItemsVisible();
			expect(screen.getByText(inboxFirstChild.name)).toBeVisible();
		});

		test("accounts are not displayed if they don't have results", async () => {
			populateFoldersStore();
			const rootIds = Object.keys(getRootsMap());
			const folders = getFoldersArrayByRoot(rootIds[0]);
			const folderInPrimaryAccountOnly = folders.find(
				(folder) => folder.name === 'Confluence'
			) as Folder;
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: false,
				onFolderSelected: vi.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, folderInPrimaryAccountOnly.name);
			makeListItemsVisible();
			const roots = getRootsMap();
			const ownerAccountName = getFolderOwnerAccountName(folderInPrimaryAccountOnly.id, roots);

			rootIds.forEach((rootId) => {
				if (rootId === rootIds[0]) {
					const accordionItems = screen.queryAllByText(ownerAccountName);

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
				allowRootSelection: false,
				showSharedAccounts: false,

				onFolderSelected: vi.fn()
			};
			setupTest(<FolderSelector {...props} />);
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
				allowRootSelection: false,
				showSharedAccounts: false,

				onFolderSelected: vi.fn()
			};
			setupTest(<FolderSelector {...props} />);
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
				allowRootSelection: false,
				showSharedAccounts: false,
				showTrashFolder: true,
				onFolderSelected: vi.fn()
			};
			setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const trashFolder = folders.filter((folder) => isTrash(folder.id))?.[0];
			if (!trashFolder) {
				return;
			}
			expect(screen.queryByText(/folders\.trash/)).toBeVisible();
		});

		test('no trashed folder is visible if the showTrashFolder is set to false', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: false,
				onFolderSelected: vi.fn()
			};
			setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const trashedFolder = folders.filter(
				(folder) => isTrashed({ folder }) && !isTrash(folder.id)
			)?.[0];
			if (!trashedFolder) {
				return;
			}
			expect(screen.queryByText(/folders\.trash/)).not.toBeInTheDocument();
		});

		test('Trashed folder is visible if the showTrashFolder is set to true', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: false,
				showTrashFolder: true,
				onFolderSelected: vi.fn()
			};
			setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const trashedFolder = folders.filter(
				(folder) => isTrashed({ folder }) && !isTrash(folder.id)
			)?.[0];
			if (!trashedFolder) {
				return;
			}
			expect(screen.queryByText(/folders\.trash/)).toBeVisible();
		});

		test('no Spam folder is visible if the showSpamFolder is set to false', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: false,
				onFolderSelected: vi.fn()
			};
			setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const spamFolder = folders.filter((folder) => isSpam(folder.id))?.[0];
			if (!spamFolder) {
				return;
			}
			expect(screen.queryByText(/folders\.junk/i)).not.toBeInTheDocument();
		});

		test('Spam folder is visible if the showSpamFolder is set to true', () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				allowRootSelection: false,
				showSharedAccounts: false,
				showSpamFolder: true,
				onFolderSelected: vi.fn()
			};
			setupTest(<FolderSelector {...props} />);
			makeListItemsVisible();

			const folders = getFoldersArrayByRoot(FOLDERS.USER_ROOT);
			const spamFolder = folders.filter((folder) => isSpam(folder.id))?.[0];
			if (!spamFolder) {
				return;
			}
			expect(screen.queryByText(/folders\.junk/i)).toBeVisible();
		});
	});
});
