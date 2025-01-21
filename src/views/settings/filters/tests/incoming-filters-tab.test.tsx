/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { useSnackbar } from '@zextras/carbonio-design-system';

import * as folderHooks from '../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { generateFolder } from '../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../tests/generators/store';
import { Filter, type Folder } from '../../../../types';
import { IncomingFiltersTab } from '../incoming-filters-tab';
import { makeAllItemsVisible, mockFilter } from './test-utils';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

describe('Incoming Filters', () => {
	describe('Apply Incoming Filter', () => {
		const TEST_FOLDER_NAME = 'test-folder';
		const OPEN_SELECT_FOLDER_ICON = 'icon: FolderOutline';

		beforeEach(() => {
			(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
			createSoapAPIInterceptor('ApplyFilterRules');
		});
		it('should display "Apply" filter button', async () => {
			const store = generateStore();
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor([
				mockFilter({ name: 'Filter 1' })
			]);

			setupTest(<IncomingFiltersTab />, { store });
			await getIncomingFiltersInterceptor;

			expect(screen.getByRole('button', { name: 'Apply' })).toBeVisible();
		});

		it('should disable apply filter if no filter is selected', async () => {
			const store = generateStore();
			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			setupTest(<IncomingFiltersTab />, { store });
			await getIncomingFiltersInterceptor;

			const applyFilterBtn = await screen.findByRole('button', { name: 'Apply' });
			expect(applyFilterBtn).toBeDisabled();
		});

		it('should open a modal to search for a folder when clicking apply for selected filter', async () => {
			const store = generateStore();
			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />, { store });
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			expect(selectFolderBtn).toBeInTheDocument();
		});

		it('should disable the select-folder button when no folder is selected during apply filter', async () => {
			const store = generateStore();
			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />, { store });
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			expect(selectFolderBtn).toBeDisabled();
		});

		it('should add folder chip when a folder is selected', async () => {
			mockFoldersToReturnASingleFolder(TEST_FOLDER_NAME);
			const store = generateStore();
			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />, { store });
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));

			makeAllItemsVisible();
			await user.click(screen.getByText(TEST_FOLDER_NAME));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			await act(() => user.click(selectFolderBtn));

			expect(screen.getByTestId('chip')).toBeInTheDocument();
		});

		it('should "apply" filters and show the snackbar related to the process started when confirming folder', async () => {
			mockFoldersToReturnASingleFolder(TEST_FOLDER_NAME);
			const store = generateStore();
			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />, { store });
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));
			makeAllItemsVisible();
			await act(() => user.click(screen.getByText(TEST_FOLDER_NAME)));
			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			await user.click(selectFolderBtn);
			await user.click(within(screen.getByTestId('modal')).getByRole('button', { name: 'Apply' }));

			expect(createSnackbarSpy).toHaveBeenCalledWith({
				autoHideTimeout: 3000,
				hideButton: true,
				key: 'applyFilter-Filter 1-started',
				label: "Filter 'Filter 1' is being applied to the messages of the folder '/test-folder'",
				replace: true,
				severity: 'info'
			});
		});
	});
});

const createSnackbarSpy = jest.fn((arg) => arg);

const createGetIncomingFiltersInterceptor = (
	filters: Array<Filter>
): ReturnType<typeof createSoapAPIInterceptor> =>
	createSoapAPIInterceptor('GetFilterRules', {
		_jsns: 'urn:zimbraMail',
		filterRules: [
			{
				filterRule: filters
			}
		]
	});

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
