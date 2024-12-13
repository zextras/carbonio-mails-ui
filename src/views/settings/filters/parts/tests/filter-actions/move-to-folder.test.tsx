/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import { FOLDER_VIEW } from '../../../../../../carbonio-ui-commons/constants';
import { FOLDERS } from '../../../../../../carbonio-ui-commons/constants/folders';
import { generateFolder } from '../../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { populateFoldersStore } from '../../../../../../carbonio-ui-commons/test/mocks/store/folders';
import {
	makeListItemsVisible,
	setupTest
} from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../../tests/generators/store';
import { MovetoFolder } from '../../filter-actions/move-to-folder';

describe('Move to Folder', () => {
	it('it should render initial folder destination in input', async () => {
		const store = generateStore();

		setupTest(
			<MovetoFolder
				destination={{ name: 'test path' }}
				onSelectFolder={jest.fn()}
				onConfirmDestination={jest.fn()}
			/>,
			{
				store
			}
		);
		const input = screen.getByRole('textbox', { name: 'Destination Folder' });
		expect(input).toHaveValue('test path');
	});

	it('it should return selected destination on confirm', async () => {
		const store = generateStore();
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
			/>,
			{
				store
			}
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
});
