/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { removeRoute } from '@zextras/carbonio-shell-ui';
import * as hooks from '@zextras/carbonio-shell-ui';

import { generateSettings } from '../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';
import { BackupSearchHeader } from '../parts/backup-search-header';

describe('Backup search header', () => {
	it('renders correctly queryParams with italian locale', () => {
		const settings = generateSettings({
			prefs: {
				zimbraPrefLocale: 'it-IT'
			}
		});

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const queryParams = {
			endDate: new Date('2024-05-25T22:00:00.000Z'),
			startDate: new Date('2023-04-11T22:00:00.000Z'),
			searchString: 'test search string'
		};
		useBackupSearchStore.getState().setSearchParams(queryParams);

		setupTest(<BackupSearchHeader />, {});

		expect(screen.getByText('label.results_for')).toBeInTheDocument();
		expect(screen.getByText('label.start_date: 12/04/2023')).toBeInTheDocument();
		expect(screen.getByText('label.end_date: 26/05/2024')).toBeInTheDocument();
		expect(screen.getByText(queryParams.searchString)).toBeInTheDocument();
	});

	it('renders correctly queryParams with US locale', () => {
		const settings = generateSettings({
			prefs: {
				zimbraPrefLocale: 'en-US'
			}
		});

		jest.spyOn(hooks, 'useUserSettings').mockReturnValue(settings);

		const queryParams = {
			endDate: new Date('2024-05-25T22:00:00.000Z'),
			startDate: new Date('2023-04-11T22:00:00.000Z'),
			searchString: 'test search string'
		};
		useBackupSearchStore.getState().setSearchParams(queryParams);

		setupTest(<BackupSearchHeader />, {});

		expect(screen.getByText('label.results_for')).toBeInTheDocument();
		expect(screen.getByText('label.start_date: 4/12/2023')).toBeInTheDocument();
		expect(screen.getByText('label.end_date: 5/26/2024')).toBeInTheDocument();
		expect(screen.getByText(queryParams.searchString)).toBeInTheDocument();
	});

	it('should call clearSearchCallback when the clear button is pressed', async () => {
		const queryParams = {
			endDate: new Date('2024-05-25T22:12:00.000Z'),
			startDate: new Date('2023-04-11T22:12:00.000Z'),
			searchString: 'test search string'
		};
		const messages = [
			{
				messageId: '1',
				folderId: 'folder 1',
				owner: 'francesco',
				creationDate: '2024-03-01T12:00:00Z',
				deletionDate: '2024-06-12T12:00:00Z',
				subject: 'subject',
				sender: 'francesco@example.com',
				to: 'giuliano@example.com',
				fragment:
					'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Aliquid repellat officia'
			}
		];
		useBackupSearchStore.getState().setMessages(messages);
		useBackupSearchStore.getState().setSearchParams(queryParams);

		const { user } = setupTest(<BackupSearchHeader />, {});

		const clearButton = screen.getByText('label.clear_search_query');
		await user.click(clearButton);

		expect(removeRoute).toHaveBeenCalled();
		expect(removeRoute).toHaveBeenCalledTimes(1);

		expect(useBackupSearchStore.getState().searchParams).toEqual({});
		expect(useBackupSearchStore.getState().messages).toEqual({});
	});
});
