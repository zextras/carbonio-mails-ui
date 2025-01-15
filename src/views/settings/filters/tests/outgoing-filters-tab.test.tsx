/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';
import { useSnackbar } from '@zextras/carbonio-design-system';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../tests/generators/store';
import { OutgoingFiltersTab } from '../outgoing-filters-tab';
import { makeAllItemsVisible, mockFilter } from './test-utils';

const createSnackbarSpy = jest.fn((arg) => arg);

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

describe('Outgoing Filters', () => {
	it('should not contain "Apply" filter action', async () => {
		const store = generateStore();
		const getOutgoingFiltersInterceptor = createSoapAPIInterceptor('GetOutgoingFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [mockFilter({ name: 'Filter 1' })]
				}
			]
		});
		setupTest(<OutgoingFiltersTab />, { store });
		await getOutgoingFiltersInterceptor;

		expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
	});
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
	it('should call ModifyFilterRules API with outgoing filter when creating a new filter', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const modifyIncomingFiltersInterceptor = createSoapAPIInterceptor('ModifyOutgoingFilterRules');
		const getOutgoingFiltersInterceptor = createSoapAPIInterceptor('GetOutgoingFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: []
				}
			]
		});

		const { user } = setupTest(<OutgoingFiltersTab />, { store });
		await getOutgoingFiltersInterceptor;

		const createFilterBtn = await screen.findByRole('button', { name: 'Create' });
		await user.click(createFilterBtn);
		makeAllItemsVisible();
		const createModal = screen.getByTestId('modal');
		expect(createModal).toBeVisible();
		const filterNameInput = screen.getByRole('textbox', {
			name: 'Filter Name*'
		});
		await user.clear(filterNameInput);
		await user.type(filterNameInput, 'My new filter');
		const saveButton = within(createModal).getByRole('button', {
			name: 'Create'
		});
		expect(saveButton).toBeEnabled();
		await user.click(saveButton);

		const modifyRequest = (await modifyIncomingFiltersInterceptor) as any;
		expect(modifyRequest.filterRules[0].filterRule).toEqual(
			expect.arrayContaining([expect.objectContaining({ name: 'My new filter' })])
		);
	});
});
