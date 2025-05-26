/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from react;
import { act, screen } from '@testing-library/react';

import {
	FOLDER_VIEW,
	FOLDERS,
	generateFolder,
	makeListItemsVisible,
	populateFoldersStore,
	setupTest
} from '@zextras/carbonio-ui-commons';
import { MovetoFolder } from '../../filter-actions/move-to-folder';

describe('Move to Folder', () => {
	it('should render initial folder destination in input', async () => {
		setupTest(
			<MovetoFolder
				destination={{ name: 'test path' }}
				onSelectFolder={jest.fn()}
				onConfirmDestination={jest.fn()}
			/>
		);
		const input = screen.getByRole('textbox', { name: 'Destination Folder' });
		expect(input).toHaveValue('test path');
	});

	it('should return selected destination on confirm', async () => {
		const folder = generateFolder({
			id: '100',
			name: 'Test folder'
		});
		const rootFolder = generateFolder({ id: FOLDERS.USER_ROOT, name: 'Root', children: [folder] });
		populateFoldersStore({
			view: FOLDER_VIEW.message,
			customFolders: [rootFolder]
		});
		const onConfirm = jest.fn();
		const { user } = setupTest(
			<MovetoFolder
				destination={undefined}
				onSelectFolder={jest.fn()}
				onConfirmDestination={onConfirm}
			/>
		);
		const browseFolder = screen.getByRole('button', {
			name: /browse/i
		});
		await user.click(browseFolder);
		makeListItemsVisible();
		act(() => {
			jest.advanceTimersByTime(1000);
		});
		await user.click(screen.getByTestId(`folder-accordion-item-${folder.id}`));
		const chooseFolder = screen.getByRole('button', { name: 'Choose' });
		expect(chooseFolder).toBeEnabled();
		await user.click(chooseFolder);
		expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ name: folder.name }));
	});

	it('should  close the modal clicking on the cross icon ', async () => {
		const folder = generateFolder({
			id: '100',
			name: 'Test folder'
		});
		const rootFolder = generateFolder({ id: FOLDERS.USER_ROOT, name: 'Root', children: [folder] });
		populateFoldersStore({
			view: FOLDER_VIEW.message,
			customFolders: [rootFolder]
		});
		const onConfirm = jest.fn();
		const { user } = setupTest(
			<MovetoFolder
				destination={undefined}
				onSelectFolder={jest.fn()}
				onConfirmDestination={onConfirm}
			/>
		);
		const browseFolder = screen.getByRole('button', {
			name: /browse/i
		});
		await user.click(browseFolder);
		await user.click(screen.getByTestId('icon: CloseOutline'));

		expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
	});
});
