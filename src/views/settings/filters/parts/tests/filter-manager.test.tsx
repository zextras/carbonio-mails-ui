/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, screen, within } from '@testing-library/react';
import { useSnackbar } from '@zextras/carbonio-design-system';

import { makeListItemsVisible, setupTest } from '@zextras/carbonio-ui-commons';
import { Filter } from '../../../../../types';
import { ListType } from '../actions';
import { getFiltermanager } from '../filter-manager';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

const createSnackbarSpy = jest.fn((arg) => arg);
const IncomingFilterActions = getFiltermanager(true);

describe('incoming filters actions', () => {
	it('should close the create filter modal', async () => {
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const myFilter = activeIncomingFilter('My filter');
		const filters = [myFilter];
		const activeList = createList(filters, 'My filter');
		const props = {
			availableList,
			activeList,
			filters,
			onFiltersSave: jest.fn()
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />);

		await user.click(screen.getByRole('button', { name: 'Create' }));
		makeAllItemsVisible();
		expect(screen.getByTestId('modal')).toBeVisible();
		await user.click(screen.getByTestId('icon: CloseOutline'));
		expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
	});

	test('modify filter should save filters with all incoming filters', async () => {
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const otherFilter = activeIncomingFilter('Other filter');
		const myFilter = activeIncomingFilter('My filter');
		const filters = [otherFilter, myFilter];
		const activeList = createList(filters, 'My filter');
		const mockSave = jest.fn(() => Promise.resolve());
		const props = {
			availableList,
			activeList,
			filters,
			onFiltersSave: mockSave
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />);
		const modifyFilterBtn = await screen.findByRole('button', { name: 'Edit' });
		await user.click(modifyFilterBtn);
		makeAllItemsVisible();
		expect(screen.getByTestId('modal')).toBeVisible();
		const filterNameInput = screen.getByRole('textbox', {
			name: 'Filter Name*'
		});
		await user.clear(filterNameInput);
		await user.type(filterNameInput, 'Edited filter');
		const saveButton = screen.getByRole('button', {
			name: 'Save'
		});
		expect(saveButton).toBeEnabled();
		await act(async () => {
			await user.click(saveButton);
		});

		expect(mockSave).toHaveBeenCalledWith([
			otherFilter,
			{
				active: true,
				filterActions: [
					{
						actionKeep: [{}],
						actionStop: [{}]
					}
				],
				filterTests: [
					{
						condition: 'anyof',
						headerTest: [
							{
								header: 'subject',
								stringComparison: 'contains',
								testName: 'headerTest',
								value: 'testddsareafreafdastewa'
							}
						]
					}
				],
				name: 'Edited filter'
			}
		]);
	});

	test('delete filter should save filters without the deleted filter', async () => {
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const otherFilter = activeIncomingFilter('Other filter');
		const myFilter = activeIncomingFilter('My filter');
		const filters = [otherFilter, myFilter];
		const activeList = createList(filters, 'My filter');
		const mockSave = jest.fn(() => Promise.resolve());
		const props = {
			availableList,
			activeList,
			filters,
			onFiltersSave: mockSave
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />);

		const deleteFilterBtn = await screen.findByRole('button', { name: 'Delete' });
		await user.click(deleteFilterBtn);
		makeAllItemsVisible();
		const modal = screen.getByTestId('modal');
		expect(modal).toBeVisible();
		await act(async () => {
			await user.click(
				within(modal).getByRole('button', {
					name: 'Delete'
				})
			);
		});

		expect(mockSave).toHaveBeenCalledWith([otherFilter]);
	});

	test('remove filter should save filters without the removed filter', async () => {
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const otherFilter = activeIncomingFilter('Other filter');
		const myFilter = activeIncomingFilter('My filter');
		const filters = [otherFilter, myFilter];
		const activeList = createList(filters, 'My filter');
		const mockSave = jest.fn(() => Promise.resolve());
		const props = {
			availableList,
			activeList,
			filters,
			onFiltersSave: mockSave
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />);

		const removeFilterBtn = await screen.findByRole('button', { name: 'Remove' });
		await user.click(removeFilterBtn);

		expect(mockSave).toHaveBeenCalledWith([otherFilter, { ...myFilter, active: false }]);
	});
	test('add filter should save filters with the added filter', async () => {
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const firstFilter = { ...activeIncomingFilter('First filter'), active: false };
		const secondFilter = { ...activeIncomingFilter('Second filter'), active: false };
		const availableList = createList([firstFilter, secondFilter], 'First filter');

		const thirdFilter = { ...activeIncomingFilter('Third filter'), active: true };
		const fourthFilter = { ...activeIncomingFilter('Third filter'), active: true };
		const activeList = createList([thirdFilter, fourthFilter]);
		const filters = [firstFilter, secondFilter, thirdFilter, fourthFilter];
		const mockSave = jest.fn(() => Promise.resolve());
		const props = {
			availableList,
			activeList,
			filters,
			onFiltersSave: mockSave
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />);

		const addFilterBtn = await screen.findByRole('button', { name: 'Add' });
		await user.click(addFilterBtn);

		expect(mockSave).toHaveBeenCalledWith([
			thirdFilter,
			fourthFilter,
			{ ...firstFilter, active: true },
			secondFilter
		]);
	});
});

function createList(filterList: Filter[], selectedName?: string): ListType {
	const selected = (selectedName && { [selectedName]: true }) || {};

	return {
		isSelecting: false,
		list: filterList,
		moveDown: jest.fn(),
		moveUp: jest.fn(),
		selected,
		toggle: jest.fn(),
		unSelect: jest.fn()
	};
}

function activeIncomingFilter(name: string): Filter {
	return {
		name,
		active: true,
		filterTests: [
			{
				condition: 'anyof',
				headerTest: [
					{
						header: 'subject',
						stringComparison: 'contains',
						value: 'testddsareafreafdastewa'
					}
				]
			}
		],
		filterActions: [
			{
				actionKeep: [{}],
				actionStop: [{}]
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
