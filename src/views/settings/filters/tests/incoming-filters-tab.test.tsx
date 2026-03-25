/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, waitFor, within } from '@testing-library/react';
import { Folder, useRootsArray } from '@zextras/carbonio-ui-commons';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { generateFolder } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { Filter } from 'types/filters';
import { IncomingFiltersTab } from 'views/settings/filters/incoming-filters-tab';
import { makeAllItemsVisible, mockFilter } from 'views/settings/filters/tests/test-utils';

vi.mock('@zextras/carbonio-ui-commons', async () => ({
	...(await vi.importActual('@zextras/carbonio-ui-commons')),
	useRootsArray: vi.fn()
}));

describe('Incoming Filters', () => {
	describe('Apply Incoming Filter', () => {
		const TEST_FOLDER_NAME = 'test-folder';
		const OPEN_SELECT_FOLDER_ICON = 'icon: FolderOutline';

		beforeEach(() => {
			createSoapAPIInterceptor('ApplyFilterRules');
		});
		it('should display "Apply" filter button', async () => {
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor([
				mockFilter({ name: 'Filter 1' })
			]);

			setupTest(<IncomingFiltersTab />);
			await getIncomingFiltersInterceptor;

			await act(async () => {
				expect(screen.getByRole('button', { name: 'Apply' })).toBeVisible();
			});
		});

		it('should disable apply filter if no filter is selected', async () => {
			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			setupTest(<IncomingFiltersTab />);
			await getIncomingFiltersInterceptor;

			const applyFilterBtn = await screen.findByRole('button', { name: 'Apply' });

			await act(async () => {
				expect(applyFilterBtn).toBeDisabled();
			});
		});

		it('should open a modal to search for a folder when clicking apply for selected filter', async () => {
			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />);
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });

			await act(async () => {
				expect(selectFolderBtn).toBeInTheDocument();
			});
		});

		it('should disable the select-folder button when no folder is selected during apply filter', async () => {
			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />);
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });

			await act(async () => {
				expect(selectFolderBtn).toBeDisabled();
			});
		});

		it('should add folder chip when a folder is selected', async () => {
			(useRootsArray as Mock).mockReturnValue(
				rootFolderWith([
					generateFolder({
						name: TEST_FOLDER_NAME,
						absFolderPath: `/${TEST_FOLDER_NAME}`
					})
				])
			);

			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />);
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));

			makeAllItemsVisible();
			await user.click(screen.getByText(TEST_FOLDER_NAME));

			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			await act(() => user.click(selectFolderBtn));

			await act(async () => {
				expect(screen.getByTestId('chip')).toBeInTheDocument();
			});
		});

		// FIXME: expectation fails without mocks
		it.skip('should "apply" filters and show the snackbar related to the process started when confirming folder', async () => {
			(useRootsArray as Mock).mockReturnValue(
				rootFolderWith([
					generateFolder({
						name: TEST_FOLDER_NAME,
						absFolderPath: `/${TEST_FOLDER_NAME}`
					})
				])
			);

			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />);
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));
			makeAllItemsVisible();
			await act(() => user.click(screen.getByText(TEST_FOLDER_NAME)));
			const selectFolderBtn = await screen.findByRole('button', { name: /label\.select_folder/i });
			await user.click(selectFolderBtn);
			await user.click(within(screen.getByTestId('modal')).getByRole('button', { name: 'Apply' }));

			await waitFor(async () => {
				expect(
					await screen.findByText(
						"Filter 'Filter 1' is being applied to the messages of the folder '/test-folder'"
					)
				).toBeInTheDocument();
			});
		});

		it('should render message "N messages will be processed inside the selected folder" when folder is selected', async () => {
			const MESSAGE_COUNT = 42;
			(useRootsArray as Mock).mockReturnValue(
				rootFolderWith([
					generateFolder({
						name: TEST_FOLDER_NAME,
						absFolderPath: `/${TEST_FOLDER_NAME}`,
						n: MESSAGE_COUNT
					})
				])
			);

			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />);
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));
			makeAllItemsVisible();
			await user.click(screen.getByText(TEST_FOLDER_NAME));
			await user.click(screen.getByRole('button', { name: /label\.select_folder/i }));
			expect(screen.getByText(`${MESSAGE_COUNT} messages`)).toBeVisible();
			expect(screen.getByText(/will be processed inside the selected folder./i)).toBeVisible();
		});

		it('should render message with singular form for 1 message', async () => {
			const MESSAGE_COUNT = 1;
			(useRootsArray as Mock).mockReturnValue(
				rootFolderWith([
					generateFolder({
						name: TEST_FOLDER_NAME,
						absFolderPath: `/${TEST_FOLDER_NAME}`,
						n: MESSAGE_COUNT
					})
				])
			);

			const filters = [mockFilter({ name: 'Filter 1', active: true })];
			const getIncomingFiltersInterceptor = createGetIncomingFiltersInterceptor(filters);

			const { user } = setupTest(<IncomingFiltersTab />);
			await getIncomingFiltersInterceptor;
			await user.click(await screen.findByText('Filter 1'));
			await user.click(screen.getByText('Apply'));
			await user.click(screen.getByTestId(OPEN_SELECT_FOLDER_ICON));
			makeAllItemsVisible();
			await user.click(screen.getByText(TEST_FOLDER_NAME));
			await user.click(screen.getByRole('button', { name: /label\.select_folder/i }));
			expect(screen.getByText(`${MESSAGE_COUNT} message`)).toBeVisible();
			expect(screen.getByText(/will be processed inside the selected folder./i)).toBeVisible();
		});
	});
});

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
