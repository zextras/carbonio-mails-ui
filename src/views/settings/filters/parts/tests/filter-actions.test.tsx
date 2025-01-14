/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { EnhancedStore } from '@reduxjs/toolkit';
import { act, screen, within } from '@testing-library/react';
import { useSnackbar } from '@zextras/carbonio-design-system';

import * as folderHooks from '../../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { generateFolder } from '../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import {
	makeListItemsVisible,
	setupTest
} from '../../../../../carbonio-ui-commons/test/test-setup';
import type { Folder } from '../../../../../carbonio-ui-commons/types';
import { generateStore } from '../../../../../tests/generators/store';
import { MailsStateType, Filter } from '../../../../../types';
import { ListType } from '../actions';
import { FilterActionProps, getFilterActions } from '../filter-actions';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

const createSnackbarSpy = jest.fn((arg) => arg);
const mockSave = jest.fn();
mockSave.mockReturnValue(Promise.resolve());
const IncomingFilterActions = getFilterActions(true, mockSave);

describe('incoming filters actions', () => {
	it('should close the create filter modal', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const myFilter = activeIncomingFilter('My filter');
		const filters = [myFilter];
		const activeList = createList(filters, 'My filter');
		const props = {
			availableList,
			activeList,
			filters,
			setFetchFilters: jest.fn(),
			setFilters: jest.fn()
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />, { store });

		await user.click(screen.getByRole('button', { name: 'Create' }));
		makeAllItemsVisible();
		expect(screen.getByTestId('modal')).toBeVisible();
		await user.click(screen.getByTestId('icon: CloseOutline'));
		expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
	});
	describe.skip('apply filters to folder button', () => {
		const TEST_FOLDER_NAME = 'test-folder';
		const OPEN_SELECT_FOLDER_ICON = 'icon: FolderOutline';
		let store: EnhancedStore<MailsStateType>;

		beforeEach(() => {
			store = generateStore();
			(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
			createSoapAPIInterceptor('ApplyFilterRules');
		});

		it('should disable apply filter if no filter is selected', async () => {
			const props = propsWithFilter({ name: 'filter', isSelected: false });
			setupTest(<IncomingFilterActions {...props} />, { store });

			const applyFilterBtn = await screen.findByRole('button', { name: /filters\.apply/i });
			expect(applyFilterBtn).toBeDisabled();
		});

		it('should open a modal to search for a folder when clicking apply for selected filter', async () => {
			const props = propsWithFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions {...props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			expect(selectFolderBtn).toBeInTheDocument();
		});

		it('should disable the select-folder button when no folder is selected', async () => {
			const props = propsWithFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions {...props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			expect(selectFolderBtn).toBeDisabled();
		});

		it('should add folder chip when a folder is selected', async () => {
			mockFoldersToReturnASingleFolder(TEST_FOLDER_NAME);
			const props = propsWithFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions {...props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			makeAllItemsVisible();
			await act(() => user.click(screen.getByText(TEST_FOLDER_NAME)));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			await act(() => user.click(selectFolderBtn));

			expect(screen.getByTestId('chip')).toBeInTheDocument();
		});

		it('should apply filters and show the snackbar related to the process started when confirming folder', async () => {
			mockFoldersToReturnASingleFolder(TEST_FOLDER_NAME);
			const props = propsWithFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions {...props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			makeAllItemsVisible();
			await act(() => user.click(screen.getByText(TEST_FOLDER_NAME)));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			await act(() => user.click(selectFolderBtn));

			await act(() => user.click(screen.getByText(/modals\.apply_filters\.button_apply/i)));

			expect(createSnackbarSpy).toHaveBeenCalledWith({
				autoHideTimeout: 3000,
				hideButton: true,
				key: 'applyFilter-filter-started',
				label: 'messages.snackbar.apply_filter_rules_started',
				replace: true,
				severity: 'info'
			});
		});
	});

	test('modify filter should save filters with all incoming filters', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const otherFilter = activeIncomingFilter('Other filter');
		const myFilter = activeIncomingFilter('My filter');
		const filters = [otherFilter, myFilter];
		const activeList = createList(filters, 'My filter');
		const props = {
			availableList,
			activeList,
			filters,
			setFetchFilters: jest.fn(),
			setFilters: jest.fn()
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />, { store });
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
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const otherFilter = activeIncomingFilter('Other filter');
		const myFilter = activeIncomingFilter('My filter');
		const filters = [otherFilter, myFilter];
		const activeList = createList(filters, 'My filter');
		const props = {
			availableList,
			activeList,
			filters,
			setFetchFilters: jest.fn(),
			setFilters: jest.fn()
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />, { store });

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
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const otherFilter = activeIncomingFilter('Other filter');
		const myFilter = activeIncomingFilter('My filter');
		const filters = [otherFilter, myFilter];
		const activeList = createList(filters, 'My filter');
		const props = {
			availableList,
			activeList,
			filters,
			setFetchFilters: jest.fn(),
			setFilters: jest.fn()
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />, { store });

		const removeFilterBtn = await screen.findByRole('button', { name: 'Remove' });
		await user.click(removeFilterBtn);

		expect(mockSave).toHaveBeenCalledWith([otherFilter, { ...myFilter, active: false }]);
	});
	test('add filter should save filters with the added filter', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const firstFilter = { ...activeIncomingFilter('First filter'), active: false };
		const secondFilter = { ...activeIncomingFilter('Second filter'), active: false };
		const availableList = createList([firstFilter, secondFilter], 'First filter');

		const thirdFilter = { ...activeIncomingFilter('Third filter'), active: true };
		const fourthFilter = { ...activeIncomingFilter('Third filter'), active: true };
		const activeList = createList([thirdFilter, fourthFilter]);
		const filters = [firstFilter, secondFilter, thirdFilter, fourthFilter];
		const props = {
			availableList,
			activeList,
			filters,
			setFetchFilters: jest.fn(),
			setFilters: jest.fn()
		};

		const { user } = setupTest(<IncomingFilterActions {...props} />, { store });

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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function propsWithFilter({
	name,
	isSelected
}: {
	name: string;
	isSelected: boolean;
}): FilterActionProps {
	return {
		availableList: createList([]),
		activeList: createList([activeIncomingFilter(name)], isSelected ? name : undefined),
		filters: [activeIncomingFilter('test')],
		setFetchFilters: jest.fn(),
		setFilters: jest.fn()
	};
}

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

function rootFolderWith(children: Array<Folder>): Array<Folder> {
	return [
		{
			uuid: '1',
			id: '1',
			name: 'USER_ROOT',
			checked: false,
			activesyncdisabled: false,
			recursive: false,
			deletable: false,
			isLink: false,
			children,
			depth: 0
		}
	];
}

function makeAllItemsVisible(): void {
	makeListItemsVisible();
	act(() => {
		jest.advanceTimersByTime(1000);
	});
}

function mockFoldersToReturnASingleFolder(folderName: string): void {
	jest.spyOn(folderHooks, 'useRootsArray').mockReturnValue(
		rootFolderWith([
			generateFolder({
				name: folderName,
				absFolderPath: `/${folderName}`
			})
		])
	);
}
