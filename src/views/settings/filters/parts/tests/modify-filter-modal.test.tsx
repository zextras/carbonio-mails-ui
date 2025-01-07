/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { t } from '@zextras/carbonio-shell-ui';

import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../tests/generators/store';
import { FilterListType } from '../../../../../types';
import ModifyFilterModal from '../modify-filter/modify-filter-modal';

describe('modify filter modal', () => {
	it('should display modal with current saved actions', async () => {
		const store = generateStore();
		setupTest(
			<ModifyFilterModal
				t={t}
				onClose={jest.fn()}
				selectedFilter={{
					id: '1',
					name: 'Test Filter',
					active: true,
					filterTests: [],
					filterActions: [
						{
							actionKeep: [{}],
							actionTag: [{ tagName: 'tag 1' }],
							actionFlag: [{ flagName: 'flagged' }]
						}
					]
				}}
				setFetchIncomingFilters={jest.fn()}
				setIncomingFilters={jest.fn()}
			/>,
			{
				store
			}
		);

		expect(screen.getByText('Keep in Inbox')).toBeVisible();
		expect(await screen.findByText(/Tag with/i)).toBeVisible();
		expect(screen.getByText('tag 1')).toBeVisible();
		expect(screen.getByText('Mark as')).toBeVisible();
		expect(screen.getByText('Flagged')).toBeVisible();
	});

	it('should call ModifyFiltersRule API when clicking create button', async () => {
		const store = generateStore();

		const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const { user } = setupTest(
			<ModifyFilterModal
				t={t}
				onClose={jest.fn()}
				setFetchIncomingFilters={jest.fn()}
				setIncomingFilters={jest.fn()}
				incomingFilters={[]}
				selectedFilter={mockFilter({ name: 'Test Filter' })}
			/>,
			{
				store
			}
		);
		const filterInputElement = screen.getByRole('textbox', {
			name: 'settings.filter_name*'
		});
		await user.type(filterInputElement, 'My filter');

		const saveButton = screen.getByRole('button', {
			name: /label\.save/i
		});
		await user.click(saveButton);
		const request = await modifyFilterRulesInterceptor;
		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				// {
				// 	filterRule: [
				// 		{
				// 			active: false,
				// 			name: 'Test filter',
				// 			filterActions: [{ actionKeep: [{}], actionStop: [{}] }],
				// 			filterTests: [{ condition: 'anyof' }]
				// 		}
				// 	]
				// },
				// {
				// 	filterRule: [
				// 		{
				// 			active: false,
				// 			name: 'My filter',
				// 			filterActions: [{ actionKeep: [{}], actionStop: [{}] }],
				// 			filterTests: [{ condition: 'anyof' }]
				// 		}
				// 	]
				// }
			]
		});
	});
});

function mockFilter({
	name,
	flagName = 'flagged',
	tagName = 'tag 1'
}: {
	name: string;
	flagName?: string;
	tagName?: string;
}): FilterListType {
	return {
		id: '1',
		name,
		active: true,
		filterTests: [],
		filterActions: [
			{
				actionKeep: [{}],
				actionTag: [{ tagName }],
				actionFlag: [{ flagName }]
			}
		]
	};
}
