/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { CertificateUploadModal } from '../certificate-upload-modal';

describe('CertificateUploadModal', () => {
	const onConfirm = jest.fn();
	const onClose = jest.fn();

	it.skip('should render the modal with the correct title', async () => {
		setupTest(
			<CertificateUploadModal onClose={(): void => onClose()} onConfirm={(): void => onConfirm()} />
		);
		const modalTitle = screen.getByText(/modal\.uploadCertificate\.uploadCertificate/i);
		expect(modalTitle).toBeVisible();
	});

	it.skip('should render certificate browse button', async () => {
		setupTest(
			<CertificateUploadModal onClose={(): void => onClose()} onConfirm={(): void => onConfirm()} />
		);
		const button = screen.getByRole('button', {
			name: /settings\.browse/i
		});
		expect(button).toBeInTheDocument();
	});

	it.skip('should render certificate upload button', async () => {
		setupTest(
			<CertificateUploadModal onClose={(): void => onClose()} onConfirm={(): void => onConfirm()} />
		);
		const button = screen.getByRole('button', {
			name: /modal\.uploadCertificate\.upload/i
		});
		expect(button).toBeInTheDocument();
	});

	it.skip('should render the file input field', () => {
		setupTest(
			<CertificateUploadModal onClose={(): void => onClose()} onConfirm={(): void => onConfirm()} />
		);
		const text = screen.getByTestId('certificate-file-name');
		expect(text).toBeInTheDocument();
	});

	it.skip('should render the password input field', () => {
		setupTest(
			<CertificateUploadModal onClose={(): void => onClose()} onConfirm={(): void => onConfirm()} />
		);
		const text = screen.getByTestId('certificate-password');
		expect(text).toBeInTheDocument();
	});
});
