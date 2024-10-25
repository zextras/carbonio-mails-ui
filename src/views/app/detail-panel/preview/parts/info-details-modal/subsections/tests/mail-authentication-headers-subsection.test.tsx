/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { setupTest, screen } from '../../../../../../../../carbonio-ui-commons/test/test-setup';
import { MailAuthenticationHeadersSubsection } from '../mail-authentication-headers-subsection';

describe('MailAuthenticationHeadersSubsection', () => {
	test('correctly renders all attributes when present', () => {
		const authenticationHeaders = {
			spf: { value: 'spf-value', pass: true },
			dkim: { value: 'dkim-value', pass: true },
			dmarc: { value: 'dmarc-value', pass: true }
		};

		setupTest(<MailAuthenticationHeadersSubsection authenticationInfo={authenticationHeaders} />);
		expect(screen.getByText('Authentication Headers')).toBeInTheDocument();
		expect(screen.getByText('DKIM:')).toBeInTheDocument();
		expect(screen.getByText('dkim-value')).toBeInTheDocument();
		expect(screen.getByText('DMARC:')).toBeInTheDocument();
		expect(screen.getByText('dmarc-value')).toBeInTheDocument();
		expect(screen.getByText('SPF:')).toBeInTheDocument();
		expect(screen.getByText('spf-value')).toBeInTheDocument();
	});

	test('displays DKIM header when provided', () => {
		const authenticationHeaders = {
			dkim: { value: 'dkim-value', pass: true }
		};

		setupTest(<MailAuthenticationHeadersSubsection authenticationInfo={authenticationHeaders} />);
		expect(screen.getByText('Authentication Headers')).toBeInTheDocument();
		expect(screen.getByText('DKIM:')).toBeInTheDocument();
		expect(screen.getByText('dkim-value')).toBeInTheDocument();
		expect(screen.queryByText('DMARC:')).not.toBeInTheDocument();
		expect(screen.queryByText('dmarc-value')).not.toBeInTheDocument();
		expect(screen.queryByText('SPF:')).not.toBeInTheDocument();
		expect(screen.queryByText('spf-value')).not.toBeInTheDocument();
	});

	test('displays DMARC header when provided', () => {
		const authenticationHeaders = {
			dmarc: { value: 'dmarc-value', pass: true }
		};

		setupTest(<MailAuthenticationHeadersSubsection authenticationInfo={authenticationHeaders} />);
		expect(screen.getByText('Authentication Headers')).toBeInTheDocument();
		expect(screen.queryByText('DKIM:')).not.toBeInTheDocument();
		expect(screen.queryByText('dkim-value')).not.toBeInTheDocument();
		expect(screen.getByText('DMARC:')).toBeInTheDocument();
		expect(screen.getByText('dmarc-value')).toBeInTheDocument();
		expect(screen.queryByText('SPF:')).not.toBeInTheDocument();
		expect(screen.queryByText('spf-value')).not.toBeInTheDocument();
	});

	test('displays SPF header when provided', () => {
		const authenticationHeaders = {
			spf: { value: 'spf-value', pass: true }
		};

		setupTest(<MailAuthenticationHeadersSubsection authenticationInfo={authenticationHeaders} />);
		expect(screen.getByText('Authentication Headers')).toBeInTheDocument();
		expect(screen.queryByText('DKIM:')).not.toBeInTheDocument();
		expect(screen.queryByText('dkim-value')).not.toBeInTheDocument();
		expect(screen.queryByText('DMARC:')).not.toBeInTheDocument();
		expect(screen.queryByText('dmarc-value')).not.toBeInTheDocument();
		expect(screen.getByText('SPF:')).toBeInTheDocument();
		expect(screen.getByText('spf-value')).toBeInTheDocument();
	});
});
