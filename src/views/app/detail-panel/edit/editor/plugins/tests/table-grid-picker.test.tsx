/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { setupTest, screen } from '@test-setup';

import { TableGridPicker } from '../table-grid-picker';

describe('TableGridPicker', () => {
	it('renders a 10x10 grid by default', () => {
		setupTest(<TableGridPicker onSelect={vi.fn()} />);

		expect(screen.getByTestId('table-grid-cell-1-1')).toBeVisible();
		expect(screen.getByTestId('table-grid-cell-10-10')).toBeVisible();
		expect(screen.queryByTestId('table-grid-cell-11-1')).not.toBeInTheDocument();
	});

	it('calls onSelect with the clicked cell dimensions (rows, columns)', async () => {
		const onSelect = vi.fn();
		const { user } = setupTest(<TableGridPicker onSelect={onSelect} />);

		await user.click(screen.getByTestId('table-grid-cell-3-4'));

		expect(onSelect).toHaveBeenCalledWith(3, 4);
	});

	it('updates the size label when a cell is hovered', async () => {
		const { user } = setupTest(<TableGridPicker onSelect={vi.fn()} />);

		expect(screen.getByText('label.insert_table')).toBeVisible();

		await user.hover(screen.getByTestId('table-grid-cell-2-3'));

		expect(screen.getByText('label.table_size')).toBeVisible();
	});
});
