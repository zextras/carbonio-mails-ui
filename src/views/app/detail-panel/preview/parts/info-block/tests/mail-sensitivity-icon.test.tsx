/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { MAIL_SENSITIVITY_HEADER } from 'constants/index';
import { MailSensitivityIcon } from 'views/app/detail-panel/preview/parts/info-block/mail-sensitivity-icon';

describe('MailSensitivityIcon', () => {
	test('renders icon when hasSensitivity private', async () => {
		const { user } = setupTest(
			<MailSensitivityIcon sensitivity={MAIL_SENSITIVITY_HEADER.private} />
		);

		const icon = screen.getByTestId('mail-sensitivity-icon');
		expect(icon).toBeInTheDocument();

		await user.hover(icon);
		expect(await screen.findByText('Sensitivity Private')).toBeInTheDocument();
	});

	test('renders icon when hasSensitivity companyConfidential', async () => {
		const { user } = setupTest(
			<MailSensitivityIcon sensitivity={MAIL_SENSITIVITY_HEADER.companyConfidential} />
		);

		const icon = screen.getByTestId('mail-sensitivity-icon');
		expect(icon).toBeInTheDocument();

		await user.hover(icon);
		expect(await screen.findByText('Sensitivity Company-Confidential')).toBeInTheDocument();
	});
});
