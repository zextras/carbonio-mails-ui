/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { screen } from '@testing-library/react';
import { reject } from 'lodash';
import React from 'react';
import {
	getFolder,
	getFoldersArrayByRoot,
	getRootsMap
} from '../../../../carbonio-ui-commons/store/zustand/folder';
import { FOLDERS } from '../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { populateFoldersStore } from '../../../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { isSpam, isTrash, isTrashed } from '../../../../helpers/folders';
import { generateStore } from '../../../../tests/generators/store';
import { FolderSelector, FolderSelectorProps } from '../folder-selector';

describe('Folder selector', () => {
	const store = generateStore();
	test('The selector is visible', () => {
		populateFoldersStore();
		const props: FolderSelectorProps = {
			folderId: FOLDERS.INBOX,
			folderDestination: undefined,
			setFolderDestination: jest.fn()
		};
		setupTest(<FolderSelector {...props} />, { store });
		expect(screen.getByTestId('folder-name-filter')).toBeVisible();
	});

	/**
	 * Tests that the folder selector is rendering each folder for each root
	 * (except trash and spam which are excluded by the folder selector)
	 */
	describe('Folders accordion items', () => {
		populateFoldersStore();
		const rootIds = Object.keys(getRootsMap());
		test.each(rootIds)(
			'Exists a folder accordion item for each folder of the root %s',
			(rootId) => {
				populateFoldersStore();
				// Get the folders and remove those that are excluded from the folder selector
				const folders = reject(
					getFoldersArrayByRoot(rootId),
					(folder) => isTrash(folder.id) || isSpam(folder.id) || isTrashed({ folder })
				);
				const props: FolderSelectorProps = {
					folderId: FOLDERS.INBOX,
					folderDestination: undefined,
					setFolderDestination: jest.fn()
				};
				setupTest(<FolderSelector {...props} />, { store });
				folders.forEach((folder) => {
					expect(screen.getByTestId(`folder-accordion-item-${folder.id}`)).toBeVisible();
				});
			}
		);
	});

	describe('Filter', () => {
		test('if the user type "inbox" in the filter only the Inbox folder is displayed', async () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				folderId: FOLDERS.INBOX,
				folderDestination: undefined,
				setFolderDestination: jest.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />, { store });
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, 'inbox');
			const accordionItems = screen.queryAllByTestId(/^folder-accordion-item-/);
			expect(accordionItems.length).toBe(1);
			expect(screen.getByTestId(`folder-accordion-item-${FOLDERS.INBOX}`)).toBeVisible();
		});

		test('if the user type "INBOX" in the filter only the Inbox folder is displayed', async () => {
			populateFoldersStore();
			const props: FolderSelectorProps = {
				folderId: FOLDERS.INBOX,
				folderDestination: undefined,
				setFolderDestination: jest.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />, { store });
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, 'INBOX');
			const accordionItems = screen.queryAllByTestId(/^folder-accordion-item-/);
			expect(accordionItems.length).toBe(1);
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
				folderId: FOLDERS.INBOX,
				folderDestination: undefined,
				setFolderDestination: jest.fn()
			};
			const { user } = setupTest(<FolderSelector {...props} />, { store });
			const filterInput = screen.getByTestId('folder-name-filter');
			await user.type(filterInput, inboxFirstChild.name);
			expect(screen.getByTestId(`folder-accordion-item-${inboxFirstChild.id}`)).toBeVisible();
		});
	});
});
