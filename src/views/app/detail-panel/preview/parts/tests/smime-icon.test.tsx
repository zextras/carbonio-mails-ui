/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { SmimeIcon } from '../smime-icon';

describe('SmimeIcon', () => {
	const validSignature = {
		certificate: {
			issuer: {
				trusted: true,
				name: 'Trusted CA'
			},
			email: 'user@example.com',
			notBefore: 1697884800000,
			notAfter: 1729420800000
		},
		type: 'smime',
		messageCode: 'VALID',
		message: 'Signature is valid.',
		valid: true
	};

	const invalidSignature = {
		...validSignature,
		valid: false,
		messageCode: 'INVALID',
		message: 'Signature is invalid.'
	};

	test('renders valid signature icon and tooltip', async () => {
		const { user } = setupTest(<SmimeIcon signature={validSignature} />);

		const icon = screen.getByTestId('smime-icon');
		expect(icon).toBeInTheDocument();

		await user.hover(icon);
		expect(await screen.findByText('Valid Signature')).toBeInTheDocument(); // Tooltip text
	});

	test('renders invalid signature icon and tooltip', async () => {
		const { user } = setupTest(<SmimeIcon signature={invalidSignature} />);

		const icon = screen.getByTestId('smime-icon');
		expect(icon).toBeInTheDocument();

		await user.hover(icon);
		expect(await screen.findByText('Invalid Signature')).toBeInTheDocument(); // Tooltip text
	});

	test('returns empty fragment when signature is undefined', () => {
		setupTest(<SmimeIcon signature={undefined} />);
		expect(screen.queryByTestId('smime-icon')).not.toBeInTheDocument();
	});
});
