/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { EnhancedStore } from '@reduxjs/toolkit';
import { act, screen } from '@testing-library/react';
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
import IncomingFilterActions from '../incoming-filters-actions';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

const createSnackbarSpy = jest.fn((arg) => arg);

describe('incoming filters actions', () => {
	describe('apply filters', () => {
		const TEST_FOLDER_NAME = 'test-folder';
		const OPEN_SELECT_FOLDER_ICON = 'icon: FolderOutline';
		let store: EnhancedStore<MailsStateType>;

		beforeEach(() => {
			store = generateStore();
			(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
			createSoapAPIInterceptor('ApplyFilterRules');
		});

		test('should disable apply filter if no filter is selected', async () => {
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: false });
			setupTest(<IncomingFilterActions compProps={props} />, { store });

			const applyFilterBtn = await screen.findByRole('button', { name: /filters\.apply/i });
			expect(applyFilterBtn).toBeDisabled();
		});

		test('should open a modal to search for a folder', async () => {
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions compProps={props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			expect(selectFolderBtn).toBeInTheDocument();
		});

		test('should disable the select-folder button when no folder is selected', async () => {
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions compProps={props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			expect(selectFolderBtn).toBeDisabled();
		});

		test('should add folder chip when a folder is selected', async () => {
			mockFoldersToReturnASingleFolder(TEST_FOLDER_NAME);
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions compProps={props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			makeAllListItemsVisible();
			await act(() => user.click(screen.getByText(TEST_FOLDER_NAME)));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			await act(() => user.click(selectFolderBtn));

			expect(screen.getByTestId('chip')).toBeInTheDocument();
		});

		test('should apply filters and show the snackbar related to the process started', async () => {
			mockFoldersToReturnASingleFolder(TEST_FOLDER_NAME);
			const props = propsWithIncomingFilter({ name: 'filter', isSelected: true });
			const { user } = setupTest(<IncomingFilterActions compProps={props} />, { store });

			await act(() => user.click(screen.getByText(/filters\.apply/i)));
			await act(() => user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON)));

			makeAllListItemsVisible();
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

function makeAllListItemsVisible(): void {
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
