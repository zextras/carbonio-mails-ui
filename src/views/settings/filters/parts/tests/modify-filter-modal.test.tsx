/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { act } from 'react';

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

	it('should display existing filter with current title when modifying', async () => {
		const store = generateStore();
		setupTest(
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
		expect(screen.getByRole('textbox', { name: /settings\.filter_name\*/i })).toHaveValue(
			'Test Filter'
		);
	});
	// TODO: check the tests below, they show a very strange behavior, for example the "id" is removed from the selected filter
	it('should call ModifyFiltersRule API with old data name when clicking save button', async () => {
		const store = generateStore();

		const selectedFilter = mockFilter({ name: 'Test Filter', id: '1' });
		const otherFilter = mockFilter({ name: 'Test Filter 2', id: '2', flagName: 'aaa' });
		const incomingFilters = [selectedFilter, otherFilter];
		const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const { user } = setupTest(
			<ModifyFilterModal
				t={t}
				onClose={jest.fn()}
				setFetchIncomingFilters={jest.fn()}
				setIncomingFilters={jest.fn()}
				incomingFilters={incomingFilters}
				selectedFilter={selectedFilter}
			/>,
			{
				store
			}
		);

		const saveButton = screen.getByRole('button', {
			name: /label\.save/i
		});
		await act(async () => {
			await user.click(saveButton);
		});
		const request = await modifyFilterRulesInterceptor;
		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
						{
							...selectedFilter,
							filterTests: [{}],
							id: undefined
						},
						{
							...otherFilter,
							filterTests: []
						}
					]
				}
			]
		});
	});
	it('should call ModifyFiltersRule API with all incoming filters in initial order when clicking save button', async () => {
		const store = generateStore();

		const filterId1 = mockFilter({ name: 'Test Filter 2', id: '1', flagName: 'bbb' });
		const selectedFilterId2 = mockFilter({ name: 'Test Filter', id: '2' });
		const filterId3 = mockFilter({ name: 'Test Filter 3', id: '3' });
		const incomingFilters = [filterId3, selectedFilterId2, filterId1];
		const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const { user } = setupTest(
			<ModifyFilterModal
				t={t}
				onClose={jest.fn()}
				setFetchIncomingFilters={jest.fn()}
				setIncomingFilters={jest.fn()}
				incomingFilters={incomingFilters}
				selectedFilter={selectedFilterId2}
			/>,
			{
				store
			}
		);

		const saveButton = screen.getByRole('button', {
			name: /label\.save/i
		});
		await act(async () => {
			await user.click(saveButton);
		});
		const request = await modifyFilterRulesInterceptor;
		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
						filterId3,
						{
							...selectedFilterId2,
							id: undefined,
							filterTests: [{}]
						},
						filterId1
					]
				}
			]
		});
	});
	it('should call ModifyFiltersRule API by omitting id of selected filter when clicking save button', async () => {
		const store = generateStore();
		const selectedFilter = mockFilter({ name: 'Test Filter', id: '1' });
		const incomingFilters = [selectedFilter];
		const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const { user } = setupTest(
			<ModifyFilterModal
				t={t}
				onClose={jest.fn()}
				setFetchIncomingFilters={jest.fn()}
				setIncomingFilters={jest.fn()}
				incomingFilters={incomingFilters}
				selectedFilter={selectedFilter}
			/>,
			{
				store
			}
		);

		const saveButton = screen.getByRole('button', {
			name: /label\.save/i
		});
		await act(async () => {
			await user.click(saveButton);
		});
		const request = await modifyFilterRulesInterceptor;
		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
						{
							...selectedFilter,
							id: undefined,
							filterTests: [{}]
						}
					]
				}
			]
		});
	});
	// TODO: check line 287 of modify-filter-modal. When you modify the name of an existing filter the index is -1,
	// so it puts the value at array[-1] causing a strange behavior
	it('should call ModifyFiltersRule API with new modified filter name when clicking save button', async () => {
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
		await act(async () => {
			await user.click(saveButton);
		});
		const request = await modifyFilterRulesInterceptor;
		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
						{
							'1': {
								active: true,
								filterActions: [
									{
										actionKeep: [{}],
										actionStop: [{}]
									}
								],
								filterTests: [{}],
								name: 'ccccc'
							}
						}
					]
				}
			]
		});
	});
});

function mockFilter({
	id = '1',
	name,
	flagName = 'flagged',
	tagName = 'tag 1'
}: {
	id?: string;
	name: string;
	flagName?: string;
	tagName?: string;
}): FilterListType {
	return {
		id,
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
