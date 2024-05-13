/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { generateStore } from '../../../tests/generators/store';
import { searchDeletedMessages } from '../../actions/searchInBackup';

const message1 = {
	messageId: '1',
	sender: faker.internet.email(),
	recipient: faker.internet.email(),
	creationDate: faker.date.recent().toString(),
	subject: 'test subject 1'
};
const message2 = {
	messageId: '2',
	sender: faker.internet.email(),
	recipient: faker.internet.email(),
	creationDate: faker.date.recent().toString(),
	subject: 'test subject 2'
};

const getMockedSearchDeletedResponse = (): any => ({
	messages: [message1, message2]
});

describe('store', () => {
	describe('backup search messages slice', () => {
		it('should be initialized correctly', () => {
			const store = generateStore();
			const backupSearchStore = store.getState().backupSearches;
			expect(backupSearchStore).toMatchObject({ messages: {}, status: 'empty' });
		});
		describe('hooks', () => {
			beforeAll(() => {
				createAPIInterceptor(
					'get',
					'/zx/backup/v1/searchDeleted',
					HttpResponse.json(getMockedSearchDeletedResponse(), { status: 200 })
				);
			});
			it('handleBackupSearchMessagesReducer should correctly populate the messages property', async () => {
				const store = generateStore();
				await store.dispatch<any>(searchDeletedMessages({ searchString: 'test' }));

				const newBackupSearchStore = await store.getState().backupSearches;

				expect(newBackupSearchStore).toMatchObject({
					messages: { [message1.messageId]: message1, [message2.messageId]: message2 },
					status: 'fulfilled'
				});
			});
		});
	});
});
