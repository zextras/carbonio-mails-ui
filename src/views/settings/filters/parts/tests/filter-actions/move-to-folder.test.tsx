/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { MovetoFolder } from '../../filter-actions/move-to-folder';
import { generateStore } from '../../../../../../tests/generators/store';

describe('Move to Folder', () => {
	it('it should render the component', async () => {
		const store = generateStore();

		setupTest(
			<MovetoFolder
				destination={undefined}
				setDestination={jest.fn()}
				onSelectFolder={jest.fn()}
				onConfirmDestination={jest.fn()}
			/>,
			{
				store
			}
		);

		expect(screen.getByText('sdsdasd')).toBeInTheDocument();
	});
});
