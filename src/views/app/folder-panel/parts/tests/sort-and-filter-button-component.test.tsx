/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { SortAndFilterButtonComponent } from '../sort-and-filter-button-component';
import { screen, setupTest } from '@test-setup';
import { editSettings } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';
import { each } from 'immer/dist/internal.js';
import { waitFor } from '@testing-library/dom';

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

	// todo: check all possible cases
	it('should call the edieSettings when changing a sorting/filtering option', async () => {
		const { user } = setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);
		await user.click(screen.getByTestId('icon: AzListOutline'));
		await user.click(screen.getByText('Important'));

		expect(editSettings).toHaveBeenCalledWith({
			prefs: { zimbraPrefSortOrder: expect.stringContaining(`${FOLDER_ID}:date-Desc-priority`) }
		});
	});

	it.each([
		{ label: 'Unread', value: 'read' },
		{ label: 'Important', value: 'priority' },
		{ label: 'Flagged', value: 'flag' },
		{ label: 'Attachment', value: 'attach' }
	])('should call editSettings when changing filtering option: %s', async ({ label, value }) => {
		const { user } = setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);
		await user.click(screen.getByTestId('icon: AzListOutline'));
		await user.click(screen.getByText(label));

		expect(editSettings).toHaveBeenCalledWith({
			prefs: {
				zimbraPrefSortOrder: expect.stringContaining(`${FOLDER_ID}:date-Desc-${value}`)
			}
		});
	});
	it.each([
		{ label: 'Date', value: 'date' },
		{ label: 'Subject', value: 'subj' },
		{ label: 'From', value: 'name' }
	])('should call editSettings when changing sort option: %s', async ({ label, value }) => {
		const { user } = setupTest(<SortAndFilterButtonComponent folderId={FOLDER_ID} />);
		await user.click(screen.getByTestId('icon: AzListOutline'));
		await user.click(screen.getByText(label));

		expect(editSettings).toHaveBeenCalledWith({
			prefs: {
				zimbraPrefSortOrder: expect.stringContaining(`${FOLDER_ID}:${value}-Desc`)
			}
		});
	});
});
