/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../../tests/generators/store';
import { MovetoFolder } from '../../filter-actions/move-to-folder';

describe('Move to Folder', () => {
	it('it should render initial folder destination in input', async () => {
		const store = generateStore();

		setupTest(
			<MovetoFolder
				initialDestinaton={{ folderPath: 'test path' }}
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
});
