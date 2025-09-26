/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { SortAndFilterHeaderComponent } from '../sort-and-filter-header-component';
import { screen, setupTest } from '@test-setup';
import { FILTER_OPTIONS, SORTING_DIRECTION, SORTING_OPTIONS } from 'constants/index';
import { parseMessageSortingOptions, updateSortAndFilterSettings } from 'helpers/sorting';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	useUserSettings: jest.fn()
}));
jest.mock('helpers/sorting', () => ({
	parseMessageSortingOptions: jest.fn(),
	updateSortAndFilterSettings: jest.fn()
}));

describe('Sort and Filter Header Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(useUserSettings as jest.Mock).mockReturnValue({
			prefs: { zimbraPrefSortOrder: '' }
		});
	});

	const folderId = 'test-folder';

	it('should not render if state is default', () => {
		(parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.date.value,
			filterType: undefined
		});
		setupTest(<SortAndFilterHeaderComponent folderId={folderId} />);

		expect(screen.queryByTestId('sorting-options-container')).not.toBeInTheDocument();
	});

	it('should render with modified state', () => {
		(parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.subject.value,
			filterType: FILTER_OPTIONS.unread.value
		});
		setupTest(<SortAndFilterHeaderComponent folderId={folderId} />);

		expect(screen.getByTestId('sorting-options-container')).toBeInTheDocument();
		expect(screen.getByText(/Show:/i)).toBeInTheDocument();
		expect(screen.getByText(/Sort by/i)).toBeInTheDocument();
	});

	it('should call updateSortAndFilterSettings when Reset is clicked', async () => {
		(parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.subject.value,
			filterType: FILTER_OPTIONS.unread.value
		});
		const { user } = setupTest(<SortAndFilterHeaderComponent folderId={folderId} />);

		await user.click(screen.getByRole('button', { name: /Reset/i }));

		expect(updateSortAndFilterSettings).toHaveBeenCalledWith(
			expect.objectContaining({
				filter: undefined,
				folderId,
				prefSortOrder: '',
				sortDirection: SORTING_DIRECTION.DESCENDING,
				sortType: SORTING_OPTIONS.date.value
			})
		);
	});

	it('should not render when invalid legacy values are normalized to defaults', () => {
		(parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: 'legacy_sort',
			filterType: 'legacy_filter'
		});
		setupTest(<SortAndFilterHeaderComponent folderId={folderId} />);

		expect(screen.queryByTestId('sorting-options-container')).not.toBeInTheDocument();
	});
});
