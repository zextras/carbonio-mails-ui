/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import { ApplyFilterModal } from './apply-filter-modal';
import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../tests/generators/store';

describe('Apply Filter Modal', () => {
	test('should render the modal', async () => {
		const store = generateStore();

		setupTest(<ApplyFilterModal criteria={{ filterName: 'criteria' }} modalId={'1'} />, { store });

		expect(await screen.findByText(/modals\.apply_filters\.title/i)).toBeInTheDocument();
	});

	test('should open folder selection modal when folder icon is clicked', async () => {
		const store = generateStore();

		const { user } = setupTest(
			<ApplyFilterModal criteria={{ filterName: 'criteria' }} modalId={'1'} />,
			{ store }
		);

		expect(await screen.findByText(/modals\.apply_filters\.title/i)).toBeInTheDocument();
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
