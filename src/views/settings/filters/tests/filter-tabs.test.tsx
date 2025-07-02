/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { FilterTabs } from 'views/settings/filters/filter-tabs';
import { mockFilter } from 'views/settings/filters/tests/test-utils';

describe('FilterTabs', () => {
	it('should display Incoming and Outgoing filters tab titles', async () => {
		createSoapAPIInterceptor('GetFilterRules');

		await act(async () => {
			setupTest(<FilterTabs />);
		});

		expect(screen.getByText('Incoming Message Filters')).toBeVisible();
		expect(screen.getByText('Outgoing Message Filters')).toBeVisible();
	});

	it('should display Incoming filters by default', async () => {
		createSoapAPIInterceptor('GetFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
						mockFilter({ name: 'Incoming Filter 1' }),
						mockFilter({ name: 'Incoming Filter 2' })
					]
				}
			]
		});

		setupTest(<FilterTabs />);

		expect(await screen.findByText('Incoming Filter 1')).toBeVisible();
		expect(screen.getByText('Incoming Filter 2')).toBeVisible();
	});

	it('should display Outgoing filters when selecting Outgoing tab', async () => {
		const getIncomingFiltersInterceptor = createSoapAPIInterceptor('GetFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [
						mockFilter({ name: 'Incoming Filter 1' }),
						mockFilter({ name: 'Incoming Filter 2' })
					]
				}
			]
		});

		const getOutgoingFiltersInterceptor = createSoapAPIInterceptor('GetOutgoingFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [mockFilter({ name: 'Outgoing Filter A' })]
				}
			]
		});

		const { user } = setupTest(<FilterTabs />);
		await getIncomingFiltersInterceptor;
		expect(await screen.findByText('Incoming Filter 1')).toBeVisible();
		expect(screen.getByText('Incoming Filter 2')).toBeVisible();
		await user.click(screen.getByText('Outgoing Message Filters'));
		await getOutgoingFiltersInterceptor;

		expect(await screen.findByText('Outgoing Filter A')).toBeVisible();
		expect(screen.queryByText('Incoming Filter 1')).not.toBeInTheDocument();
		expect(screen.queryByText('Incoming Filter 2')).not.toBeInTheDocument();
	});
});
