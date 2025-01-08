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
import { t } from '@zextras/carbonio-shell-ui';

import * as folderHooks from '../../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { generateFolder } from '../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import {
	makeListItemsVisible,
	setupTest
} from '../../../../../carbonio-ui-commons/test/test-setup';
import type { Folder } from '../../../../../carbonio-ui-commons/types';
import { generateStore } from '../../../../../tests/generators/store';
import { MailsStateType } from '../../../../../types';
import { FilterListType } from '../../../../../types/filters';
import { ListType } from '../actions';
import { FilterContext } from '../filter-context';
import IncomingFilterActions from '../incoming-filters-actions';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

const createSnackbarSpy = jest.fn((arg) => arg);

describe('incoming filters actions', () => {
	describe('apply filters to folder button', () => {
		const TEST_FOLDER_NAME = 'test-folder';
		const OPEN_SELECT_FOLDER_ICON = 'icon: FolderOutline';
		let store: EnhancedStore<MailsStateType>;

		beforeEach(() => {
			store = generateStore();
			(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
			createSoapAPIInterceptor('ApplyFilterRules');
		});

		it('should disable apply filter if no filter is selected', async () => {
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: false });
			setupTest(<IncomingFilterActions compProps={props} />, { store });

			const applyFilterBtn = await screen.findByRole('button', { name: /filters\.apply/i });
			expect(applyFilterBtn).toBeDisabled();
		});

		it('should open a modal to search for a folder when clicking apply for selected filter', async () => {
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions compProps={props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			expect(selectFolderBtn).toBeInTheDocument();
		});

		it('should disable the select-folder button when no folder is selected', async () => {
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions compProps={props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			expect(selectFolderBtn).toBeDisabled();
		});

		it('should add folder chip when a folder is selected', async () => {
			mockFoldersToReturnASingleFolder(TEST_FOLDER_NAME);
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions compProps={props} />, { store });

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
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions compProps={props} />, { store });

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

	test('modify filter should call Modify Filter API with all incoming filters', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const otherFilter = activeIncomingFilter('Other filter');
		const myFilter = activeIncomingFilter('My filter');
		const incomingFilters = [otherFilter, myFilter];
		const activeList = createList(incomingFilters, 'My filter');
		const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const props = { t, availableList, activeList, incomingFilters };

		const { user } = setupTest(
			<FilterContext.Provider
				value={{
					incomingFilters,
					incomingLoading: true,
					setFetchIncomingFilters: jest.fn(),
					outgoingFilters: [],
					outgoingLoading: false,
					moveUp: jest.fn(),
					setIncomingFilters: jest.fn(),
					setOutgoingFilters: jest.fn(),
					setFetchOutgoingFilters: jest.fn()
				}}
			>
				<IncomingFilterActions compProps={props} />
			</FilterContext.Provider>,
			{ store }
		);
		const modifyFilterBtn = await screen.findByRole('button', { name: /label\.edit/i });
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

		const request = await modifyFilterRulesInterceptor;
		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
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
					]
				}
			]
		});
	});

	test('delete filter should call Modify Filter API without the deleted filter', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const otherFilter = activeIncomingFilter('Other filter');
		const myFilter = activeIncomingFilter('My filter');
		const incomingFilters = [otherFilter, myFilter];
		const activeList = createList(incomingFilters, 'My filter');
		const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const props = { t, availableList, activeList, incomingFilters };

		const { user } = setupTest(
			<FilterContext.Provider
				value={{
					incomingFilters,
					incomingLoading: true,
					setFetchIncomingFilters: jest.fn(),
					outgoingFilters: [],
					outgoingLoading: false,
					moveUp: jest.fn(),
					setIncomingFilters: jest.fn(),
					setOutgoingFilters: jest.fn(),
					setFetchOutgoingFilters: jest.fn()
				}}
			>
				<IncomingFilterActions compProps={props} />
			</FilterContext.Provider>,
			{ store }
		);

		const deleteFilterBtn = await screen.findByRole('button', { name: /label\.delete/i });
		await user.click(deleteFilterBtn);
		makeAllItemsVisible();
		const modal = screen.getByTestId('modal');
		expect(modal).toBeVisible();
		await act(async () => {
			await user.click(
				within(modal).getByRole('button', {
					name: 'label.delete'
				})
			);
		});
		const request = await modifyFilterRulesInterceptor;

		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [otherFilter]
				}
			]
		});
	});

	test('remove filter should call Modify Filter API with the removed filter', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const availableList = createList([]);
		const otherFilter = activeIncomingFilter('Other filter');
		const myFilter = activeIncomingFilter('My filter');
		const incomingFilters = [otherFilter, myFilter];
		const activeList = createList(incomingFilters, 'My filter');
		const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const props = { t, availableList, activeList, incomingFilters };

		const { user } = setupTest(
			<FilterContext.Provider
				value={{
					incomingFilters,
					incomingLoading: true,
					setFetchIncomingFilters: jest.fn(),
					outgoingFilters: [],
					outgoingLoading: false,
					moveUp: jest.fn(),
					setIncomingFilters: jest.fn(),
					setOutgoingFilters: jest.fn(),
					setFetchOutgoingFilters: jest.fn()
				}}
			>
				<IncomingFilterActions compProps={props} />
			</FilterContext.Provider>,
			{ store }
		);

		const removeFilterBtn = await screen.findByRole('button', { name: /label\.remove/i });
		await user.click(removeFilterBtn);

		const request = await modifyFilterRulesInterceptor;

		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [otherFilter, { ...myFilter, active: false }]
				}
			]
		});
	});
	test('add filter should call Modify Filter API with the added filter', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const firstFilter = { ...activeIncomingFilter('First filter'), active: false };
		const secondFilter = { ...activeIncomingFilter('Second filter'), active: false };
		const availableList = createList([firstFilter, secondFilter], 'First filter');

		const thirdFilter = { ...activeIncomingFilter('Third filter'), active: true };
		const fourthFilter = { ...activeIncomingFilter('Third filter'), active: true };
		const activeList = createList([thirdFilter, fourthFilter]);

		const incomingFilters = [firstFilter, secondFilter, thirdFilter, fourthFilter];
		const modifyFilterRulesInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const props = { t, availableList, activeList, incomingFilters };

		const { user } = setupTest(
			<FilterContext.Provider
				value={{
					incomingFilters,
					incomingLoading: true,
					setFetchIncomingFilters: jest.fn(),
					outgoingFilters: [],
					outgoingLoading: false,
					moveUp: jest.fn(),
					setIncomingFilters: jest.fn(),
					setOutgoingFilters: jest.fn(),
					setFetchOutgoingFilters: jest.fn()
				}}
			>
				<IncomingFilterActions compProps={props} />
			</FilterContext.Provider>,
			{ store }
		);

		const addFilterBtn = await screen.findByRole('button', { name: /label\.add/i });
		await user.click(addFilterBtn);

		const request = await modifyFilterRulesInterceptor;

		expect(request).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [thirdFilter, fourthFilter, { ...firstFilter, active: true }, secondFilter]
				}
			]
		});
	});
});

it('should close the modal', async () => {
	const store = generateStore();
	(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
	const availableList = createList([]);
	const myFilter = activeIncomingFilter('My filter');
	const incomingFilters = [myFilter];
	const activeList = createList(incomingFilters, 'My filter');
	const props = { t, availableList, activeList, incomingFilters };

	const { user } = setupTest(
		<FilterContext.Provider
			value={{
				incomingFilters,
				incomingLoading: true,
				setFetchIncomingFilters: jest.fn(),
				outgoingFilters: [],
				outgoingLoading: false,
				moveUp: jest.fn(),
				setIncomingFilters: jest.fn(),
				setOutgoingFilters: jest.fn(),
				setFetchOutgoingFilters: jest.fn()
			}}
		>
			<IncomingFilterActions compProps={props} />
		</FilterContext.Provider>,
		{ store }
	);

	await user.click(screen.getByRole('button', { name: /label\.create/i }));
	makeAllItemsVisible();
	expect(screen.getByTestId('modal')).toBeVisible();
	await user.click(screen.getByTestId('icon: CloseOutline'));
	expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function propsWithIncomingFilter({ name, isSelected }: { name: string; isSelected: boolean }) {
	return {
		t,
		availableList: createList([]),
		activeList: createList([activeIncomingFilter(name)], isSelected ? name : undefined),
		incomingFilters: [activeIncomingFilter('test')]
	};
}

function createList(filterList: FilterListType[], selectedName?: string): ListType {
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

function activeIncomingFilter(name: string): FilterListType {
	return {
		id: name,
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
				actionKeep: [{ index: 0 }],
				actionStop: [{ index: 1 }]
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
