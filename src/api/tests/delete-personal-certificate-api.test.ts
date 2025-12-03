/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Mock } from 'vitest';

import { deletePersonalCertificate } from 'api/delete-personal-certificate-api';

describe('deletePersonalCertificate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	const apiURL = '/service/extension/encryption/smime/personal';
	it('should return data when the API call is successful and response is ok', async () => {
		const mockResponse = { ok: true };
		global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as Mock;

		const result = await deletePersonalCertificate('test-id', 'test-password');
		expect(result).toEqual({ data: mockResponse });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: 'test-id', password: 'test-password' })
		});
	});

	it('should return error when the API call is successful but response is not ok with valid error data', async () => {
		const mockErrorData = { message: 'Error' };
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: false,
				json: () => Promise.resolve(mockErrorData)
			})
		) as Mock;

		const result = await deletePersonalCertificate('test-id', 'test-password');
		expect(result).toEqual({ error: mockErrorData });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: 'test-id', password: 'test-password' })
		});
	});

	it('should return error when the API call is successful but response is not ok with invalid error data', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: false,
				json: () => Promise.reject(new Error('Invalid JSON'))
			})
		) as Mock;

		const result = await deletePersonalCertificate('test-id', 'test-password');
		expect(result).toEqual({ error: 'Unknown error occurred' });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: 'test-id', password: 'test-password' })
		});
	});

	it('should return error when the API call fails', async () => {
		const errorMessage = 'Network error';
		global.fetch = vi.fn(() => Promise.reject(new Error(errorMessage))) as Mock;

		const result = await deletePersonalCertificate('test-id', 'test-password');
		expect(result).toEqual({ error: new Error(errorMessage) });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: 'test-id', password: 'test-password' })
		});
	});
});
