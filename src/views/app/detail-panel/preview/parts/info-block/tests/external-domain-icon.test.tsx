/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { ExternalDomainIcon } from 'views/app/detail-panel/preview/parts/info-block/external-domain-icon';

describe('ExternalDomainIcon', () => {
	test('renders without crashing', async () => {
		const { user } = setupTest(<ExternalDomainIcon />);
		const icon = screen.getByTestId('external-domain-icon');
		expect(icon).toBeInTheDocument();
		await user.hover(icon);
		expect(await screen.findByText('This email is from an external Domain')).toBeInTheDocument();
	});
});
