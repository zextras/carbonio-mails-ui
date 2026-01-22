/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { checkExistEncryptionPassword } from 'api/check-exist-password-api';
import { useSmimePasswordStore } from 'store/certificates/store';
import CertificatesView from 'views/settings/certificates/certificates-view';
import {
	createAPIInterceptorToGetPersonalCertificates,
	createAPIInterceptorToGetRecipientsCertificates
} from 'views/settings/certificates/tests/utils/utils';

vi.mock('../../../../store/certificates/store', async () => {
	const actual = await vi.importActual('../../../../store/certificates/store');
	return {
		...actual,
		useSmimePasswordStore: vi.fn(() => ({
			smimePassword: '',
			updateSmimePassword: vi.fn()
		}))
	};
});

vi.mock('../../../../api/check-exist-password-api', () => ({
	checkExistEncryptionPassword: vi.fn()
}));

describe('CertificatesView', () => {
	const mockCheckExistEncryptionPassword = checkExistEncryptionPassword as Mock;

	it('calls checkExistEncryptionPassword API when password is empty', async () => {
		(useSmimePasswordStore as unknown as Mock).mockReturnValue({ smimePassword: '' });
		mockCheckExistEncryptionPassword.mockResolvedValue({ data: {} });

		setupTest(<CertificatesView />);

		await waitFor(() => {
			expect(mockCheckExistEncryptionPassword).toHaveBeenCalled();
		});
	});

	it('should close modal correctly after opening', async () => {
		mockCheckExistEncryptionPassword.mockResolvedValue({ data: {} });

		const { user } = setupTest(<CertificatesView />);
		const modalCloseButton = await screen.findByText('Close');

		await act(async () => {
			user.click(modalCloseButton);
		});

		expect(screen.queryByText('Certificate Password Modal')).not.toBeInTheDocument();
	});

	it('renders personal and recipient certificates sections when password exists', () => {
		(useSmimePasswordStore as unknown as Mock).mockReturnValue({
			smimePassword: 'mockPassword'
		});

		createAPIInterceptorToGetPersonalCertificates();
		createAPIInterceptorToGetRecipientsCertificates();

		setupTest(<CertificatesView />);

		expect(
			screen.getByText('Personal certificates for signing, encryption and decryption')
		).toBeInTheDocument();
		expect(screen.getByText('Recipients certificates for encryption')).toBeInTheDocument();
	});
});
