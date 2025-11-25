/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { CertificatePasswordModal } from 'views/settings/certificates/certificate-password-modal';

vi.mock('../../../../api/create-password-api', () => ({
	createEncryptionPassword: vi.fn()
}));

describe('CertificatePasswordModal', () => {
	const onClose = vi.fn();
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

		it('should show error when passwords do not match', async () => {
			const { user } = setupTest(
				<CertificatePasswordModal onClose={(): void => onClose()} isReset={false} />
			);
			const passwordInput = screen.getByTestId('password');
			const confirmPasswordInput = screen.getByTestId('confirm_password');

			await act(async () => {
				await user.type(passwordInput, 'Password123!');
			});

			await act(async () => {
				await user.type(confirmPasswordInput, 'DifferentPassword123!');
			});

			const enterBtn = screen.getByRole('button', { name: 'Enter' });

			await act(async () => {
				await user.click(enterBtn);
			});

			expect(screen.getByText('Passwords do not match')).toBeVisible();
		});
		it('should show error if password is shorter than 8 characters', async () => {
			const { user } = setupTest(
				<CertificatePasswordModal onClose={(): void => onClose()} isReset={false} />
			);
			const passwordInput = screen.getByTestId('password');
			const confirmPasswordInput = screen.getByTestId('confirm_password');

			await act(async () => {
				await user.type(passwordInput, 'short');
			});

			await act(async () => {
				await user.type(confirmPasswordInput, 'short');
			});

			const enterBtn = screen.getByRole('button', { name: 'Enter' });
			await act(async () => {
				await user.click(enterBtn);
			});

			expect(screen.getByText('Password must be at least 8 characters long')).toBeVisible();
		});

		it('should show error if password does not meet complexity requirements', async () => {
			const { user } = setupTest(
				<CertificatePasswordModal onClose={(): void => onClose()} isReset={false} />
			);
			const passwordInput = screen.getByTestId('password');
			const confirmPasswordInput = screen.getByTestId('confirm_password');

			await act(async () => {
				await user.type(passwordInput, 'password');
			});

			await act(async () => {
				await user.type(confirmPasswordInput, 'password');
			});

			const enterBtn = screen.getByRole('button', { name: 'Enter' });
			await act(async () => {
				await user.click(enterBtn);
			});

			expect(
				screen.getByText(
					'Password must include uppercase, lowercase, numbers, and special characters'
				)
			).toBeVisible();
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
