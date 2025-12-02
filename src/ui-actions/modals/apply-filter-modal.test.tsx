/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { ApplyFilterModal } from 'ui-actions/modals/apply-filter-modal';

describe('Apply Filter Modal', () => {
	test('should render the modal', async () => {
		setupTest(<ApplyFilterModal criteria={{ filterName: 'My filter' }} onClose={vi.fn()} />);

		expect(await screen.findByText('Application filter My filter')).toBeInTheDocument();
	});

	test('should open folder selection modal when folder icon is clicked', async () => {
		const { user } = setupTest(
			<ApplyFilterModal criteria={{ filterName: 'My filter' }} onClose={vi.fn()} />
		);

		expect(await screen.findByText('Application filter My filter')).toBeInTheDocument();
		const folderButton = screen.getByTestId('icon: FolderOutline');
		act(() => {
			user.click(folderButton);
		});
		expect(await screen.findByTestId('select-folder-modal')).toBeInTheDocument();

		expect(
			await screen.findByRole('button', { name: /label\.select_folder/i })
		).toBeInTheDocument();
	});
});
