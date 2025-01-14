/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../tests/generators/store';
import { OutgoingFiltersTab } from '../outgoing-filters-tab';
import { mockFilter } from './utils.test';

describe('Outgoing Filters', () => {
	it('should display outgoing filters received from API', async () => {
		const store = generateStore();
		const getOutgoingFiltersInterceptor = createSoapAPIInterceptor('GetOutgoingFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
						mockFilter({ name: 'Filter 1' }),
						mockFilter({ name: 'Filter 2' }),
						mockFilter({ name: 'Filter 3' })
					]
				}
			]
		});
		setupTest(<OutgoingFiltersTab />, { store });
		await getOutgoingFiltersInterceptor;

		expect(await screen.findByText('Filter 1')).toBeVisible();
	});
});
