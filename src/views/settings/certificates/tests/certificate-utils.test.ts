/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const errorMessage = 'snackbar.uploadCertificate.failToVerifyCertificate';

import forge from 'node-forge';
import * as pkijs from 'pkijs';

import { handleCertificateFileUpload } from 'views/settings/certificates/certificate-utils';

describe('handleCertificateFileUpload', () => {
	let file: File;
	const password = '1234';

	beforeEach(() => {
		const dummyP12Content = new Uint8Array([
			0x30, 0x82, 0x0e, 0x1a, 0x02, 0x01, 0x03, 0x30, 0x82, 0x0d, 0xd0, 0x06, 0x09, 0x2a, 0x86,
			0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01, 0xa0, 0x82, 0x0d, 0xc1, 0x04, 0x82, 0x0d, 0xbd,
			0x30, 0x82, 0x0d, 0xb9, 0x30, 0x82, 0x08, 0x0a, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7,
			0x0d, 0x01, 0x07, 0x06, 0xa0, 0x82, 0x07, 0xfb, 0x30, 0x82, 0x07, 0xf7, 0x02, 0x01, 0x00,
			0x30, 0x82, 0x07, 0xf0, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01,
			0x30, 0x5f, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x05, 0x0d, 0x30, 0x52,
			0x30, 0x31, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d
		]);

		file = new File([dummyP12Content], 'certificate.p12', { type: 'application/x-pkcs12' });
		vi.clearAllMocks();
	});

	it('should throw error as certificate not parsed', async () => {
		// Mock a valid private key
		const mockPrivateKey = forge.pki.privateKeyToPem(
			forge.pki.rsa.generateKeyPair(2048).privateKey
		);

		// Mock a valid certificate
		const mockCertificate = forge.pki.createCertificate();
		mockCertificate.publicKey = forge.pki.rsa.generateKeyPair(2048).publicKey;
		mockCertificate.serialNumber = '01';

		// Mock the necessary forge functions
		vi.spyOn(forge.pki, 'privateKeyToAsn1').mockReturnValue({} as any);
		vi.spyOn(forge.pki, 'wrapRsaPrivateKey').mockReturnValue({} as any);
		vi.spyOn(forge.pki, 'privateKeyInfoToPem').mockReturnValue(mockPrivateKey);
		vi.spyOn(forge.pki, 'certificateToPem').mockReturnValue('mock-cert-pem');

		// ✅ Fix: Properly mock `pkcs12FromAsn1`
		vi.spyOn(forge.pkcs12, 'pkcs12FromAsn1').mockReturnValue({
			getBags: vi.fn().mockImplementation(({ bagType }) => {
				if (bagType === forge.pki.oids.pkcs8ShroudedKeyBag) {
					return { [bagType]: [{ key: {} }] };
				}
				if (bagType === forge.pki.oids.certBag) {
					return { [bagType]: [{ cert: mockCertificate }] };
				}
				return {};
			})
		} as any);

		vi.spyOn(pkijs, 'Certificate').mockImplementation(
			() =>
				({
					subject: {
						typesAndValues: [{ value: { valueBlock: { value: 'manan@demo.zextras.io' } } }]
					}
				}) as any
		);

		// Mock FileReader behavior
		vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (
			this: FileReader
		) {
			this.onload?.({
				target: { result: new ArrayBuffer(100) }
			} as ProgressEvent<FileReader>);
		});

		await expect(handleCertificateFileUpload(file, password)).rejects.toThrow(
			expect.objectContaining({
				message: expect.stringContaining(errorMessage)
			})
		);
	});

	it('should throw an error if the file is not a PKCS#12 file', async () => {
		const notValidFile = new File(['test-cert'], 'test-cert.txt', { type: 'text/plain' });
		await expect(() => handleCertificateFileUpload(notValidFile, password)).rejects.toThrow(
			expect.objectContaining({
				message: expect.stringContaining(errorMessage)
			})
		);
	});

	it('should throw an error if the password is incorrect', async () => {
		await expect(() => handleCertificateFileUpload(file, 'wrong-password')).rejects.toThrow(
			expect.objectContaining({
				message: expect.stringContaining(errorMessage)
			})
		);
	});

	it('should throw an error if the file is corrupted', async () => {
		const corruptFile = new File(['test-cert'], 'test-cert-corrupted.p12', {
			type: 'application/x-pkcs12'
		});
		await expect(() => handleCertificateFileUpload(corruptFile, password)).rejects.toThrow(
			expect.objectContaining({
				message: expect.stringContaining(errorMessage)
			})
		);
	});
});
