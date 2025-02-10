/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createEncryptionPassword } from '../create-password-api';

describe('createEncryptionPassword', () => {
	const apiURL = '/service/extension/encryption/password';
	const apiURLReset = '/service/extension/encryption/password/reset';

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return data when the API call is successful and response is ok', async () => {
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({})
			})
		) as jest.Mock;

		const result = await createEncryptionPassword('testPassword');
		expect(result).toEqual({ data: expect.any(Object) });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: 'testPassword' })
		});
	});

	it('should return data when the API call is successful and response is ok with reset', async () => {
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({})
			})
		) as jest.Mock;

		const result = await createEncryptionPassword('testPassword', true);
		expect(result).toEqual({ data: expect.any(Object) });
		expect(fetch).toHaveBeenCalledWith(apiURLReset, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: 'testPassword' })
		});
	});

	it('should return error when the API call is successful but response is not ok', async () => {
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
			// Log the error message for debugging purposes
		});
		const statusText = 'Bad Request';
		global.fetch = jest.fn(() =>
			Promise.resolve({
				ok: false,
				status: 400,
				statusText
			})
		) as jest.Mock;

		const result = await createEncryptionPassword('testPassword');
		expect(result).toEqual({ error: statusText });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: 'testPassword' })
		});
		expect(consoleErrorSpy).toHaveBeenCalledWith('Response not OK:', 400, statusText);
		consoleErrorSpy.mockRestore();
	});

	it('should return error when the API call fails', async () => {
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
			// Log the error message for debugging purposes
		});
		const errorMessage = 'Network error';
		global.fetch = jest.fn(() => Promise.reject(new Error(errorMessage))) as jest.Mock;

		const result = await createEncryptionPassword('testPassword');
		expect(result).toEqual({ error: new Error(errorMessage) });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: 'testPassword' })
		});
		expect(consoleErrorSpy).toHaveBeenCalledWith('Error during fetch:', new Error(errorMessage));
		consoleErrorSpy.mockRestore();
	});
});
