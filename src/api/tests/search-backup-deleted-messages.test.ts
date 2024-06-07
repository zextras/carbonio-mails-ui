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
			'/zx/backup/v1/searchDeleted?before=2022-01-02&after=2022-01-01&searchString=test',
			HttpResponse.json(mockedResponse, { status: 200 })
		);
		const response = await searchBackupDeletedMessagesAPI({
			startDate: '2022-01-01',
			endDate: '2022-01-02',
			searchString: 'test'
		});

		expect(response).toEqual({ data: mockedResponse });
		expect(interceptor.getCalledTimes()).toBe(1);
	});
});
