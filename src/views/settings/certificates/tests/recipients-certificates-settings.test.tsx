/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { setupTest } from '@test-setup';
import RecipientsCertificateSettings from 'views/settings/certificates/recipients-certificates-settings';
import { createAPIInterceptorToGetRecipientsCertificates } from 'views/settings/certificates/tests/utils/utils';

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
});
