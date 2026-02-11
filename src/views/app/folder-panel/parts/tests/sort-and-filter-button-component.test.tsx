/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';

import { SortAndFilterButtonComponent } from '../sort-and-filter-button-component';
import { screen, setupTest } from '@test-setup';
import { useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateSettings } from '@test-utils/settings/settings-generator';

const FOLDER_ID = '123';

vi.mock('@zextras/carbonio-ui-soap-lib', () => ({
	...vi.importActual('@zextras/carbonio-ui-soap-lib'),
	soapFetchV2: vi.fn().mockResolvedValue({ Body: {} })
}));

describe('Sort and filter button component', () => {
	it('should render a dropdown wrapper with a visible button', async () => {
		setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);
		expect(screen.getByTestId('sorting-dropdown')).toBeVisible();
		expect(screen.getByTestId('icon: AzListOutline')).toBeVisible();
	});

	it('should open the dropdown when the button is clicked', async () => {
		const { user } = setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);
		await user.click(screen.getByTestId('icon: AzListOutline'));

		expect(screen.getByTestId('dropdown-popper-list')).toBeVisible();
	});
	it('should keep the dropdown open when selecting an option', async () => {
		const { user } = setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);
		await user.click(screen.getByTestId('icon: AzListOutline'));

		expect(screen.getByTestId('dropdown-popper-list')).toBeVisible();
		await user.click(screen.getByText('All (Default)'));
		expect(screen.getByTestId('dropdown-popper-list')).toBeVisible();
	});

	const FILTER_OPTION = [
		{ label: 'All (Default)', value: undefined },
		{ label: 'Unread', value: 'read' },
		{ label: 'Important', value: 'priority' },
		{ label: 'Flagged', value: 'flag' },
		{ label: 'Attachment', value: 'attach' }
	];
	const SORT_OPTION = [
		{ label: 'Date (Default)', value: 'date' },
		{ label: 'Subject', value: 'subj' },
		{ label: 'From', value: 'name' },
		{ label: 'Size', value: 'size' }
	];
	const DIRECTION_OPTION = [
		{ label: 'sorting_dropdown.descendingOrder', value: 'Asc' },
		{ label: 'sorting_dropdown.ascendingOrder', value: 'Desc' }
	];
	const COMBINATIONS = SORT_OPTION.flatMap((sort) =>
		FILTER_OPTION.flatMap((filter) =>
			DIRECTION_OPTION.map((direction) => ({
				sortValue: sort.value,
				filterLabel: filter.label,
				filterValue: filter.value,
				directionValue: direction.value
			}))
		)
	);

	test.each(COMBINATIONS)(
		'should be called with the relative zimbraPref - %s',
		async ({ sortValue, filterLabel, filterValue, directionValue }) => {
			const settings = generateSettings({
				prefs: { zimbraPrefSortOrder: `${FOLDER_ID}:${sortValue}-${directionValue}` }
			});
			useUserSettings.mockReturnValue(settings);
			const { user } = setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);

			const icon = directionValue === 'Desc' ? 'icon: AzListOutline' : 'icon: ZaListOutline';

			await user.click(screen.getByTestId(icon));
			await user.click(screen.getByText(filterLabel));

			const expectedPref = filterValue
				? `${FOLDER_ID}:${sortValue}-${directionValue}-${filterValue}`
				: `${FOLDER_ID}:${sortValue}-${directionValue}`;

			expect(soapFetchV2).toHaveBeenCalledWith(
				'ModifyPrefs',
				expect.objectContaining({
					_attrs: {
						zimbraPrefSortOrder: expect.stringContaining(
							sortValue === 'date' && directionValue === 'Desc' ? '' : expectedPref
						)
					}
				})
			);
		}
	);
});
