/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../../tests/generators/store';
import { MarkAsOption } from '../../../../../../types';
import { MarkAs } from '../../filter-actions/mark-as';

describe('Mark As', () => {
	it('it should render selected option in the input', async () => {
		const store = generateStore();
		const options: MarkAsOption[] = [
			{ label: 'label 1', value: { actionFlag: [{ flagName: '1' }] } },
			{ label: 'label 2', value: { actionFlag: [{ flagName: '2' }] } }
		];
		const selectedOption = { flagName: '1' };

		setupTest(<MarkAs options={options} onChange={jest.fn()} selected={selectedOption} />, {
			store
		});

		expect(screen.getByText('label 1')).toBeVisible();
	});

	it('it should call onChange with the chosen value', async () => {
		const store = generateStore();
		const options: MarkAsOption[] = [
			{ label: 'label 1', value: { actionFlag: [{ flagName: '1' }] } },
			{ label: 'label 2', value: { actionFlag: [{ flagName: '2' }] } }
		];
		const selectedOption = { flagName: '1' };
		const secondOption = options[1];

		const onChangeFn = jest.fn();
		const { user } = setupTest(
			<MarkAs options={options} onChange={onChangeFn} selected={selectedOption} />,
			{
				store
			}
		);

		await user.click(screen.getByText('label 1'));
		await user.click(screen.getByText(secondOption.label));

		expect(onChangeFn).toHaveBeenCalledTimes(1);
		expect(onChangeFn).toHaveBeenCalledWith(secondOption.value);
	});
});
