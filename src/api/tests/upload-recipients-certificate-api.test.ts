/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { uploadRecipientCertificate } from '../upload-recipients-certificate-api';

describe('uploadRecipientCertificate', () => {
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

		const certificateContent = 'sampleCertificateContent';
		const result = await uploadRecipientCertificate(certificateContent);
		expect(result).toEqual({ data: expect.any(Object) });
		expect(fetch).toHaveBeenCalledWith('/service/extension/encryption/smime/recipient', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ certificate: certificateContent })
		});
	});

	it('should return error when the API call is successful but response is not ok', async () => {
		const certificateContent = 'sampleCertificateContent';
		const statusText = 'Bad Request';
		const mockResponse = { ok: false, status: 404, statusText };
		global.fetch = jest.fn(() => Promise.resolve(mockResponse)) as jest.Mock;

		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
			/* mock implementation */
		});

		const result = await uploadRecipientCertificate(certificateContent);
		expect(result).toEqual({ error: statusText });

		expect(consoleErrorSpy).toHaveBeenCalledWith('Response not OK:', 404, statusText);
		consoleErrorSpy.mockRestore();
	});
});
