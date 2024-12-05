/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import FilterActionRows from '../filter-action-rows';

describe('FilterActionsRows', () => {
	const comProps = {
		t: jest.fn(),
		isIncoming: true,
		setTempActions: jest.fn(),
		tempActions: [],
		zimbraFeatureMailForwardingInFiltersEnabled: 'TRUE' as const
	};
	test('minimal setup to not make the component explode', () => {
		setupTest(
			<FilterActionRows
				tmpFilter={{
					anything: [{ flagName: 'flagged' }]
				}}
				index={0}
				compProps={comProps}
			/>,
			{}
		);
	});
	it('should not display Contact Input when tmpFilter value is different from actionRedirect', async () => {
		setupTest(
			<FilterActionRows
				tmpFilter={{
					actionStop: [{ flagName: 'flagged' }]
				}}
				index={0}
				compProps={comProps}
			/>,
			{}
		);
		expect(screen.queryByTestId('filter-action-row-contact-input')).not.toBeInTheDocument();
	});
	it('should display Contact Input when selecting option "Redirect To Address"', async () => {
		setupTest(
			<FilterActionRows
				tmpFilter={{
					actionRedirect: [{ flagName: 'flagged' }]
				}}
				index={0}
				compProps={comProps}
			/>,
			{}
		);
		await screen.findByTestId('filter-action-row-contact-input');
	});
});
