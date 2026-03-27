/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { act } from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { Filter } from 'types/filters';
import { ModifyFilterModal } from 'views/settings/filters/parts/modify-filter/modify-filter-modal';

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
		expect(screen.getByRole('textbox', { name: 'Filter Name*' })).toHaveValue('Test Filter');
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
