/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { EnterPasswordModal } from 'views/settings/certificates/enter-password-modal';

describe('EnterPasswordModal', () => {
	const onClose = vi.fn();
	const onPasswordReset = vi.fn();
	const onConform = vi.fn();
	describe('Enter Password', () => {
		const headetTitle = 'Enter password';
		it('should render the modal with the correct title', async () => {
			setupTest(
				<EnterPasswordModal
					onClose={(): void => onClose()}
					onPasswordReset={onPasswordReset}
					onConfirm={onConform}
					hideReset={false}
				/>
			);
			const modalTitle = screen.getByText(headetTitle);
			expect(modalTitle).toBeVisible();
		});

		it('should render the message for enter password', async () => {
			setupTest(
				<EnterPasswordModal
					onClose={(): void => onClose()}
					onPasswordReset={onPasswordReset}
					onConfirm={onConform}
					hideReset={false}
				/>
			);
			expect(screen.getByText(headetTitle)).toBeVisible();
			expect(screen.getByText('To use S/MIME related actions enter the password')).toBeVisible();
		});

		it('should render the password and confirm password elements', async () => {
			setupTest(
				<EnterPasswordModal
					onClose={(): void => onClose()}
					onPasswordReset={onPasswordReset}
					onConfirm={onConform}
					hideReset={false}
				/>
			);
			expect(screen.getByText(headetTitle)).toBeVisible();

			const password = screen.getByTestId('enter-password');
			expect(password).toBeInTheDocument();
		});

		it('should display the Reset password', async () => {
			setupTest(
				<EnterPasswordModal
					onClose={(): void => onClose()}
					onPasswordReset={onPasswordReset}
					onConfirm={onConform}
					hideReset={false}
				/>
			);
			expect(screen.getByText(headetTitle)).toBeVisible();
			expect(screen.getByText('Reset password')).toBeVisible();
		});

		it('should hide the Reset password', async () => {
			setupTest(
				<EnterPasswordModal
					onClose={(): void => onClose()}
					onPasswordReset={onPasswordReset}
					onConfirm={onConform}
					hideReset
				/>
			);
			expect(screen.getByText(headetTitle)).toBeVisible();
			expect(screen.queryByText('Reset password')).not.toBeInTheDocument();
		});

		it('should render the Close and Enter buttons', async () => {
			setupTest(
				<EnterPasswordModal
					onClose={(): void => onClose()}
					onPasswordReset={onPasswordReset}
					onConfirm={onConform}
					hideReset={false}
				/>
			);
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
