/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { advancedAccountApi } from 'api/advanced-account-api';
import { useAdvancedAccountStore } from 'store/advanced-account/store';

const api = '/zx/login/v3/account';
describe('advancedAccountAPI', () => {
	describe('when the api call fails', () => {
		beforeEach(() => {
			createAPIInterceptor('get', api, HttpResponse.json(null, { type: 'error' }));
		});

		it('should return backupSelfUndeleteAllowed false', async () => {
			expect((await advancedAccountApi()).backupSelfUndeleteAllowed).toBe(false);
		});

		it('the store should have backupSelfUndeleteAllowed property set as false by default', async () => {
			await advancedAccountApi();

			expect(useAdvancedAccountStore.getState().backupSelfUndeleteAllowed).toBe(false);
		});
	});

	describe('when advanced is not installed', () => {
		beforeEach(() => {
			createAPIInterceptor('get', api, HttpResponse.json(null, { status: 500 }));
		});

		it('should return backupSelfUndeleteAllowed false', async () => {
			expect((await advancedAccountApi()).backupSelfUndeleteAllowed).toBe(false);
		});

		it('the store should have backupSelfUndeleteAllowed property set as false by default', async () => {
			await advancedAccountApi();

			expect(useAdvancedAccountStore.getState().backupSelfUndeleteAllowed).toBe(false);
		});
	});

	describe('when admin allows backup self undelete', () => {
		beforeEach(() => {
			createAPIInterceptor(
				'get',
				api,
				HttpResponse.json({ backupSelfUndeleteAllowed: true }, { status: 200 })
			);
		});

		it('should return backupSelfUndeleteAllowed true', async () => {
			expect((await advancedAccountApi()).backupSelfUndeleteAllowed).toBe(true);
		});

		it('should set backupSelfUndeleteAllowed to true in the advanceAccount store', async () => {
			await advancedAccountApi();

			expect(useAdvancedAccountStore.getState().backupSelfUndeleteAllowed).toBe(true);
		});
	});

	describe('when admin denies backup self undelete', () => {
		beforeEach(() => {
			createAPIInterceptor(
				'get',
				api,
				HttpResponse.json({ backupSelfUndeleteAllowed: false }, { status: 200 })
			);
		});

		it('should return backupSelfUndeleteAllowed false', async () => {
			expect((await advancedAccountApi()).backupSelfUndeleteAllowed).toBe(false);
		});

		it('should set backupSelfUndeleteAllowed to false in the advanceAccount store', async () => {
			await advancedAccountApi();

			expect(useAdvancedAccountStore.getState().backupSelfUndeleteAllowed).toBe(false);
		});
	});
});
