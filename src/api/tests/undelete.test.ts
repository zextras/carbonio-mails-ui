/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { restoreMessagesAPI } from '../restore-messages';

describe('undeleteAPI', () => {
	describe('when backend is available', () => {
		beforeAll(() => {
			createAPIInterceptor(
				'post',
				'/zx/backup/v1/undelete?start=2007-11-03T10:15:30.00Z&end=2007-12-03T10:15:30.00Z',
				HttpResponse.json({ operationId: 42 }, { status: 202 })
			);
		});

		it('should return the reponse returned by fetch', async () => {
			expect(
				(await restoreMessagesAPI('2007-11-03T10:15:30.00Z', '2007-12-03T10:15:30.00Z')).status
			).toBe(202);
		});
	});

	describe('when backend fails', () => {
		beforeAll(() => {
			createAPIInterceptor(
				'post',
				'/zx/backup/v1/undelete',
				HttpResponse.json(null, { status: 500 })
			);
		});

		it('should reply with a status that is not accepted', async () => {
			expect(
				(await restoreMessagesAPI('2007-11-03T10:15:30.00Z', '2007-12-03T10:15:30.00Z')).status
			).not.toBe(202);
		});
	});
});
