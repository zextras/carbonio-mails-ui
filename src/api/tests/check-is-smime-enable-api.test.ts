import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { checkIsSmimeEnabled } from 'api/check-is-smime-enable-api';

const apiURL = '/service/extension/encryption/password/enabled';

describe('checkIsSmimeEnabled', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return data when the API call is successful and response is ok', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true
			})
		) as Mock;

		const result = await checkIsSmimeEnabled();
		expect(result).toEqual({ data: {} });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'GET'
		});
	});

	it('should return error when the API call is successful but response is not ok', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: false
			})
		) as Mock;

		const result = await checkIsSmimeEnabled();
		expect(result).toEqual({ error: '' });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'GET'
		});
	});

	it('should return error when the API call fails', async () => {
		const errorMessage = 'Network error';
		global.fetch = vi.fn(() => Promise.reject(new Error(errorMessage))) as Mock;

		const result = await checkIsSmimeEnabled();
		expect(result).toEqual({ error: new Error(errorMessage) });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'GET'
		});
	});
});
