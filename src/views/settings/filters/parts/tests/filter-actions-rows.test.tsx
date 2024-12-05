/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

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
});
