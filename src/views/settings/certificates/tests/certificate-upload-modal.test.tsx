/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { CertificateUploadModal } from 'views/settings/certificates/certificate-upload-modal';

describe('CertificateUploadModal', () => {
	const onConfirm = vi.fn();
	const onClose = vi.fn();

	it('should render the modal with the correct title', async () => {
		setupTest(
			<CertificateUploadModal onClose={(): void => onClose()} onConfirm={onConfirm({}, true)} />
		);
		const modalTitle = screen.getByText('Upload Certificate');
		expect(modalTitle).toBeVisible();
	});

	it('should render certificate browse button', async () => {
		setupTest(
			<CertificateUploadModal
				onClose={(): void => onClose()}
				onConfirm={(): void => onConfirm({}, true)}
			/>
		);
		const button = screen.getByRole('button', {
			name: 'Browse'
		});
		expect(button).toBeInTheDocument();
	});

	it('should render certificate upload button', async () => {
		setupTest(
			<CertificateUploadModal
				onClose={(): void => onClose()}
				onConfirm={(): void => onConfirm({}, true)}
			/>
		);
		const button = screen.getByRole('button', {
			name: 'Upload'
		});
		expect(button).toBeInTheDocument();
	});

	it('should render the file input field', () => {
		setupTest(
			<CertificateUploadModal onClose={(): void => onClose()} onConfirm={(): void => onConfirm()} />
		);
		const text = screen.getByTestId('certificate-file-name');
		expect(text).toBeInTheDocument();
	});

	it('should render the password input field', () => {
		setupTest(
			<CertificateUploadModal onClose={(): void => onClose()} onConfirm={(): void => onConfirm()} />
		);
		const text = screen.getByTestId('certificate-password');
		expect(text).toBeInTheDocument();
	});
	it('should disable certificate upload button', async () => {
		setupTest(
			<CertificateUploadModal onClose={(): void => onClose()} onConfirm={(): void => onConfirm()} />
		);
		const button = screen.getByRole('button', {
			name: 'Upload'
		});
		expect(button).toBeInTheDocument();
		expect(button).toBeDisabled();
	});
});
