/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { FilterConditionsPanel } from 'views/settings/filters/parts/filter-conditions-panel';

describe('Filter Condition Panel', () => {
	const compProps = {
		t: (key: string, value: string): string => value,
		newFilters: [],
		setCondition: vi.fn(),
		selectedFilter: { filterTests: [{ condition: '' }] }
	};
	it('should render correctly', () => {
		setupTest(<FilterConditionsPanel compProps={compProps} />, {});
		expect(screen.getByText('any')).toBeVisible();
	});

	it('should call setCondition on select option change', async () => {
		const { user } = setupTest(<FilterConditionsPanel compProps={compProps} />, {});

		await user.click(screen.getByText('any'));
		await user.click(screen.getByText('all'));

		expect(compProps.setCondition).toHaveBeenCalledWith('allof');
	});
});
