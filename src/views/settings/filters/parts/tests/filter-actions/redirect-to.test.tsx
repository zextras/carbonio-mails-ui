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

	// TODO: check if we really wanna test the chipinput fallback of contact integration again here
	it.skip('it should call onChange with the typed value', async () => {
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

		// const inputElement = screen.getByRole('textbox', {
		// 	name: /address/i
		// });
		// const newValue = 'anothervalue@test.com';
		// await user.type(inputElement, newValue);
		// await user.type(inputElement, '[Enter]');

		// await waitFor(() => {
		// 	expect(onChangeFn).toHaveBeenCalledTimes(1);
		// });
		// expect(onChangeFn).toHaveBeenCalledWith(newValue);

		const redirectToAddressInput = await screen.findByTestId('filter-action-row-contact-input');
		await user.type(redirectToAddressInput, 'valid@email.it');
		await user.type(redirectToAddressInput, '[Enter]');
		expect(onChangeFn).toHaveBeenCalledWith([
			expect.objectContaining({ actionRedirect: [{ a: 'valid@email.it' }] })
		]);
	});
});
