/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { removeRoute } from '@zextras/carbonio-shell-ui';

import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import { useBackupSearchStore } from '../../../store/zustand/backup-search/store';
import { BackupSearchHeader } from '../parts/backup-search-header';

describe('Backup search header', () => {
	it('renders correctly with queryParams', () => {
		const queryParams = {
			endDate: '2024-05-25T22:12:00.000Z',
			startDate: '2023-04-11T22:12:00.000Z',
			searchString: 'test search string'
		};
		useBackupSearchStore.getState().setQueryParams(queryParams);

		setupTest(<BackupSearchHeader />, {});

		expect(screen.getByText('label.results_for')).toBeInTheDocument();
		expect(screen.getByText('label.start_date: 4/12/2023')).toBeInTheDocument();
		expect(screen.getByText('label.end_date: 5/26/2024')).toBeInTheDocument();
		expect(screen.getByText(queryParams.searchString)).toBeInTheDocument();
	});

	it('should call clearSearchCallback when the clear button is pressed', async () => {
		const queryParams = {
			endDate: '2024-05-25T22:12:00.000Z',
			startDate: '2023-04-11T22:12:00.000Z',
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

		useBackupSearchStore.getState().setQueryParams(queryParams);

		const { user } = setupTest(<BackupSearchHeader />, {});

		const clearButton = screen.getByText('label.clear_search_query');
		await user.click(clearButton);

		expect(removeRoute).toBeCalled();
		expect(removeRoute).toBeCalledTimes(1);

		expect(useBackupSearchStore.getState().queryParams).toEqual({});
		expect(useBackupSearchStore.getState().messages).toEqual({});
	});
});
