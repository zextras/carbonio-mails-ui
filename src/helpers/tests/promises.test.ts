/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isFulfilled, isRejected } from '../promises';

describe('Promises helpers functions', () => {
	describe('PromiseSettledResult', () => {
		describe('isFulfilled', () => {
			it('should return false if the given promise is rejected', async () => {
				const promise = Promise.reject(new Error('Bad error'));
				const settledPromises = await Promise.allSettled<unknown>([promise]);

				settledPromises.forEach((settledPromise) => {
					expect(isFulfilled(settledPromise)).toBeFalsy();
				});
			});

			it('should return true if the given promise is fulfilled', async () => {
				const promise = Promise.resolve('the price is right');
				const settledPromises = await Promise.allSettled<unknown>([promise]);

				settledPromises.forEach((settledPromise) => {
					expect(isFulfilled(settledPromise)).toBeTruthy();
				});
			});
		});

		describe('isRejected', () => {
			it('should return false if the given promise is fulfilled', async () => {
				const promise = Promise.resolve('the price is right');
				const settledPromises = await Promise.allSettled<unknown>([promise]);

				settledPromises.forEach((settledPromise) => {
					expect(isRejected(settledPromise)).toBeFalsy();
				});
			});

			it('should return true if the given promise is rejected', async () => {
				const promise = Promise.reject(new Error('Bad error'));
				const settledPromises = await Promise.allSettled<unknown>([promise]);

				settledPromises.forEach((settledPromise) => {
					expect(isRejected(settledPromise)).toBeTruthy();
				});
			});
		});
	});
});
