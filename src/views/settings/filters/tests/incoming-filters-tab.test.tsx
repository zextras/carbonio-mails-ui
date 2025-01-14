/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import { act, screen } from '@testing-library/react';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { makeListItemsVisible, setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../tests/generators/store';
import { Filter } from '../../../../types';
import { IncomingFiltersTab } from '../incoming-filters-tab';

describe('incoming filters', () => {
	it('should display incoming filters', async () => {
		const store = generateStore();
		const getIncomingFiltersInterceptor = createSoapAPIInterceptor('GetFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
						mockFilter({ name: 'Filter 1' }),
						mockFilter({ name: 'Filter 2' }),
						mockFilter({ name: 'Filter 3' })
					]
				}
			]
		});
		setupTest(<IncomingFiltersTab />, { store });
		await getIncomingFiltersInterceptor;

		expect(await screen.findByText('Filter 1')).toBeVisible();
	});
	// it(' should call ModifyFilterRules API with all incoming filters when saving modified filter', async () => {
	// 	const store = generateStore();
	// 	(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
	// 	const availableList = createList([]);
	// 	const otherFilter = activeIncomingFilter('Other filter');
	// 	const myFilter = activeIncomingFilter('My filter');
	// 	const filters = [otherFilter, myFilter];
	// 	const activeList = createList(filters, 'My filter');
	// 	const props = {
	// 		availableList,
	// 		activeList,
	// 		filters,
	// 		setFetchFilters: jest.fn(),
	// 		setFilters: jest.fn()
	// 	};
	//
	// 	const { user } = setupTest(<IncomingFilterActions {...props} />, { store });
	// 	const modifyFilterBtn = await screen.findByRole('button', { name: 'Edit' });
	// 	await user.click(modifyFilterBtn);
	// 	makeAllItemsVisible();
	// 	expect(screen.getByTestId('modal')).toBeVisible();
	// 	const filterNameInput = screen.getByRole('textbox', {
	// 		name: 'Filter Name*'
	// 	});
	// 	await user.clear(filterNameInput);
	// 	await user.type(filterNameInput, 'Edited filter');
	// 	const saveButton = screen.getByRole('button', {
	// 		name: 'Save'
	// 	});
	// 	expect(saveButton).toBeEnabled();
	// 	await act(async () => {
	// 		await user.click(saveButton);
	// 	});
	//
	// 	expect(mockSave).toHaveBeenCalledWith([
	// 		otherFilter,
	// 		{
	// 			active: true,
	// 			filterActions: [
	// 				{
	// 					actionKeep: [{}],
	// 					actionStop: [{}]
	// 				}
	// 			],
	// 			filterTests: [
	// 				{
	// 					condition: 'anyof',
	// 					headerTest: [
	// 						{
	// 							header: 'subject',
	// 							stringComparison: 'contains',
	// 							testName: 'headerTest',
	// 							value: 'testddsareafreafdastewa'
	// 						}
	// 					]
	// 				}
	// 			],
	// 			name: 'Edited filter'
	// 		}
	// 	]);
	// });
});

function mockFilter({
	name,
	flagName = 'flagged',
	tagName = 'tag 1'
}: {
	name: string;
	flagName?: string;
	tagName?: string;
}): Filter {
	return {
		name,
		active: true,
		filterTests: [{ condition: 'anyof' }],
		filterActions: [
			{
				actionKeep: [{}],
				actionTag: [{ tagName }],
				actionFlag: [{ flagName }]
			}
		]
	};
}

function makeAllItemsVisible(): void {
	makeListItemsVisible();
	act(() => {
		jest.advanceTimersByTime(1000);
	});
}
