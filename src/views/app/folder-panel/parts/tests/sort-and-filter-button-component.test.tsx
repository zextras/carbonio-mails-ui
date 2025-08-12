/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { SortAndFilterButtonComponent } from '../sort-and-filter-button-component';
import { screen, setupTest } from '@test-setup';
import { editSettings, useUserSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { generateSettings } from '@test-utils/settings/settings-generator';

const FOLDER_ID = '123';

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
		await user.click(screen.getByText('Important'));
		expect(screen.getByTestId('dropdown-popper-list')).toBeVisible();
	});

	const FILTER_OPTION = [
		{ label: 'Unread', value: 'read' },
		{ label: 'Important', value: 'priority' },
		{ label: 'Flagged', value: 'flag' },
		{ label: 'Attachment', value: 'attach' }
	];
	const SORT_OPTION = [
		{ label: 'Date', value: 'date' },
		{ label: 'Subject', value: 'subj' },
		{ label: 'From', value: 'name' }
	];
	const COMBINATIONS = SORT_OPTION.flatMap((sort) =>
		FILTER_OPTION.map((filter) => ({
			sortValue: sort.value.toLowerCase(),
			filterLabel: filter.label,
			filterValue: filter.value
		}))
	);

	// TODO: Check if they are needed
	// it.each(FILTER_OPTION)(
	// 	'should call editSettings when changing filtering option: %s',
	// 	async ({ label, value }) => {
	// 		const { user } = setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);

	// 		await user.click(screen.getByTestId('icon: AzListOutline'));

	// 		await user.click(screen.getByText(label));

	// 		expect(editSettings).toHaveBeenCalledWith({
	// 			prefs: {
	// 				zimbraPrefSortOrder: expect.stringContaining(`${FOLDER_ID}:date-Desc-${value}`)
	// 			}
	// 		});
	// 	}
	// );
	// it.each(SORT_OPTION)(
	// 	'should call editSettings when changing sort option: %s',
	// 	async ({ label, value }) => {
	// 		const { user } = setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);

	// 		await user.click(screen.getByTestId('icon: AzListOutline'));

	// 		await user.click(screen.getByText(label));

	// 		expect(editSettings).toHaveBeenCalledWith({
	// 			prefs: {
	// 				zimbraPrefSortOrder: expect.stringContaining(`${FOLDER_ID}:${value}-Desc`)
	// 			}
	// 		});
	// 	}
	// );

	// we need to take care also about direction
	test.each(COMBINATIONS)(
		'should be called with the relative zimbraPref - %s',
		async ({ sortValue, filterLabel, filterValue }) => {
			const settings = generateSettings({
				prefs: { zimbraPrefSortOrder: `${FOLDER_ID}:${sortValue}-Desc` }
			});
			useUserSettings.mockReturnValue(settings);
			const { user } = setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);

			await user.click(screen.getByTestId('icon: AzListOutline'));
			await user.click(screen.getByText(filterLabel));

			expect(editSettings).toHaveBeenCalledWith({
				prefs: {
					zimbraPrefSortOrder: expect.stringContaining(
						`${FOLDER_ID}:${sortValue}-Desc-${filterValue}`
					)
				}
			});
		}
	);
});
