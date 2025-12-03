import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { uploadRecipientCertificate } from 'api/upload-recipients-certificate-api';

describe('uploadRecipientCertificate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return data when the API call is successful and response is ok', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({})
			})
		) as Mock;

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
		global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as Mock;

		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
			/* mock implementation */
		});

		const result = await uploadRecipientCertificate(certificateContent);
		expect(result).toEqual({ error: statusText });

		expect(consoleErrorSpy).toHaveBeenCalledWith('Response not OK:', 404, statusText);
		consoleErrorSpy.mockRestore();
	});
});
