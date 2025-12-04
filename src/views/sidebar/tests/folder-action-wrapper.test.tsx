/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { Folder, FOLDERS, getFolder } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { FolderActionWrapper } from 'views/sidebar/folder-action-wrapper';
import { useFolderActions } from 'views/sidebar/use-folder-actions';

vi.mock('../use-folder-actions', () => ({
	useFolderActions: vi.fn()
}));
describe('FolderActionWrapper', () => {
	it('renders correctly with given folder and children', () => {
		populateFoldersStore();
		const folder = getFolder(FOLDERS.INBOX) as Folder;
		setupTest(
			<FolderActionWrapper folder={folder}>
				<div data-testid="child-element">Child Content</div>
			</FolderActionWrapper>
		);

		expect(screen.getByTestId(`folder-context-menu-2`)).toBeInTheDocument();
		expect(screen.getByTestId('child-element')).toHaveTextContent('Child Content');
	});

	it('calls useFolderActions with the correct folder', () => {
		populateFoldersStore();
		const folder = getFolder(FOLDERS.INBOX) as Folder;
		setupTest(<FolderActionWrapper folder={folder} />);
		expect(useFolderActions).toHaveBeenCalledWith(folder);
	});
});
