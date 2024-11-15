/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { CertificateUploadModal } from '../certificate-upload-modal';

describe('CertificateUploadModal', () => {
	const onConfirm = jest.fn();
	const onClose = jest.fn();
	const identityEmailAddress = 'demo@email.com';

	it('should render the modal with the correct title', async () => {
		setupTest(
			<CertificateUploadModal
				emailAddress={identityEmailAddress}
				onClose={(): void => onClose()}
				onConfirm={(): void => onConfirm()}
			/>
		);
		const modalTitle = screen.getByText(/label\.upload_certificate/i);
		expect(modalTitle).toBeVisible();
	});
});
