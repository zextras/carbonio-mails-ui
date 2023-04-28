/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { Folder, useFoldersByView } from '@zextras/carbonio-shell-ui';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { FolderSelector, FolderSelectorProps } from '../folder-selector';
import { FOLDERS } from '../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { generateStore } from '../../../../tests/generators/store';
import { FOLDER_VIEW } from '../../../../carbonio-ui-commons/constants';

describe('Folder selector', () => {
	const store = generateStore();

	test('Render the selector', () => {
		const props: FolderSelectorProps = {
			folderId: FOLDERS.INBOX,
			folderDestination: undefined,
			setFolderDestination: jest.fn()
		};
		setupTest(<FolderSelector {...props} />, { store });

		expect(screen.getByTestId('folder-name-filter')).toBeVisible;
	});

	/**
	 *
	 * @param folders
	 * @param list
	 * @returns
	 */
	const flatten = (folders: Array<Folder>, list: Array<Folder>): Array<Folder> => {
		folders.forEach((child) => {
			list.push(child);
			if (child.children.length) {
				flatten(child.children, list);
			}
			child.children = [];
			child.parent = undefined;
		});

		return list;
	};

	test('Folders accordion items', () => {
		const folders = flatten(useFoldersByView(FOLDER_VIEW.message), []);

		// console.log(folders);

		const props: FolderSelectorProps = {
			folderId: FOLDERS.INBOX,
			folderDestination: undefined,
			setFolderDestination: jest.fn()
		};
		setupTest(<FolderSelector {...props} />, { store });
		folders.forEach((folder) => {
			expect(screen.getByTestId(`folder-accordion-item-${folder.id}`)).toBeVisible();
		});
	});
});
