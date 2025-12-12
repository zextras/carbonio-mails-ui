/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { FilterConditionRow } from 'views/settings/filters/parts/filter-condition-row';

describe('Filter Condition Row', () => {
	const compProps = {
		t: (key: string, value: string): string => value,
		newFilters: [
			{
				active: false,
				comp: <></>,
				filterActions: [{ actionKeep: [{}], actionStop: [{}] }],
				filterTests: [{}],
				index: 0,
				key: 'Subject',
				label: 'Subject',
				name: ''
			}
		],
		setNewFilters: vi.fn(),
		condition: 'anyof',
		activeFilter: false,
		filterName: ''
	};
	it('should render correctly', () => {
		setupTest(
			<FilterConditionRow
				tmpFilter={{
					active: false,
					comp: <>render subject</>,
					filterActions: [{ actionKeep: [{}], actionStop: [{}] }],
					filterTests: [{}],
					index: 0,
					key: 'Subject',
					label: 'Subject',
					name: ''
				}}
				index={'0'}
				compProps={compProps}
			/>,
			{}
		);
		expect(screen.getByText('render subject')).toBeVisible();
	});
});
