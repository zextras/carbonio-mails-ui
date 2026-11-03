/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { act } from 'react';

import { screen } from '@testing-library/react';
import { map, mapValues, omit } from 'lodash';

import { setupTest } from '@test-setup';
import { getFilterRulesResponse } from 'api/tests/fixtures/get-filter-rules-response';
import { normalizeFilterRulesFromSoap } from 'normalizations/normalize-filter-rules';
import { Filter } from 'types/filters';
import { ModifyFilterModal } from 'views/settings/filters/parts/modify-filter/modify-filter-modal';

const FILTER_NAME_LABEL = 'Filter Name*';

describe('modify filter modal', () => {
	it('should display modal with current saved actions', async () => {
		setupTest(
			<ModifyFilterModal
				isIncoming
				onClose={vi.fn()}
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
				onModifyConfirm={vi.fn()}
			/>
		);

		expect(screen.getByText('Keep in Inbox')).toBeVisible();
		expect(await screen.findByText(/Tag with/i)).toBeVisible();
		expect(screen.getByText('tag 1')).toBeVisible();
		expect(screen.getByText('Mark as')).toBeVisible();
		expect(screen.getByText('Flagged')).toBeVisible();
	});

	it('should display existing filter with current title when modifying', async () => {
		setupTest(
			<ModifyFilterModal
				isIncoming
				onClose={vi.fn()}
				onModifyConfirm={vi.fn()}
				selectedFilter={mockFilter({ name: 'Test Filter' })}
			/>
		);
		expect(screen.getByRole('textbox', { name: FILTER_NAME_LABEL })).toHaveValue('Test Filter');
	});
	it('should call onConfirm with old data if there are no changes', async () => {
		const onConfirm = vi.fn();
		const selectedFilter = mockFilter({ name: 'Test Filter' });
		const { user } = setupTest(
			<ModifyFilterModal
				isIncoming
				onClose={vi.fn()}
				onModifyConfirm={onConfirm}
				selectedFilter={selectedFilter}
			/>
		);

		const saveButton = screen.getByRole('button', {
			name: 'Save'
		});
		await act(async () => {
			await user.click(saveButton);
		});
		expect(onConfirm).toHaveBeenCalledWith({ ...selectedFilter, filterTests: [{}] });
	});

	it('should call onConfirm with updated filter name after clicking save button', async () => {
		const onConfirm = vi.fn();
		const selectedFilter = mockFilter({ name: 'Test Filter' });
		const { user } = setupTest(
			<ModifyFilterModal
				isIncoming
				onClose={vi.fn()}
				onModifyConfirm={onConfirm}
				selectedFilter={selectedFilter}
			/>
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

	it('keeps the tests and actions the editor does not offer when saving', async () => {
		const onConfirm = vi.fn();
		const selectedFilter = savedRule(1);
		const { user } = setupTest(
			<ModifyFilterModal
				isIncoming
				onClose={vi.fn()}
				onModifyConfirm={onConfirm}
				selectedFilter={selectedFilter}
			/>
		);

		const filterInputElement = screen.getByRole('textbox', { name: FILTER_NAME_LABEL });
		await user.clear(filterInputElement);
		await user.type(filterInputElement, 'renamed');
		await act(async () => {
			await user.click(screen.getByRole('button', { name: 'Save' }));
		});

		const saved: Filter = onConfirm.mock.calls[0][0];
		expect(saved.name).toBe('renamed');
		expect(saved.filterActions[0]).toEqual(
			expect.objectContaining({
				actionLog: [{ level: 'info', _content: 'matched' }],
				actionNotify: [{ a: 'user2@example.com', su: 'notified', content: [{ _content: 'body' }] }],
				actionRedirect: [{ a: 'user2@example.com', copy: true }]
			})
		);
		expect(saved.filterTests[0]).toEqual(selectedFilter.filterTests[0]);
	});

	it.each([0, 2])('saves rule %s as the server sent it after a rename', async (rule) => {
		const onConfirm = vi.fn();
		const selectedFilter = savedRule(rule);
		const { user } = setupTest(
			<ModifyFilterModal
				isIncoming
				onClose={vi.fn()}
				onModifyConfirm={onConfirm}
				selectedFilter={selectedFilter}
			/>
		);

		const filterInputElement = screen.getByRole('textbox', { name: FILTER_NAME_LABEL });
		await user.clear(filterInputElement);
		await user.type(filterInputElement, 'renamed');
		await act(async () => {
			await user.click(screen.getByRole('button', { name: 'Save' }));
		});

		const saved: Filter = onConfirm.mock.calls[0][0];
		expect(saved.filterTests[0]).toEqual(selectedFilter.filterTests[0]);
		expect(saved.filterActions[0]).toEqual(
			mapValues(selectedFilter.filterActions[0], (actions) =>
				map(actions, (action) => omit(action, 'index'))
			)
		);
	});

	it('opens a rule whose tests leave out their optional fields', async () => {
		const selectedFilter: Filter = {
			name: 'sparse',
			active: true,
			filterTests: [
				{
					condition: 'anyof',
					headerTest: [{}],
					bodyTest: [{}],
					sizeTest: [{}],
					inviteTest: [{ negative: true }],
					attachmentTest: [{ negative: true }],
					meTest: [{ header: 'to' }]
				}
			],
			filterActions: [{ actionKeep: [{}] }]
		};
		setupTest(
			<ModifyFilterModal
				isIncoming
				onClose={vi.fn()}
				onModifyConfirm={vi.fn()}
				selectedFilter={selectedFilter}
			/>
		);

		expect(await screen.findByText('Edit sparse')).toBeVisible();
		expect(screen.getByRole('textbox', { name: FILTER_NAME_LABEL })).toHaveValue('sparse');
	});
});

/** A rule of the real GetFilterRules fixture, normalized as the settings load it */
function savedRule(index: number): Filter {
	const rules = normalizeFilterRulesFromSoap(getFilterRulesResponse.filterRules).filterRules[0];
	return rules.filterRule?.[index] as Filter;
}

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
