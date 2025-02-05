/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { checkExistEncryptionPassword } from '../../../../api/check-exist-password-api';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { useSmimePasswordStore } from '../../../../store/certificates/store';
import CertificatesView from '../certificates-view';
import {
	createAPIInterceptorToGetPersonalCertificates,
	createAPIInterceptorToGetRecipientsCertificates
} from './utils.test';

jest.mock('../../../../store/certificates/store', () => {
	const actual = jest.requireActual('../../../../store/certificates/store');
	return {
		...actual,
		useSmimePasswordStore: jest.fn(() => ({
			smimePassword: '',
			updateSmimePassword: jest.fn()
		}))
	};
});

jest.mock('../../../../api/check-exist-password-api', () => ({
	checkExistEncryptionPassword: jest.fn()
}));

describe('CertificatesView', () => {
	const mockCheckExistEncryptionPassword = checkExistEncryptionPassword as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('calls checkExistEncryptionPassword API when password is empty', async () => {
		(useSmimePasswordStore as unknown as jest.Mock).mockReturnValue({ smimePassword: '' });
		mockCheckExistEncryptionPassword.mockResolvedValue({ data: {} });

		setupTest(<CertificatesView />);

		await waitFor(() => {
			expect(mockCheckExistEncryptionPassword).toHaveBeenCalled();
		});
	});

	it('renders personal and recipient certificates sections when password exists', () => {
		(useSmimePasswordStore as unknown as jest.Mock).mockReturnValue({
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
