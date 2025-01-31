/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { Certificate } from '../../../../types/certificates/certificates';
import ShowAllCertificatesModal from '../show-all-certificates-modal';

const certificate: Certificate[] = [
	{
		id: '101',
		email: 'demo@demo.zextras.io',
		notBefore: 1738052626000,
		notAfter: 1800347026000,
		serial: '17339026770',
		issuer: 'CN=Self-Signed CA,O=MyOrg,C=US',
		selected: true
	},
	{
		id: '102',
		email: 'demo@demo.zextras.io',
		notBefore: 1738052610000,
		notAfter: 1800347010000,
		serial: '17339010027',
		issuer: 'CN=Self-Signed CA,O=MyOrg,C=US',
		selected: false
	}
];

describe('ShowAllCertificatesModal', () => {
	const onClose = jest.fn();
	it('should render the modal with the correct title', async () => {
		setupTest(<ShowAllCertificatesModal certificates={certificate} onClose={onClose} />);
		await waitFor(() => {
			const header = screen.getByText(`Personal Certificates of ${certificate[0].email}`);
			expect(header).toBeVisible();
		});
	});

	it('should show Close and Set Active buttons', async () => {
		setupTest(<ShowAllCertificatesModal certificates={certificate} onClose={onClose} />);

		const closeBtn = screen.getByRole('button', {
			name: 'Close'
		});
		expect(closeBtn).toBeInTheDocument();
		expect(closeBtn).toBeEnabled();
		const setActiveBtn = screen.getByRole('button', {
			name: 'Set Active'
		});
		expect(setActiveBtn).toBeInTheDocument();
		expect(setActiveBtn).toBeDisabled();
	});

	it.skip('should display the list of personal certificates of selected email', async () => {
		setupTest(<ShowAllCertificatesModal certificates={certificate} onClose={onClose} />);
		await waitFor(() => {
			const certificateEmail = screen.getByText(certificate[0].issuer);
			expect(certificateEmail).toBeVisible();
		});
	});
});
