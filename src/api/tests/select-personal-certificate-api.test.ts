/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { selectPersonalCertificate } from 'api/select-personal-certificate-api';

describe('selectPersonalCertificate', () => {
	const apiURL = '/service/extension/encryption/smime/personal/select';
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

		const result = await selectPersonalCertificate('password123', 'id123');
		expect(result).toEqual({ data: expect.any(Object) });
		expect(fetch).toHaveBeenCalledWith(apiURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password: 'password123', id: 'id123' })
		});
	});

	it('should return an error when the API call is unsuccessful', async () => {
		const statusText = 'Bad Request';
		const mockResponse = { ok: false, status: 404, statusText };
		global.fetch = jest.fn(() => Promise.resolve(mockResponse)) as jest.Mock;

		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message) => {
			/* mock implementation */
		});

		const result = await selectPersonalCertificate('password123', 'id123');
		expect(result).toEqual({ error: statusText });

		expect(consoleErrorSpy).toHaveBeenCalledWith('Response not OK:', 404, statusText);
		consoleErrorSpy.mockRestore();
	});
});
