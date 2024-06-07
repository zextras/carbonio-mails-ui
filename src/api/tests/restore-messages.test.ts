/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { restoreMessagesAPI } from '../restore-messages';

describe('restorMessagesAPI', () => {
	describe('when backend is available', () => {
		beforeAll(() => {
			createAPIInterceptor(
				'post',
				'/zx/backup/v1/restoreMessages',
				HttpResponse.json({ operationId: 42 }, { status: 202 })
			);
		});

		it('should have property data when the response is 202', async () => {
			const response = await restoreMessagesAPI([faker.number.toString()]);
			expect(response).toHaveProperty('data');
		});
	});

	describe('when backend fails', () => {
		beforeAll(() => {
			createAPIInterceptor(
				'post',
				'/zx/backup/v1/restoreMessages',
				HttpResponse.json(null, { status: 500, statusText: 'Internal Server Error', type: 'error' })
			);
		});

		it('should reply with a status that is not accepted', async () => {
			const response = await restoreMessagesAPI([faker.number.toString()]);
			expect(response).toHaveProperty('error');
		});
	});
});
