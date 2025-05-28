/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { DistributionListIcon } from '../distribution-list-icon';
import { setupTest } from '@test-setup';

describe('DistributionListIcon', () => {
	it('correctly renders the component', async () => {
		const { user } = setupTest(<DistributionListIcon />);
		const icon = screen.getByTestId('distribution-list-icon');
		expect(icon).toBeInTheDocument();
		await user.hover(icon);
		expect(await screen.findByText('This email is from a Distribution List')).toBeInTheDocument();
	});
});
