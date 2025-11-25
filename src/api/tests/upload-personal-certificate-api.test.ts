import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { uploadPersonalCertificate } from 'api/upload-personal-certificate-api';

describe('uploadPersonalCertificate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const certificate = {
		privateKey: 'mock-private-key',
		certificate: 'mock-certificate',
		caCertificate: 'mock-ca-certificate'
	};

	it('should return data when the API call is successful and response is ok', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({})
			})
		) as Mock;

		const result = await uploadPersonalCertificate(certificate, 'password', true);
		expect(result).toEqual({ data: expect.any(Object) });
		expect(fetch).toHaveBeenCalledWith('/service/extension/encryption/smime/personal', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				password: 'password',
				privateKey: certificate.privateKey,
				certificate: certificate.certificate,
				caCertificate: certificate.caCertificate,
				selected: true
			})
		});
	});

	it('should return data when the API call is successful and response is not ok', async () => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const statusText = 'Bad Request';
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: false,
				status: 400,
				statusText
			})
		) as Mock;

		const result = await uploadPersonalCertificate(certificate, 'password', true);
		expect(result).toEqual({ error: statusText });

		expect(fetch).toHaveBeenCalledWith('/service/extension/encryption/smime/personal', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				password: 'password',
				privateKey: certificate.privateKey,
				certificate: certificate.certificate,
				caCertificate: certificate.caCertificate,
				selected: true
			})
		});
		expect(consoleErrorSpy).toHaveBeenCalledWith('Response not OK:', 400, statusText);
		consoleErrorSpy.mockRestore();
	});
});
