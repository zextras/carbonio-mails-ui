/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { searchBackupDeletedMessagesAPI } from '../search-backup-deleted-messages';

describe('search backup deleted messages', () => {
	describe('when backend is available', () => {
		const responseBody = { messages: [{ id: '1' }] };
		beforeAll(() => {
			createAPIInterceptor(
				'get',
				'/zx/backup/v1/searchDeleted',
				HttpResponse.json(responseBody, { status: 200 })
			);
		});

		it('should return the reponse returned by fetch', async () => {
			expect(await searchBackupDeletedMessagesAPI({})).toMatchObject({
				response: responseBody
			});
		});
	});

	describe('when backend fails', () => {
		beforeAll(() => {
			createAPIInterceptor(
				'get',
				'/zx/backup/v1/searchDeleted',
				HttpResponse.json(null, { status: 500 })
			);
		});

		it('should reply with an error message', async () => {
			expect(await searchBackupDeletedMessagesAPI({})).toThrow(
				'Something went wrong with the search inside the backup'
			);
		});
	});
});
