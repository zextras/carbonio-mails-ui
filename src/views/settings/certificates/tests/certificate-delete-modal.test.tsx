/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import CertificateDeleteModal from 'views/settings/certificates/certificate-delete-modal';

describe('CertificateDeleteModal', () => {
	const onClose = vi.fn();
	const onConfirmDelete = vi.fn();
	const email = 'test@example.com';

	describe('Delete Certificate', () => {
		const headetTitle = 'Delete Certificate';
		it('should render the modal with the correct title', async () => {
			setupTest(
				<CertificateDeleteModal onClose={onClose} onConfirmDelete={onConfirmDelete} email={email} />
			);
			const modalTitle = screen.getByText(headetTitle);
			expect(modalTitle).toBeVisible();
		});

		it('should render the message for delete confirmation', async () => {
			setupTest(
				<CertificateDeleteModal onClose={onClose} onConfirmDelete={onConfirmDelete} email={email} />
			);
			const warningMessage = await screen.findByText(/Are you sure to delete certificate of/);
			expect(screen.getByText(headetTitle)).toBeVisible();
			expect(warningMessage).toBeInTheDocument();
			expect(screen.getByText(/test@example.com\?/)).toBeInTheDocument();
		});

		it('should render the Delete button', async () => {
			setupTest(
				<CertificateDeleteModal onClose={onClose} onConfirmDelete={onConfirmDelete} email={email} />
			);
			expect(screen.getByText(headetTitle)).toBeVisible();
			const deleteBtn = screen.getByRole('button', {
				name: 'Delete'
			});
			expect(deleteBtn).toBeInTheDocument();
			expect(deleteBtn).toBeEnabled();
		});

		it('should call onClose on click of Delete button', async () => {
			const { user } = setupTest(
				<CertificateDeleteModal onClose={onClose} onConfirmDelete={onConfirmDelete} email={email} />
			);
			expect(screen.getByText(headetTitle)).toBeVisible();
			const deleteBtn = screen.getByRole('button', {
				name: 'Delete'
			});
			expect(deleteBtn).toBeInTheDocument();
			expect(deleteBtn).toBeEnabled();
			await user.click(deleteBtn);
		});
	});
});
