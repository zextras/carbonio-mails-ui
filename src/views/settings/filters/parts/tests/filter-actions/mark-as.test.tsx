/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { MarkAsOption } from 'types/filters';
import { MarkAs } from 'views/settings/filters/parts/filter-actions/mark-as';

describe('Mark As', () => {
	it('it should render selected option in the input', async () => {
		const options: MarkAsOption[] = [
			{ label: 'label 1', value: { actionFlag: [{ flagName: '1' }] } },
			{ label: 'label 2', value: { actionFlag: [{ flagName: '2' }] } }
		];
		const selectedOption = { flagName: '1' };

		setupTest(<MarkAs options={options} onChange={vi.fn()} selected={selectedOption} />);

		expect(screen.getByText('label 1')).toBeVisible();
	});

	it('it should call onChange with the chosen value', async () => {
		const options: MarkAsOption[] = [
			{ label: 'label 1', value: { actionFlag: [{ flagName: '1' }] } },
			{ label: 'label 2', value: { actionFlag: [{ flagName: '2' }] } }
		];
		const selectedOption = { flagName: '1' };
		const secondOption = options[1];

		const onChangeFn = vi.fn();
		const { user } = setupTest(
			<MarkAs options={options} onChange={onChangeFn} selected={selectedOption} />
		);

		await user.click(screen.getByText('label 1'));
		await user.click(screen.getByText(secondOption.label));

		expect(onChangeFn).toHaveBeenCalledTimes(1);
		expect(onChangeFn).toHaveBeenCalledWith(secondOption.value);
	});

	it('it should display empty option when initial value does not match any options', async () => {
		const options: MarkAsOption[] = [
			{ label: 'label 1', value: { actionFlag: [{ flagName: '1' }] } },
			{ label: 'label 2', value: { actionFlag: [{ flagName: '2' }] } }
		];
		const selectedOption = {};

		const onChangeFn = vi.fn();
		setupTest(<MarkAs options={options} onChange={onChangeFn} selected={selectedOption} />);

		expect(screen.queryByText('label 1')).not.toBeInTheDocument();
		expect(screen.queryByText('label 2')).not.toBeInTheDocument();
	});
});
