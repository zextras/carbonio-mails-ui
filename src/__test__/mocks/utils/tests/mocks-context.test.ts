/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getMocksContext, getRandomIdentities } from '../mocks-context';

describe('mocks-context', () => {
	describe('getRandomIdentities', () => {
		test('returns an array of valid identities', () => {
			const mocksContext = getMocksContext();
			const randomIdentities = getRandomIdentities(mocksContext.otherUsersIdentities, 4);
			randomIdentities.forEach((identity) => {
				expect(identity).toBeTruthy();
			});
		});

		test('returns the required number of identity', () => {
			const mocksContext = getMocksContext();
			const count = 4;
			const randomIdentities = getRandomIdentities(mocksContext.otherUsersIdentities, count);
			expect(randomIdentities.length).toBe(count);
		});

		test('returns the whole provided list of identities if the required number is greater than the number of provided identities', () => {
			const mocksContext = getMocksContext();
			const count = 198;
			const randomIdentities = getRandomIdentities(mocksContext.otherUsersIdentities, count);
			expect(randomIdentities.length).toBe(randomIdentities.length);
		});
	});
});
