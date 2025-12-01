/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import FilterModule from 'views/settings/filters';

describe('FilterModule', () => {
	it('renders FormSection with id="filters" for anchor navigation', async () => {
		createSoapAPIInterceptor('GetFilterRules');
		const { container } = await act(async () => setupTest(<FilterModule />));
		const el = container.querySelector('#filters');

		expect(el).toBeInTheDocument();
	});
});
