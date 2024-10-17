/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { MessageSignature } from '../../../../../../types';
import { SmimeDetailsModal } from '../smime-details-modal';

describe('SmimeDetailsModal', () => {
	test('should display the details of the signed message with valid certificate', async () => {
		const closeFn = jest.fn();
		const signature: MessageSignature = {
			type: 'S/MIME',
			certificate: {
				issuer: {
					trusted: true,
					name: 'Test Certificate data'
				},
				email: 'demp@demo.zextras.io',
				notBefore: 1726312850000,
				notAfter: 1760440850000
			},
			message: 'valid issuer certificate',
			messageCode: 'VALID',
			valid: false
		};
		setupTest(<SmimeDetailsModal onClose={closeFn} signature={signature} />, {});
		expect(screen.getByText('Certificate details')).toBeVisible();

		expect(screen.getByText('Message is Signed')).toBeVisible();
		expect(
			screen.getByText(
				'This message includes a valid digital signature. The message has not been altered since it was sent.'
			)
		).toBeVisible();

		const closeButton = screen.getByRole('button', {
			name: 'Close'
		});
		expect(closeButton).toBeInTheDocument();
		expect(closeButton).toBeEnabled();
	});

	test('should display the details of the invalid certificate', async () => {
		const closeFn = jest.fn();
		const signature: MessageSignature = {
			type: 'S/MIME',
			certificate: {
				issuer: {
					trusted: true,
					name: 'Final Certificate'
				},
				email: 'user1@demo.zextras.io',
				notBefore: 1726312850000,
				notAfter: 1760440850000
			},
			message: 'Cannot find issuer certificate',
			messageCode: 'INVALID',
			valid: false
		};
		setupTest(<SmimeDetailsModal onClose={closeFn} signature={signature} />, {});

		expect(screen.getByText('Digital Signature is Not Valid')).toBeVisible();
		expect(
			screen.getByText('This message includes a digital signature, but the signature is invalid.')
		).toBeVisible();

		const closeButton = screen.getByRole('button', {
			name: 'Close'
		});
		expect(closeButton).toBeInTheDocument();
	});

	test('should display the details of the untrusted certificate', async () => {
		const closeFn = jest.fn();
		const signature: MessageSignature = {
			type: 'S/MIME',
			certificate: {
				issuer: {
					trusted: true,
					name: 'New Certificate'
				},
				email: 'user2@demo.zextras.io',
				notBefore: 1726312850000,
				notAfter: 1760440850000
			},
			message: 'untrusted issuer certificate found',
			messageCode: 'UNTRUSTED',
			valid: false
		};
		setupTest(<SmimeDetailsModal onClose={closeFn} signature={signature} />, {});

		expect(screen.getByText('Message from an Untrusted Source')).toBeVisible();
		expect(
			screen.getByText(
				'This message includes a digital signature, but the signer is not trusted. The certificate might not be issued by a recognized certificate authority.'
			)
		).toBeVisible();

		const closeButton = screen.getByRole('button', {
			name: 'Close'
		});
		expect(closeButton).toBeInTheDocument();
	});

	test('should display the details of the expired certificate', async () => {
		const closeFn = jest.fn();
		const signature: MessageSignature = {
			type: 'S/MIME',
			certificate: {
				issuer: {
					trusted: true,
					name: 'Demo Certificate'
				},
				email: 'user3@demo.zextras.io',
				notBefore: 1726312850000,
				notAfter: 1760440850000
			},
			message: 'Certificate is expired',
			messageCode: 'SIGNER_CERT_EXPIRED',
			valid: false
		};
		setupTest(<SmimeDetailsModal onClose={closeFn} signature={signature} />, {});

		expect(screen.getByText(`The Signer's Certificate Has Expired`)).toBeVisible();
		expect(
			screen.getByText(
				`This message includes a digital signature, but the signer's certificate has expired. It is no longer considered valid.`
			)
		).toBeVisible();

		const closeButton = screen.getByRole('button', {
			name: 'Close'
		});
		expect(closeButton).toBeInTheDocument();
	});

	test(`should display the details if Signer's certificate not found`, async () => {
		const closeFn = jest.fn();
		const signature: MessageSignature = {
			type: 'S/MIME',
			certificate: {
				issuer: {
					trusted: true,
					name: 'Demo Certificate'
				},
				email: 'user4@demo.zextras.io',
				notBefore: 1726312850000,
				notAfter: 1760440850000
			},
			message: 'Signer certificate not found',
			messageCode: 'SIGNER_CERT_NOT_FOUND',
			valid: false
		};
		setupTest(<SmimeDetailsModal onClose={closeFn} signature={signature} />, {});

		expect(screen.getByText(`Signer's Certificate Not Found`)).toBeVisible();
		expect(
			screen.getByText(
				`This message includes a digital signature, but the signer's certificate could not be found. The signature cannot be validated.`
			)
		).toBeVisible();

		const closeButton = screen.getByRole('button', {
			name: 'Close'
		});
		expect(closeButton).toBeInTheDocument();
	});

	test(`should display the details if Issuer's certificate not found`, async () => {
		const closeFn = jest.fn();
		const signature: MessageSignature = {
			type: 'S/MIME',
			certificate: {
				issuer: {
					trusted: true,
					name: 'Test demo Certificate'
				},
				email: 'user5@demo.zextras.io',
				notBefore: 1726312850000,
				notAfter: 1760440850000
			},
			message: 'Issuer certificate not found',
			messageCode: 'ISSUER_CERT_NOT_FOUND',
			valid: false
		};
		setupTest(<SmimeDetailsModal onClose={closeFn} signature={signature} />, {});

		expect(screen.getByText(`Issuer's Certificate Not Found`)).toBeVisible();
		expect(
			screen.getByText(
				'This message includes a digital signature, but the certificate of the issuing authority could not be found.'
			)
		).toBeVisible();

		const closeButton = screen.getByRole('button', {
			name: 'Close'
		});
		expect(closeButton).toBeInTheDocument();
	});

	test(`should display the details if error found`, async () => {
		const closeFn = jest.fn();
		const signature: MessageSignature = {
			type: 'S/MIME',
			certificate: {
				issuer: {
					trusted: true,
					name: 'Test Certificate'
				},
				email: 'user@demo.zextras.io',
				notBefore: 1726312850000,
				notAfter: 1760440850000
			},
			message: 'Error found when verified certificate',
			messageCode: 'ERROR',
			valid: false
		};
		setupTest(<SmimeDetailsModal onClose={closeFn} signature={signature} />, {});

		expect(screen.getByText(`An Error Occurred During Signature Verification`)).toBeVisible();
		expect(
			screen.getByText(
				'There was an error processing the digital signature. The signature could not be verified.'
			)
		).toBeVisible();

		const closeButton = screen.getByRole('button', {
			name: 'Close'
		});
		expect(closeButton).toBeInTheDocument();
	});

	test(`should display the details of Signed By, Issuer and Validity`, async () => {
		const closeFn = jest.fn();
		const signature: MessageSignature = {
			type: 'S/MIME',
			certificate: {
				issuer: {
					trusted: true,
					name: 'Test Certificate'
				},
				email: 'user@demo.zextras.io',
				notBefore: 1726312850000,
				notAfter: 1760440850000
			},
			message: 'Error found when verified certificate',
			messageCode: 'ERROR',
			valid: false
		};
		setupTest(<SmimeDetailsModal onClose={closeFn} signature={signature} />, {});

		expect(screen.getByText(signature.certificate.email)).toBeVisible();
		expect(screen.getByText(signature.certificate.issuer.name)).toBeVisible();
		const closeButton = screen.getByRole('button', {
			name: 'Close'
		});
		expect(closeButton).toBeInTheDocument();
	});
});
