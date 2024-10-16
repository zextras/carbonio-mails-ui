/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getIsFromExternalDomain } from '../mail-header-utils';

describe('getIsFromExternalDomain', () => {
	it('should return false when the From address is from the same domain as the ownerAccount', () => {
		const headers = { From: 'user@domain.com' };
		const ownerAccount = 'owner@domain.com';
		const result = getIsFromExternalDomain(headers, ownerAccount);
		expect(result).toBe(false);
	});

	it('should return true when the From address is from a different domain than the ownerAccount', () => {
		const headers = { From: 'user@external.com' };
		const ownerAccount = 'owner@domain.com';
		const result = getIsFromExternalDomain(headers, ownerAccount);
		expect(result).toBe(true);
	});

	it('should return true when the From address is missing from the headers', () => {
		const headers = {};
		const ownerAccount = 'owner@domain.com';
		const result = getIsFromExternalDomain(headers, ownerAccount);
		expect(result).toBe(true);
	});
});
