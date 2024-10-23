/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { setupTest, screen } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { MailAuthenticationHeaderIcon } from '../mail-authentication-header-icon';

const authenticationHeaders = {
	spf: { value: 'spf-value', pass: true },
	dkim: { value: 'dkim-value', pass: true },
	dmarc: { value: 'dmarc-value', pass: true }
};

describe('authenticationHeadersIconColor', () => {
	it('renders an empty fragment when mailAuthenticationHeaders is undefined', () => {
		setupTest(<MailAuthenticationHeaderIcon mailAuthenticationHeaders={undefined} />);
		expect(screen.queryByTestId('mail-authentication-header-icon')).not.toBeInTheDocument();
	});

	it('renders an empty fragment when mailAuthenticationHeaders is empty object', () => {
		setupTest(<MailAuthenticationHeaderIcon mailAuthenticationHeaders={{}} />);
		expect(screen.queryByTestId('mail-authentication-header-icon')).not.toBeInTheDocument();
	});

	it('correctly renders the component when one of the properties is valid', () => {
		setupTest(<MailAuthenticationHeaderIcon mailAuthenticationHeaders={authenticationHeaders} />);
		expect(screen.getByTestId('mail-authentication-header-icon')).toBeInTheDocument();
	});

	it('shows a tooltip when hovering', async () => {
		const { user } = setupTest(
			<MailAuthenticationHeaderIcon mailAuthenticationHeaders={authenticationHeaders} />
		);
		const icon = screen.getByTestId('mail-authentication-header-icon');
		user.hover(icon);

		expect(await screen.findByText('spf=pass, dkim=pass, dmarc=pass')).toBeInTheDocument();
	});
});
