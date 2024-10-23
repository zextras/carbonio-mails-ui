/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { ExternalDomainIcon } from '../external-domain-icon';

describe('ExternalDomainIcon', () => {
	test('renders without crashing', async () => {
		const { user } = setupTest(<ExternalDomainIcon fromExternalDomain />);
		const icon = screen.getByTestId('external-domain-icon');
		expect(icon).toBeInTheDocument();
		user.hover(icon);
		expect(await screen.findByText('Mail from external domain')).toBeInTheDocument();
	});

	test('returns empty fragment when fromExternalDomain is false', () => {
		setupTest(<ExternalDomainIcon fromExternalDomain={false} />);
		expect(screen.queryByTestId('external-domain-icon')).not.toBeInTheDocument();
	});
});
