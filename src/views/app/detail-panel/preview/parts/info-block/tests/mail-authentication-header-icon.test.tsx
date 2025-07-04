/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { setupTest, screen } from '@test-setup';
import { MailAuthenticationHeaderIcon } from 'views/app/detail-panel/preview/parts/info-block/mail-authentication-header-icon';

const authenticationHeaders = {
	spf: { value: 'spf-value', pass: true },
	dkim: { value: 'dkim-value', pass: true },
	dmarc: { value: 'dmarc-value', pass: true }
};

describe('authenticationHeadersIconColor', () => {
	it('correctly renders the component when one of the properties is valid', () => {
		setupTest(<MailAuthenticationHeaderIcon authenticationInfo={authenticationHeaders} />);
		expect(screen.getByTestId('mail-authentication-header-icon')).toBeInTheDocument();
	});

	it('shows a tooltip when hovering', async () => {
		const { user } = setupTest(
			<MailAuthenticationHeaderIcon authenticationInfo={authenticationHeaders} />
		);
		const icon = screen.getByTestId('mail-authentication-header-icon');
		await user.hover(icon);

		expect(await screen.findByText('dkim=pass, spf=pass, dmarc=pass')).toBeInTheDocument();
	});
});
