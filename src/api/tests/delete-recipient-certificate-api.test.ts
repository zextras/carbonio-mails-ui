/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { deleteRecipientCertificate } from 'api/delete-recipient-certificate-api';

describe('deleteRecipientCertificate', () => {
	const email = 'test@example.com';

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return data when the API call is successful', async () => {
		const mockResponse = { ok: true, status: 200, statusText: 'OK' };
		global.fetch = jest.fn(() => Promise.resolve(mockResponse)) as jest.Mock;

		const result = await deleteRecipientCertificate(email);
		expect(result).toEqual({ data: mockResponse });
	});

	it('should return error when the API call returns a non-OK response', async () => {
		const mockResponse = { ok: false, status: 404, statusText: 'Not Found' };
		global.fetch = jest.fn(() => Promise.resolve(mockResponse)) as jest.Mock;

		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message) => {
			/* mock implementation */
		});

		const result = await deleteRecipientCertificate(email);
		expect(result).toEqual({ error: 'Not Found' });

		expect(consoleErrorSpy).toHaveBeenCalledWith('Response not OK:', 404, 'Not Found');
		consoleErrorSpy.mockRestore();
	});

	it('should return error when the API call fails', async () => {
		const errorMessage = 'Network error';
		global.fetch = jest.fn(() => Promise.reject(new Error(errorMessage))) as jest.Mock;

		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message) => {
			/* mock implementation */
		});

		const result = await deleteRecipientCertificate(email);
		expect(result).toEqual({ error: new Error(errorMessage) });

		expect(consoleErrorSpy).toHaveBeenCalledWith('Error during fetch:', new Error(errorMessage));
		consoleErrorSpy.mockRestore();
	});
});
