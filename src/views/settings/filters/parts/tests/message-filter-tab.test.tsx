/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor, within } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { useSnackbar } from '@zextras/carbonio-design-system';

import { FilterRulesAPIResponse } from '../../../../../api/get-filters';
import { Filter } from '../../../../../types';
import { makeAllItemsVisible, mockFilter } from '../../tests/test-utils';
import { getFiltermanager } from '../filter-manager';
import { MessageFilterTab } from '../message-filter-tab';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));
const createSnackbarSpy = jest.fn((arg) => arg);

describe('Message filters tab', () => {
	it('should call getFilters only once', async () => {
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const filters = [mockFilter({ name: 'Filter 1' })];

		const getFilters = jest.fn();
		getFilters.mockReturnValue(
			Promise.resolve({
				filterRules: [
					{
						filterRule: filters
					}
				]
			})
		);
		setupTest(
			<MessageFilterTab
				saveFilters={jest.fn()}
				getFilters={getFilters}
				FiltersManagerComponent={getFiltermanager(true)}
			/>
		);
		await screen.findByText('Filter 1');
		await waitFor(() => expect(getFilters).toHaveBeenCalledTimes(1));
	});
	it('should call onConfirm with filters as declared in initial order when saving an edited filter', async () => {
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const filters = [mockFilter({ name: 'Test filter 1' }), mockFilter({ name: 'Test filter 2' })];
		const mockSave = jest.fn();
		mockSave.mockReturnValue(Promise.resolve());

		const user = setupTestWithFilters({ filters, onSave: mockSave });

		const filter1 = await screen.findByText('Test filter 1');
		expect(filter1).toBeVisible();
		await user.click(filter1);
		await user.click(await screen.findByRole('button', { name: 'Edit' }));
		const saveButton = screen.getByRole('button', {
			name: 'Save'
		});
		await user.click(saveButton);

		expect(mockSave).toHaveBeenCalledWith(filters);
	});

	it('should display snackbar with error if not able to retrieve filters', async () => {
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);

		setupTest(
			<MessageFilterTab
				saveFilters={jest.fn()}
				getFilters={() => Promise.reject()}
				FiltersManagerComponent={getFiltermanager(true)}
			/>
		);
		await waitFor(() =>
			expect(createSnackbarSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					label: 'Something went wrong, please try again'
				})
			)
		);
	});

	it('should display retrieved filters', async () => {
		const filters = [
			mockFilter({ name: 'Filter 1' }),
			mockFilter({ name: 'Filter 2' }),
			mockFilter({ name: 'Filter 3' })
		];

		setupTestWithFilters({ filters });

		expect(await screen.findByText('Filter 1')).toBeVisible();
		expect(await screen.findByText('Filter 2')).toBeVisible();
		expect(await screen.findByText('Filter 3')).toBeVisible();
	});

	it('should call on save with all existing filters when saving modified filter', async () => {
		const onSave = jest.fn();
		onSave.mockReturnValue(Promise.resolve({}));
		const filter1 = mockFilter({ name: 'Filter 1' });
		const otherFilters = [mockFilter({ name: 'Filter 2' }), mockFilter({ name: 'Filter 3' })];
		const filters = [filter1, ...otherFilters];

		const user = setupTestWithFilters({ filters, onSave });

		const selectFilter1 = await screen.findByText('Filter 1');
		await user.click(selectFilter1);
		const modifyFilterBtn = await screen.findByRole('button', { name: 'Edit' });
		await user.click(modifyFilterBtn);
		makeAllItemsVisible();
		expect(screen.getByTestId('modal')).toBeVisible();
		const filterNameInput = screen.getByRole('textbox', {
			name: 'Filter Name*'
		});
		await user.clear(filterNameInput);
		await user.type(filterNameInput, 'Edited filter 1');
		const saveButton = screen.getByRole('button', {
			name: 'Save'
		});
		expect(saveButton).toBeEnabled();
		await user.click(saveButton);

		expect(onSave).toHaveBeenCalledWith([{ ...filter1, name: 'Edited filter 1' }, ...otherFilters]);
	});

	it('should call on save with existing filters and new created filter after creating a new filter', async () => {
		const onSave = jest.fn();
		onSave.mockReturnValue(Promise.resolve({}));
		const existingFilters = [mockFilter({ name: 'Filter 1' }), mockFilter({ name: 'Filter 2' })];

		const user = setupTestWithFilters({ filters: existingFilters, onSave });

		expect(await screen.findByText('Filter 1')).toBeVisible();
		const createFilterBtn = await screen.findByRole('button', { name: 'Create' });
		await user.click(createFilterBtn);
		makeAllItemsVisible();
		const createModal = screen.getByTestId('modal');
		expect(createModal).toBeVisible();
		const filterNameInput = screen.getByRole('textbox', {
			name: 'Filter Name*'
		});
		await user.clear(filterNameInput);
		await user.type(filterNameInput, 'My new filter');
		const saveButton = within(createModal).getByRole('button', {
			name: 'Create'
		});
		expect(saveButton).toBeEnabled();
		await user.click(saveButton);

		expect(onSave).toHaveBeenCalledWith([
			...existingFilters,
			expect.objectContaining({ name: 'My new filter' })
		]);
	});

	it('should call on save with new filter when creating a new filter and no initial filters', async () => {
		const onSave = jest.fn();
		onSave.mockReturnValue(Promise.resolve({}));

		const user = setupTestWithFilters({ filters: [], onSave });

		const createFilterBtn = await screen.findByRole('button', { name: 'Create' });
		await user.click(createFilterBtn);
		makeAllItemsVisible();
		const createModal = screen.getByTestId('modal');
		expect(createModal).toBeVisible();
		const filterNameInput = screen.getByRole('textbox', {
			name: 'Filter Name*'
		});
		await user.clear(filterNameInput);
		await user.type(filterNameInput, 'My new filter');
		const saveButton = within(createModal).getByRole('button', {
			name: 'Create'
		});
		expect(saveButton).toBeEnabled();
		await user.click(saveButton);

		expect(onSave).toHaveBeenCalledWith([expect.objectContaining({ name: 'My new filter' })]);
	});

	describe('Move selected filter', () => {
		it('should move filter up when clicking move up button', async () => {
			const onSave = jest.fn();
			onSave.mockReturnValue(Promise.resolve());
			const filter1 = mockFilter({ name: 'Filter 1' });
			const filter2 = mockFilter({ name: 'Filter 2' });
			const existingFilters = [filter1, filter2];

			const user = setupTestWithFilters({ filters: existingFilters, onSave });
			const filter2Component = await screen.findByText('Filter 2');
			await user.hover(filter2Component);
			const moveUp = screen.getByTestId('icon: ArrowheadUpOutline');
			await user.click(moveUp);

			await waitFor(() => {
				expect(onSave).toHaveBeenCalled();
			});

			expect(onSave).toHaveBeenCalledWith([filter2, filter1]);
		});
		it('should move filter down when clicking move down button', async () => {
			const onSave = jest.fn(() => Promise.resolve());
			const filter1 = mockFilter({ name: 'Filter 1' });
			const filter2 = mockFilter({ name: 'Filter 2' });
			const existingFilters = [filter1, filter2];

			const user = setupTestWithFilters({ filters: existingFilters, onSave });

			const filter1Component = await screen.findByText('Filter 1');
			await user.hover(filter1Component);
			const moveUp = screen.getByTestId('icon: ArrowheadDownOutline');
			await user.click(moveUp);

			await waitFor(() => {
				expect(onSave).toHaveBeenCalled();
			});
			expect(onSave).toHaveBeenCalledWith([filter2, filter1]);
		});
	});
});

function setupTestWithFilters({
	filters,
	onSave = jest.fn()
}: {
	filters: Filter[];
	onSave?: (filters: Filter[]) => Promise<void>;
}): UserEvent {
	(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
	const filtersFromAPI: FilterRulesAPIResponse = {
		filterRules: [
			{
				filterRule: filters
			}
		]
	};

	setupTest(
		<MessageFilterTab
			saveFilters={onSave}
			getFilters={() => Promise.resolve(filtersFromAPI)}
			FiltersManagerComponent={getFiltermanager(true)}
		/>
	);
	// See: https://github.com/testing-library/user-event/issues/1187
	return userEvent.setup({ delay: null, skipHover: true });
}
