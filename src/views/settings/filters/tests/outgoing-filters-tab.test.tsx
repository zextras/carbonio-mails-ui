/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { OutgoingFiltersTab } from '../outgoing-filters-tab';
import { mockFilter } from './test-utils';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

describe('Outgoing Filters', () => {
	it('should not contain "Apply" filter action', async () => {
		createSoapAPIInterceptor('GetOutgoingFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [mockFilter({ name: 'Filter 1' })]
				}
			]
		});
		setupTest(<OutgoingFiltersTab />);

		await screen.findByText('Filter 1');

		expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
	});
});
