/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { DistributionListIcon } from '../distribution-list-icon';

describe('DistributionListIcon', () => {
	it('correctly renders the component', async () => {
		const { user } = setupTest(<DistributionListIcon messageIsFromDistributionList />);
		const icon = screen.getByTestId('distribution-list-icon');
		expect(icon).toBeInTheDocument();
		await user.hover(icon);
		expect(await screen.findByText('This email is from a Distribution List')).toBeInTheDocument();
	});

	it('returns empty fragment when message is not from a distribution list', () => {
		setupTest(<DistributionListIcon messageIsFromDistributionList={false} />);
		expect(screen.queryByTestId('distribution-list-icon')).not.toBeInTheDocument();
	});
});
