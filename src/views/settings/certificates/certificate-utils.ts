/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';
import * as asn1js from 'asn1js';
import forge from 'node-forge';
import * as pkijs from 'pkijs';

interface CertificateFileUploadResult {
	privateKey: string;
	certificate: string;
	caCertificate: string;
	emailAddress: string[];
}

const ERROR_MESSAGE = t(
	'snackbar.uploadCertificate.failToVerifyCertificate',
	'Failed to parse certificate'
);
const getCertificate = async (certArg: string): Promise<pkijs.Certificate> => {
	try {
		const sanitizedCert = certArg
			.replace(/-----BEGIN CERTIFICATE-----/, '')
			.replace(/-----END CERTIFICATE-----/, '')
			.replace(/\s+/g, '');

		const binaryDer = Uint8Array.from(atob(sanitizedCert), (char) => char.charCodeAt(0));
		const asn1 = asn1js.fromBER(binaryDer.buffer);

		if (asn1.offset === -1) throw new Error(ERROR_MESSAGE);

		return new pkijs.Certificate({ schema: asn1.result });
	} catch {
		throw new Error(ERROR_MESSAGE);
	}
};

export const handleCertificateFileUpload = (
	file: File,
	password: string
): Promise<CertificateFileUploadResult> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = async (e: ProgressEvent<FileReader>): Promise<void> => {
			try {
				const arrayBuffer = e.target?.result;
				if (!arrayBuffer) {
					return reject(new Error(ERROR_MESSAGE));
				}

				const p12Der = forge.util.createBuffer(arrayBuffer as ArrayBuffer);
				const p12Asn1 = forge.asn1.fromDer(p12Der);
				const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

				const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
				const privateKeyObj = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;

				const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
				const certificates = certBags[forge.pki.oids.certBag];

				if (!privateKeyObj || !certificates || certificates.length === 0) {
					return reject(new Error(ERROR_MESSAGE));
				}

				const endEntityCertFile = certificates[0].cert;
				const caCerts = certificates.slice(1);

				const pkcs8PrivateKey = forge.pki.privateKeyToAsn1(privateKeyObj);

				const wrapPrivateKey = forge.pki.wrapRsaPrivateKey(pkcs8PrivateKey);
				const privateKey = forge.pki.privateKeyInfoToPem(wrapPrivateKey);
				if (!endEntityCertFile) {
					return reject(new Error(ERROR_MESSAGE));
				}

				const endEntityCert = forge.pki.certificateToPem(endEntityCertFile);
				const caCertificate = caCerts
					.map((cert) => (cert?.cert ? forge.pki.certificateToPem(cert.cert) : ''))
					.join('\n');

				const certificate = await getCertificate(endEntityCert);
				const emailAddress = certificate.subject.typesAndValues.map(
					(typeAndValue) => typeAndValue.value.valueBlock.value
				);

				return resolve({
					privateKey: privateKey.replace(/\r\n/g, '\n'),
					certificate: endEntityCert.replace(/\r\n/g, '\n'),
					caCertificate: caCertificate.replace(/\r\n/g, '\n'),
					emailAddress
				});
			} catch (err) {
				return reject(new Error(ERROR_MESSAGE));
			}
		};

		reader.readAsArrayBuffer(file);
	});
