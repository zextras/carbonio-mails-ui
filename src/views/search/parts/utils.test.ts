/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { isValidEmail } from 'views/search/parts/utils';

describe('isValidEmail', () => {
	it('accepts an address', () => {
		expect(isValidEmail('user1@example.com')).toBe(true);
	});

	it('rejects a name without address', () => {
		expect(isValidEmail('Mail Delivery System')).toBe(false);
	});

	it('rejects a participant without address', () => {
		expect(isValidEmail(undefined)).toBe(false);
	});
});
