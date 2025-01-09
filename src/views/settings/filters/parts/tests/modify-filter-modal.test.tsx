/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { act } from 'react';

import { screen } from '@testing-library/react';
import { omit } from 'lodash';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../tests/generators/store';
import { Filter } from '../../../../../types';
import { ModifyFilterModal } from '../modify-filter/modify-filter-modal';

describe('modify filter modal', () => {
	it('should display modal with current saved actions', async () => {
		const store = generateStore();
		setupTest(
			<ModifyFilterModal
				onClose={jest.fn()}
				selectedFilter={{
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
				onModifyConfirm={jest.fn()}
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
				onClose={jest.fn()}
				onModifyConfirm={jest.fn()}
				selectedFilter={mockFilter({ name: 'Test Filter' })}
			/>,
			{
				store
			}
		);
		expect(screen.getByRole('textbox', { name: 'Filter Name*' })).toHaveValue('Test Filter');
	});
	it('should call onConfirm with old data if there are no changes', async () => {
		const onConfirm = jest.fn();
		const store = generateStore();
		const selectedFilter = mockFilter({ name: 'Test Filter', id: '1' });
		const { user } = setupTest(
			<ModifyFilterModal
				onClose={jest.fn()}
				onModifyConfirm={onConfirm}
				selectedFilter={selectedFilter}
			/>,
			{
				store
			}
		);

		const saveButton = screen.getByRole('button', {
			name: 'Save'
		});
		await act(async () => {
			await user.click(saveButton);
		});
		expect(onConfirm).toHaveBeenCalledWith(omit({ ...selectedFilter, filterTests: [{}] }, 'id'));
	});
	// it('should call onConfirm all incoming filters in initial order when clicking save button', async () => {
	// 	const store = generateStore();
	// 	const filterId1 = mockFilter({ name: 'Test Filter 2', id: '1', flagName: 'bbb' });
	// 	const selectedFilterId2 = mockFilter({ name: 'Test Filter', id: '2' });
	// 	const filterId3 = mockFilter({ name: 'Test Filter 3', id: '3' });
	// 	const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
	// 	const { user } = setupTest(
	// 		<ModifyFilterModal
	// 			onClose={jest.fn()}
	// 			onModifyConfirm={jest.fn()}
	// 			selectedFilter={selectedFilterId2}
	// 		/>,
	// 		{
	// 			store
	// 		}
	// 	);

	// 	const saveButton = screen.getByRole('button', {
	// 		name: 'Save'
	// 	});
	// 	await act(async () => {
	// 		await user.click(saveButton);
	// 	});
	// 	const request = await modifyFilterRulesInterceptor;
	// 	expect(request).toEqual({
	// 		_jsns: 'urn:zimbraMail',
	// 		filterRules: [
	// 			{
	// 				filterRule: [
	// 					filterId3,
	// 					{
	// 						...selectedFilterId2,
	// 						id: undefined,
	// 						filterTests: [{}]
	// 					},
	// 					filterId1
	// 				]
	// 			}
	// 		]
	// 	});
	// });
	it('should call onConfirm by omitting id of selected filter when clicking save button', async () => {
		const onConfirm = jest.fn();
		const store = generateStore();
		const selectedFilter = mockFilter({ name: 'Test Filter', id: '1' });
		const { user } = setupTest(
			<ModifyFilterModal
				onClose={jest.fn()}
				onModifyConfirm={onConfirm}
				selectedFilter={selectedFilter}
			/>,
			{
				store
			}
		);

		const saveButton = screen.getByRole('button', {
			name: 'Save'
		});
		await act(async () => {
			await user.click(saveButton);
		});
		expect(onConfirm).toHaveBeenCalledWith(omit({ ...selectedFilter, filterTests: [{}] }, 'id'));
	});

	it('should call onConfirm with updated filter name after clicking save button', async () => {
		const onConfirm = jest.fn();
		const store = generateStore();
		const selectedFilter = mockFilter({ name: 'Test Filter' });
		const { user } = setupTest(
			<ModifyFilterModal
				onClose={jest.fn()}
				onModifyConfirm={onConfirm}
				selectedFilter={selectedFilter}
			/>,
			{
				store
			}
		);

		const filterInputElement = screen.getByRole('textbox', {
			name: 'Filter Name*'
		});
		await user.clear(filterInputElement);
		await user.type(filterInputElement, 'My filter');
		const saveButton = screen.getByRole('button', {
			name: 'Save'
		});
		await act(async () => {
			await user.click(saveButton);
		});

		expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ name: 'My filter' }));
	});

	// it('show that onConfirm is called with whatever value we declare at beginning', async () => {
	// 	const store = generateStore();

	// 	const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
	// 	const otherFilter = {
	// 		...mockFilter({ name: 'Test Filter 2', id: '2' }),
	// 		anotherField: 'this field should not be present but is sent to the API anyway'
	// 	};
	// 	const selectedFilter = mockFilter({ name: 'Test Filter' });
	// 	const { user } = setupTest(
	// 		<ModifyFilterModal
	// 			onClose={jest.fn()}
	// 			onModifyConfirm={jest.fn()}
	// 			selectedFilter={selectedFilter}
	// 		/>,
	// 		{
	// 			store
	// 		}
	// 	);
	// 	const filterInputElement = screen.getByRole('textbox', {
	// 		name: 'Filter Name*'
	// 	});
	// 	await user.clear(filterInputElement);
	// 	await user.type(filterInputElement, 'My filter');

	// 	const saveButton = screen.getByRole('button', {
	// 		name: 'Save'
	// 	});
	// 	await act(async () => {
	// 		await user.click(saveButton);
	// 	});
	// 	const request = await modifyFilterRulesInterceptor;
	// 	expect(request).toEqual({
	// 		_jsns: 'urn:zimbraMail',
	// 		filterRules: [
	// 			{
	// 				filterRule: [
	// 					{ ...selectedFilter, name: 'My filter', filterTests: [{}], id: undefined },
	// 					otherFilter
	// 				]
	// 			}
	// 		]
	// 	});
	// });
});

// TODO: after inspecting the production code the fields "id" is not sent to the API, do we really need it or is it an effect of the spread?
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
}): Filter {
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
