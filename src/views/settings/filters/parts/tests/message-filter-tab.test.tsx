/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { useSnackbar } from '@zextras/carbonio-design-system';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../tests/generators/store';
import { mockFilter } from '../../tests/utils.test';
import { getFilterActions } from '../filter-actions';
import { MessageFilterTab } from '../message-filter-tab';

jest.mock('@zextras/carbonio-design-system', () => ({
	...jest.requireActual('@zextras/carbonio-design-system'),
	useSnackbar: jest.fn()
}));
const createSnackbarSpy = jest.fn((arg) => arg);

describe('Message filters tab', () => {
	it('should call onConfirm with filters as declared in initial order when clicking save button when modifying a filter', async () => {
		(useSnackbar as jest.Mock).mockReturnValue(createSnackbarSpy);
		const store = generateStore();
		const filters = [mockFilter({ name: 'Test filter 1' }), mockFilter({ name: 'Test filter 2' })];
		const getFilters = (): Promise<any> =>
			Promise.resolve({ filterRules: [{ filterRule: filters }] });
		const mockSave = jest.fn();
		mockSave.mockReturnValue(Promise.resolve());
		getFilterActions(true, mockSave);

		const { user } = setupTest(
			<MessageFilterTab
				getFilters={getFilters}
				FilterActionsComponent={getFilterActions(true, mockSave)}
			/>,
			{
				store
			}
		);

		const filter1 = await screen.findByText('Test filter 1');
		expect(filter1).toBeVisible();
		await user.click(filter1);
		await user.click(await screen.findByRole('button', { name: 'Edit' }));
		const saveButton = screen.getByRole('button', {
			name: 'Save'
		});
		await user.click(saveButton);

		expect(mockSave).toHaveBeenCalledWith(filters);
	});
});
