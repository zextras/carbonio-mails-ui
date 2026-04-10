/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { restoreMessagesApi } from 'api/restore-messages-api';

describe('restoreMessagesAPI', () => {
	describe('when backend is available', () => {
		it('should reply with a status that is accepted', async () => {
			createAPIInterceptor(
				'post',
				'/zx/backup/v1/restoreMessages',
				new HttpResponse(null, { status: 204 })
			);
			const response = await restoreMessagesApi([faker.number.toString()]);
			expect(response).toEqual({});
			expect(response).not.toHaveProperty('error');
		});
	});

	describe('when backend fails', () => {
		beforeAll(() => {
			createAPIInterceptor('post', '/zx/backup/v1/restoreMessages', HttpResponse.error());
		});

		it('should reply with a status that is not accepted', async () => {
			const response = await restoreMessagesApi([faker.number.toString()]);
			expect(response).toHaveProperty('error');
		});
	});
});
