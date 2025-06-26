/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, act } from '@testing-library/react';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { SortingComponent } from '../sorting-component';
import { setupTest } from '@test-setup';
import { SORTING_DIRECTION, SORTING_OPTIONS } from 'constants/index';
import * as sortingHelpers from 'helpers/sorting';
import * as emailActions from 'store/emails/actions/search-action';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	t: (_key: string, fallback: string): string => fallback,
	useUserSettings: jest.fn(),
	useAppContext: jest.fn(() => ({ isMessageView: true }))
}));

jest.mock('helpers/sorting', () => ({
	...jest.requireActual('helpers/sorting'),
	parseMessageSortingOptions: jest.fn(),
	updateSortingSettings: jest.fn()
}));

jest.mock('store/emails/actions/search-action', () => ({
	searchEmailStoreAction: jest.fn()
}));

describe('SortingComponent', () => {
	const mockPrefs = {
		zimbraPrefSortOrder: 'dateDesc'
	};

	beforeEach(() => {
		(useUserSettings as jest.Mock).mockReturnValue({ prefs: mockPrefs });
		(sortingHelpers.parseMessageSortingOptions as jest.Mock).mockReturnValue({
			sortType: SORTING_OPTIONS.date.value,
			sortDirection: SORTING_DIRECTION.DESCENDING
		});
		jest.clearAllMocks();
	});

	it('renders SortingComponent with tooltip and dropdown', () => {
		setupTest(<SortingComponent folderId="inbox" />);

		expect(screen.getByTestId('sorting-dropdown')).toBeInTheDocument();
	});

	it('shows "From" when not in SENT folder', async () => {
		const { user } = setupTest(<SortingComponent folderId="inbox" />);
		await user.click(screen.getByRole('button'));

		expect(await screen.findByText(/from/i)).toBeInTheDocument();
		expect(screen.queryByText(/to/i)).not.toBeInTheDocument();
	});

	it('shows "To" when in SENT folder', async () => {
		const { user } = setupTest(<SortingComponent folderId={FOLDERS.SENT} />);
		await user.click(screen.getByRole('button'));

		expect(await screen.findByText(/to/i)).toBeInTheDocument();
		expect(screen.queryByText(/from/i)).not.toBeInTheDocument();
	});

	it('toggles sort direction on click', async () => {
		const { user } = setupTest(<SortingComponent folderId="inbox" />);
		const button = screen.getByRole('button');
		await act(async () => {
			await user.click(button);
		});
		const toggleItem = screen.getByText('Ascending order');
		await act(async () => {
			await user.click(toggleItem);
		});

		expect(sortingHelpers.updateSortingSettings).toHaveBeenCalledWith(
			expect.objectContaining({
				sortingDirection: SORTING_DIRECTION.ASCENDING
			})
		);
		expect(emailActions.searchEmailStoreAction).toHaveBeenCalledWith(
			expect.objectContaining({ sortBy: 'dateAsc' })
		);
	});

	it('applies sorting type when a new option is selected', async () => {
		const { user } = setupTest(<SortingComponent folderId="inbox" />);
		await user.click(screen.getByRole('button'));
		const subjectItem = await screen.findByText((content) => content.toLowerCase() === 'subject');
		expect(subjectItem).toBeInTheDocument();
		await user.click(subjectItem);

		expect(sortingHelpers.updateSortingSettings).toHaveBeenCalledWith(
			expect.objectContaining({
				sortingTypeValue: SORTING_OPTIONS.subject.value
			})
		);
		expect(emailActions.searchEmailStoreAction).toHaveBeenCalledWith(
			expect.objectContaining({
				sortBy: 'subjDesc'
			})
		);
	});
});
