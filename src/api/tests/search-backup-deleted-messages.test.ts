/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { searchBackupDeletedMessagesAPI } from '../search-backup-deleted-messages';

describe('search backup deleted messages', () => {
	it('should return the correct response when status is 200', async () => {
		const expectedResponseBody = { data: { messages: [{ id: '1' }] } };
		const apiResponse = { messages: [{ id: '1' }] };
		createAPIInterceptor(
			'get',
			'/zx/backup/v1/searchDeleted',
			HttpResponse.json(apiResponse, { status: 200 })
		);

		expect(await searchBackupDeletedMessagesAPI({})).toMatchObject(expectedResponseBody);
	});

	it('should pass the correct parameters to the fetch call', async () => {
		const mockedResponse = { messages: [{ id: '1' }] };
		const interceptor = createAPIInterceptor(
			'get',
			'/zx/backup/v1/searchDeleted',
			HttpResponse.json(mockedResponse, { status: 200 })
		);
		const response = await searchBackupDeletedMessagesAPI({
			startDate: new Date('2022-01-05T00:00:00.000+02:00'),
			endDate: new Date('2022-01-06T00:00:00.000+02:00'),
			searchString: 'test'
		});

		expect(response).toEqual({ data: mockedResponse });
		expect(interceptor.getCalledTimes()).toBe(1);
		expect(interceptor.getLastRequest().url).toBe(
			'http://localhost/zx/backup/v1/searchDeleted?' +
				'after=2022-01-04T22%3A00%3A00.000Z&' +
				'before=2022-01-05T22%3A00%3A00.000Z&' +
				'searchString=test'
		);
	});
});
