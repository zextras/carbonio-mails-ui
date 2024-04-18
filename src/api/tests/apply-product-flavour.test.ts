/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { HttpResponse } from 'msw';
import { createAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { applyProductFlavourAPI } from '../apply-product-flavour';

describe('applyProductFlavourAPI', () => {
	describe('when supported api is not present', () => {
		beforeAll(() => {
			createAPIInterceptor('get', '/zx/auth/supported', HttpResponse.json(null, { type: 'error' }));
		});

		it('should return the community flavour by default', async () => {
			expect(await applyProductFlavourAPI()).toBe('community');
		});
	});

	describe('when advanced is not installed', () => {
		beforeAll(() => {
			createAPIInterceptor('get', '/zx/auth/supported', HttpResponse.json(null, { status: 500 }));
		});

		it('should return the community flavour by default', async () => {
			expect(await applyProductFlavourAPI()).toBe('community');
		});

		it.skip('the store should have the community flavour by default', () => {});
	});

	describe('when advanced is installed', () => {
		it.skip('should return the advance flavour', () => {});
		it.skip('should set the advance flavour into the store', () => {});
	});
});
