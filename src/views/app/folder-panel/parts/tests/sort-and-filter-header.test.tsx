/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';

import { parseMessageSortingOptions } from '../../../../../helpers/parseMessageSortingOptions';
import { SortAndFilterHeaderComponent } from '../sort-and-filter-header-component';
import { screen, setupTest } from '@test-setup';
import { FILTER_OPTIONS, SORTING_DIRECTION, SORTING_OPTIONS } from 'constants/index';
import { updateSortAndFilterSettings } from 'helpers/sorting';

vi.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: vi.fn()
}));

vi.mock('helpers/sorting', async () => ({
	...(await vi.importActual('helpers/sorting')),
	updateSortAndFilterSettings: vi.fn()
}));

vi.mock('helpers/parseMessageSortingOptions');

describe('Sort and Filter Header Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(useUserSettings as Mock).mockReturnValue({
			prefs: { zimbraPrefSortOrder: '' }
		});
	});

	const FOLDER_ID = 'test-folder';

	it('should not render if state is default', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.date.value,
			filterType: undefined
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(screen.queryByTestId('sorting-options-container')).not.toBeInTheDocument();
	});

	it('should render with modified state', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.subject.value,
			filterType: FILTER_OPTIONS.unread.value
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(screen.getByTestId('sorting-options-container')).toBeInTheDocument();
		expect(screen.getByText(/Show:/i)).toBeInTheDocument();
		expect(screen.getByText(/Sort by/i)).toBeInTheDocument();
	});

	it('should call updateSortAndFilterSettings when Reset is clicked', async () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.subject.value,
			filterType: FILTER_OPTIONS.unread.value
		});
		const { user } = setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		await user.click(screen.getByRole('button', { name: /Reset/i }));

		expect(updateSortAndFilterSettings).toHaveBeenCalledWith(
			expect.objectContaining({
				filter: undefined,
				folderId: FOLDER_ID,
				prefSortOrder: '',
				sortDirection: SORTING_DIRECTION.DESCENDING,
				sortType: SORTING_OPTIONS.date.value
			})
		);
	});

	it('should not render when invalid legacy values are normalized to defaults', () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: 'legacy_sort',
			filterType: 'legacy_filter'
		});
		setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		expect(screen.queryByTestId('sorting-options-container')).not.toBeInTheDocument();
	});

	it('should display correct tooltip on reset button', async () => {
		(parseMessageSortingOptions as Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.subject.value,
			filterType: FILTER_OPTIONS.unread.value
		});
		const { user } = setupTest(<SortAndFilterHeaderComponent folderId={FOLDER_ID} />);

		const resetButton = screen.getByRole('button', { name: /Reset/i });

		await user.hover(resetButton);

		expect(await screen.findByText('Reset to default')).toBeInTheDocument();
	});
});
