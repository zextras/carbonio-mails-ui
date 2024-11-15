/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { handleCertificateFileUpload } from '../certificate-utils';

const errorMessage = 'messages.snackbar.fail_to_parse_certificate';

it('should throw an error if the file is not a PKCS#12 file', async () => {
	const file = new File(['test-cert'], 'test-cert.txt', { type: 'text/plain' });
	const password = 'test-password';
	await expect(() => handleCertificateFileUpload(file, password)).rejects.toThrow(
		expect.objectContaining({
			message: expect.stringContaining(errorMessage)
		})
	);
});

it('should throw an error if the password is incorrect', async () => {
	const file = new File(['test-cert'], 'test-cert.p12', { type: 'application/x-pkcs12' });
	const password = 'wrong-password';
	await expect(() => handleCertificateFileUpload(file, password)).rejects.toThrow(
		expect.objectContaining({
			message: expect.stringContaining(errorMessage)
		})
	);
});

it('should throw an error if the file is corrupted', async () => {
	const file = new File(['test-cert'], 'test-cert-corrupted.p12', { type: 'application/x-pkcs12' });
	const password = 'test-password';
	await expect(() => handleCertificateFileUpload(file, password)).rejects.toThrow(
		expect.objectContaining({
			message: expect.stringContaining(errorMessage)
		})
	);
});
