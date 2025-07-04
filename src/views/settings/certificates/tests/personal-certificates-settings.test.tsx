/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { setupTest } from '@test-setup';
import PersonalCertificatesSettings from 'views/settings/certificates/personal-certificates-settings';
import { createAPIInterceptorToGetPersonalCertificates } from 'views/settings/certificates/tests/utils/utils';

describe('PersonalCertificatesSettings', () => {
	it('should render the modal with the correct title', async () => {
		createAPIInterceptorToGetPersonalCertificates();
		setupTest(<PersonalCertificatesSettings />);
		await waitFor(() => {
			const header = screen.getByText(
				'Personal certificates for signing, encryption and decryption'
			);
			expect(header).toBeVisible();
		});
	});

	it('should display the list of personal certificates', async () => {
		createAPIInterceptorToGetPersonalCertificates();
		setupTest(<PersonalCertificatesSettings />);
		await waitFor(() => {
			const certificateEmail = screen.getByText('demo@demo.zextras.io');
			expect(certificateEmail).toBeVisible();
		});
	});

	it('should show a message when no personal certificates are available', async () => {
		createAPIInterceptorToGetPersonalCertificates([]);
		setupTest(<PersonalCertificatesSettings />);
		await waitFor(() => {
			const noCertificatesMessage = screen.getByText('Personal certificate list is empty');
			expect(noCertificatesMessage).toBeVisible();
		});
	});

	it('should show a success message when a certificate is uploaded', async () => {
		createAPIInterceptorToGetPersonalCertificates();
		setupTest(<PersonalCertificatesSettings />);
		const uploadButton = screen.getByTestId('upload-personal-certificate-btn');
		expect(uploadButton).toBeVisible();
	});
});
