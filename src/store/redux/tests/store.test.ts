/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { HttpResponse } from 'msw';
import { act } from 'react-dom/test-utils';
import { SearchBackupDeletedMessagesResponse } from '../../../api/search-backup-deleted-messages';
import { createAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { useAppSelector } from '../../../hooks/redux';

import { generateStore } from '../../../tests/generators/store';
import { searchDeletedMessages } from '../../actions/searchInBackup';

describe('store', () => {
	describe('backup search messages slice', () => {
		it('should be initialized correctly', () => {
			const store = generateStore();
			const backupSearchStore = store.getState().backupSearches;
			expect(backupSearchStore).toMatchObject({ messages: {}, status: 'empty' });
		});
		describe('hooks', () => {
			test('handleBackupSearchMessagesReducer should correctly populate the messages property', async () => {
				const getMockedSearchDeletedResponse = (): any => ({
					messages: [
						{
							messageId: '1',
							sender: faker.internet.email(),
							recipient: faker.internet.email(),
							creationDate: faker.date.recent().toString(),
							subject: 'test ciao ciao'
						},
						{
							messageId: '2',
							sender: faker.internet.email(),
							recipient: faker.internet.email(),
							creationDate: faker.date.recent().toString(),
							subject: 'test ciao ciao'
						}
					]
				});

				createAPIInterceptor(
					'get',
					'/zx/backup/v1/searchDeleted',
					HttpResponse.json(getMockedSearchDeletedResponse())
				);

				const store = generateStore();
				await store.dispatch<any>(searchDeletedMessages({ searchString: 'test' }));

				const newBackupSearchStore = await store.getState().backupSearches;
				console.log('newBackupSearchStore', newBackupSearchStore);

				// expect(backupSearchesStore).toMatchObject({ messages: {}, status: 'empty' });
			});
		});
	});
});
