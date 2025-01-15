/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { useSnackbar } from '@zextras/carbonio-design-system';

import { createSoapAPIInterceptor } from '../../../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { makeListItemsVisible, setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../tests/generators/store';
import { IncomingFiltersTab } from '../incoming-filters-tab';
import { mockFilter } from './test-utils';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));

describe('Incoming Filters', () => {
	it('should include "Apply" filter action', async () => {
		const store = generateStore();
		const getIncomingFiltersInterceptor = createSoapAPIInterceptor('GetFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [mockFilter({ name: 'Filter 1' })]
				}
			]
		});
		setupTest(<IncomingFiltersTab />, { store });
		await getIncomingFiltersInterceptor;

		expect(screen.getByRole('button', { name: 'Apply' })).toBeVisible();
	});
	it('should display incoming filters received from API', async () => {
		const store = generateStore();
		const getIncomingFiltersInterceptor = createSoapAPIInterceptor('GetFilterRules', {
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
		setupTest(<IncomingFiltersTab />, { store });
		await getIncomingFiltersInterceptor;

		expect(await screen.findByText('Filter 1')).toBeVisible();
	});
	it('should call ModifyFilterRules API with all incoming filters when saving modified filter', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const modifyIncomingFiltersInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const mockedFilter1 = mockFilter({ name: 'Filter 1' });
		const otherFilters = [mockFilter({ name: 'Filter 2' }), mockFilter({ name: 'Filter 3' })];
		const getIncomingFiltersInterceptor = createSoapAPIInterceptor('GetFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [mockedFilter1, ...otherFilters]
				}
			]
		});
		const { user } = setupTest(<IncomingFiltersTab />, { store });
		await getIncomingFiltersInterceptor;
		const filter1 = await screen.findByText('Filter 1');
		await user.click(filter1);
		const modifyFilterBtn = await screen.findByRole('button', { name: 'Edit' });
		await user.click(modifyFilterBtn);
		makeAllItemsVisible();
		expect(screen.getByTestId('modal')).toBeVisible();
		const filterNameInput = screen.getByRole('textbox', {
			name: 'Filter Name*'
		});
		await user.clear(filterNameInput);
		await user.type(filterNameInput, 'Edited filter 1');
		const saveButton = screen.getByRole('button', {
			name: 'Save'
		});
		expect(saveButton).toBeEnabled();
		await user.click(saveButton);

		const modifyRequest = await modifyIncomingFiltersInterceptor;
		expect(modifyRequest).toEqual({
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: [{ ...mockedFilter1, name: 'Edited filter 1' }, ...otherFilters]
				}
			]
		});
	});
	it('should call ModifyFilterRules API with all incoming filters when creating a new filter', async () => {
		const store = generateStore();
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const modifyIncomingFiltersInterceptor = createSoapAPIInterceptor('ModifyFilterRules');
		const existingFilters = [mockFilter({ name: 'Filter 1' }), mockFilter({ name: 'Filter 2' })];
		const getIncomingFiltersInterceptor = createSoapAPIInterceptor('GetFilterRules', {
			_jsns: 'urn:zimbraMail',
			filterRules: [
				{
					filterRule: existingFilters
				}
			]
		});

		const { user } = setupTest(<IncomingFiltersTab />, { store });
		await getIncomingFiltersInterceptor;

		expect(await screen.findByText('Filter 1')).toBeVisible();
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
			expect.arrayContaining([
				...existingFilters,
				expect.objectContaining({ name: 'My new filter' })
			])
		);
	});
});

function makeAllItemsVisible(): void {
	makeListItemsVisible();
	act(() => {
		jest.advanceTimersByTime(1000);
	});
}
const createSnackbarSpy = jest.fn((arg) => arg);
