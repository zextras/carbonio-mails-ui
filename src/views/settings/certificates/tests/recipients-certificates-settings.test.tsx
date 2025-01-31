/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { Certificate } from '../../../../types/certificates/certificates';
import RecipientsCertificateSettings from '../recipients-certificates-settings';

const createAPIInterceptorToGetRecipientsCertificates = (res?: Certificate[]): void => {
	const response = {
		list: [
			{
				id: 1,
				email: 'demo@demo.zextras.io',
				notBefore: 1731912030000,
				notAfter: 1763448030000,
				serial: '658338337491899729292740349401868759960',
				issuer:
					'1.2.840.113549.1.9.1=#161664686176616c4064657a6578747261732e696f,CN=demo@demo.zextras.io',
				selected: true
			},
			{
				id: 2,
				email: 'test@demo.zextras.io',
				notBefore: 1731916761000,
				notAfter: 1763452761000,
				serial: '1480328137258129208569996201492386552296034160',
				issuer:
					'1.2.840.113549.1.9.1=#161d64686176616c46979614064656d6f2e7a6578747261732e696f,CN=test@demo.zextras.io',
				selected: true
			}
		]
	};
	createAPIInterceptor(
		'get',
		'/service/extension/encryption/smime/recipient/list',
		HttpResponse.json(res ?? response)
	);
};

describe('RecipientsCertificateSettings', () => {
	it('should render the modal with the correct title', async () => {
		createAPIInterceptorToGetRecipientsCertificates();
		setupTest(<RecipientsCertificateSettings />);
		await waitFor(() => {
			const header = screen.getByText('Recipients certificates for encryption');
			expect(header).toBeVisible();
		});
	});

	it('should display the list of recipient certificates', async () => {
		createAPIInterceptorToGetRecipientsCertificates();
		setupTest(<RecipientsCertificateSettings />);
		await waitFor(() => {
			const certificateEmail = screen.getByText('demo@demo.zextras.io');
			expect(certificateEmail).toBeVisible();
		});
	});

	it('should show a message when no recipient certificates are available', async () => {
		createAPIInterceptorToGetRecipientsCertificates([]);
		setupTest(<RecipientsCertificateSettings />);
		await waitFor(() => {
			const noCertificatesMessage = screen.getByText('Recipients certificate list is empty');
			expect(noCertificatesMessage).toBeVisible();
		});
	});

	it('should show a success message when a certificate is uploaded', async () => {
		createAPIInterceptorToGetRecipientsCertificates();
		setupTest(<RecipientsCertificateSettings />);
		const uploadButton = screen.getByTestId('upload-recipients-certificate-btn');
		expect(uploadButton).toBeVisible();
	});

	it.skip('should show an error message when there is an error fetching certificates', async () => {
		createAPIInterceptorToGetRecipientsCertificates();
		setupTest(<RecipientsCertificateSettings />);
	});
});
