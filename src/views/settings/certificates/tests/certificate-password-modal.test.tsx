/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { CertificatePasswordModal } from '../certificate-password-modal';

describe('CertificatePasswordModal', () => {
	const onClose = jest.fn();
	describe('Create Password', () => {
		const headetTitle = 'Create a Password for S/MIME Operations';
		it('should render the modal with the correct title', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset={false} />);
			const modalTitle = screen.getByText(headetTitle);
			expect(modalTitle).toBeVisible();
		});

		it('should render the message for create password', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset={false} />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			expect(
				screen.getByText(
					'To ensure the security of your email communications, you need to create a password that will be used for every S/MIME operation.'
				)
			).toBeVisible();
			expect(
				screen.getByText(
					'This password is essential for signing, encrypting and decrypting emails.'
				)
			).toBeVisible();
		});

		it('should render the rules for create password', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset={false} />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			expect(screen.getByText('Your password must be:')).toBeVisible();
			expect(screen.getByText('At least 8 characters long.')).toBeVisible();
			expect(
				screen.getByText(
					'Include a mix of uppercase and lowercase letters, numbers, and special characters'
				)
			).toBeVisible();
		});

		it('should render the password and confirm password elements', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset={false} />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			const password = screen.getByTestId('password');
			expect(password).toBeInTheDocument();
			const confirmPassword = screen.getByTestId('confirm_password');
			expect(confirmPassword).toBeInTheDocument();
		});

		it('should render the Important message for create password', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset={false} />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			expect(
				screen.getByText(
					'If you forget this password, we will not be able to recover your certificates or access your encrypted messages. Please store it securely in a password manager or another safe place.'
				)
			).toBeVisible();
		});

		it('should render the Close and Enter buttons', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset={false} />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			const closeBtn = screen.getByRole('button', {
				name: 'Close'
			});
			expect(closeBtn).toBeInTheDocument();
			expect(closeBtn).toBeEnabled();
			const enterBtn = screen.getByRole('button', {
				name: 'Enter'
			});
			expect(enterBtn).toBeInTheDocument();
			expect(enterBtn).toBeEnabled();
		});
	});

	describe('Reset Password', () => {
		const headetTitle = 'Reset Password';
		it('should render the modal with the correct title', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset />);
			const modalTitle = screen.getByText(headetTitle);
			expect(modalTitle).toBeVisible();
		});

		it('should render the message for reset password', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			expect(
				screen.getByText(
					'Resetting your password will revoke access to all your personal certificates. This means you will need to re-upload your certificates to regain access.'
				)
			).toBeVisible();
		});

		it('should render the rules for reset password', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			expect(screen.getByText('Your password must be:')).toBeVisible();
			expect(screen.getByText('At least 8 characters long.')).toBeVisible();
			expect(
				screen.getByText(
					'Include a mix of uppercase and lowercase letters, numbers, and special characters'
				)
			).toBeVisible();
		});

		it('should render the password and confirm password elements', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			const password = screen.getByTestId('password');
			expect(password).toBeInTheDocument();
			const confirmPassword = screen.getByTestId('confirm_password');
			expect(confirmPassword).toBeInTheDocument();
		});

		it('should render the Important message for create password', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			expect(
				screen.getByText(
					'If you are certain you want to proceed, click “Reset Password” to create a new one.'
				)
			).toBeVisible();
		});

		it('should render the Close and Enter buttons', async () => {
			setupTest(<CertificatePasswordModal onClose={(): void => onClose()} isReset />);
			expect(screen.getByText(headetTitle)).toBeVisible();

			const closeBtn = screen.getByRole('button', {
				name: 'Close'
			});
			expect(closeBtn).toBeInTheDocument();
			expect(closeBtn).toBeEnabled();
			const enterBtn = screen.getByRole('button', {
				name: 'Enter'
			});
			expect(enterBtn).toBeInTheDocument();
			expect(enterBtn).toBeEnabled();
		});
	});
});
