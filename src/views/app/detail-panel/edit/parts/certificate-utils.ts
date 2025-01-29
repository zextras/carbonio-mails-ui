/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
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

/**
 * Normalize PEM formatting by replacing Windows-style newlines with Unix-style newlines.
 */
const normalizePEM = (pemString: string): string => pemString.replace(/\r\n/g, '\n');

/**
 * Parses a PEM certificate string into a pkijs.Certificate object.
 */
const getCertificate = async (certArg: string): Promise<pkijs.Certificate> => {
	try {
		const sanitizedCert = certArg
			.replace(/-----BEGIN CERTIFICATE-----/, '')
			.replace(/-----END CERTIFICATE-----/, '')
			.replace(/\s+/g, '');

		const binaryDer = Uint8Array.from(atob(sanitizedCert), (char) => char.charCodeAt(0));
		const asn1 = asn1js.fromBER(binaryDer.buffer);

		if (asn1.offset === -1) {
			throw new Error('Invalid ASN.1 structure in certificate.');
		}

		return new pkijs.Certificate({ schema: asn1.result });
	} catch (error) {
		throw new Error(ERROR_MESSAGE);
	}
};

/**
 * Handles the upload and parsing of a PKCS#12 (.p12/.pfx) certificate file.
 */
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

				// Convert file to PKCS#12 format
				const p12Der = forge.util.createBuffer(arrayBuffer as ArrayBuffer);
				const p12Asn1 = forge.asn1.fromDer(p12Der);
				const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

				// Extract private key
				const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
				const privateKeyObj = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;

				// Extract certificates
				const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
				const certificates = certBags[forge.pki.oids.certBag];

				if (!privateKeyObj || !certificates || certificates.length === 0) {
					return reject(new Error(ERROR_MESSAGE));
				}

				// Process certificates
				const endEntityCertFile = certificates[0]?.cert;
				const caCerts = certificates.slice(1);

				if (!endEntityCertFile) {
					return reject(new Error(ERROR_MESSAGE));
				}

				// Convert private key to PEM format
				const pkcs8PrivateKey = forge.pki.privateKeyToAsn1(privateKeyObj);
				const wrapPrivateKey = forge.pki.wrapRsaPrivateKey(pkcs8PrivateKey);
				const privateKey = forge.pki.privateKeyInfoToPem(wrapPrivateKey);

				// Convert certificates to PEM format
				const endEntityCert = forge.pki.certificateToPem(endEntityCertFile);
				const caCertificate = caCerts
					.map((cert) => (cert?.cert ? forge.pki.certificateToPem(cert.cert) : ''))
					.join('\n');

				// Extract email address from certificate
				const certificate = await getCertificate(endEntityCert);
				const emailAddress = certificate.subject.typesAndValues.map(
					(typeAndValue) => typeAndValue.value.valueBlock.value
				);

				// Return the parsed certificate data
				return resolve({
					privateKey: normalizePEM(privateKey),
					certificate: normalizePEM(endEntityCert),
					caCertificate: normalizePEM(caCertificate),
					emailAddress
				});
			} catch (err) {
				return reject(new Error(ERROR_MESSAGE));
			}
		};

		reader.readAsArrayBuffer(file);
	});
