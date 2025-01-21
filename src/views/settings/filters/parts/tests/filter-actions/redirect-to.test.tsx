/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../../tests/generators/store';
import { RedirectTo } from '../../filter-actions/redirect-to';

describe('Redirect To', () => {
	it('it should render selected option in the input', async () => {
		const store = generateStore();
		const label = 'test label';
		setupTest(
			<RedirectTo
				defaultValue={[
					{
						label,
						value: {
							id: 'id',
							email: 'test value',
							type: 'CONTACT'
						}
					}
				]}
				onChange={jest.fn()}
			/>,
			{
				store
			}
		);

		expect(screen.getByText('test label')).toBeVisible();
	});
	it('it should call onChange only when adding the first value', async () => {
		const store = generateStore();
		const onChangeFn = jest.fn();

		const { user } = setupTest(<RedirectTo defaultValue={[]} onChange={onChangeFn} />, {
			store
		});

		const redirectToAddressInput = await screen.findByTestId('filter-action-row-contact-input');
		await user.type(redirectToAddressInput, 'valid@email.it');
		await user.type(redirectToAddressInput, '[Enter]');
		expect(onChangeFn).toHaveBeenCalledWith([
			expect.objectContaining({
				label: 'valid@email.it'
			})
		]);
	});
	it('it should not call onChange if adding a second value (max 1 chip)', async () => {
		const store = generateStore();
		const onChangeFn = jest.fn();
		const label = 'test label';

		const { user } = setupTest(
			<RedirectTo
				defaultValue={[
					{
						label,
						value: {
							id: 'id',
							email: 'test@email.it',
							type: 'CONTACT'
						}
					}
				]}
				onChange={onChangeFn}
			/>,
			{
				store
			}
		);

		const redirectToAddressInput = await screen.findByTestId('filter-action-row-contact-input');
		await user.type(redirectToAddressInput, 'valid@email.it');
		await user.type(redirectToAddressInput, '[Enter]');
		expect(onChangeFn).not.toHaveBeenCalled();
	});
});
