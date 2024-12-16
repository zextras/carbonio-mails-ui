/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../../tests/generators/store';
import { ShowTag } from '../../filter-actions/show-tag';

describe('Show Tag', () => {
	it('it should render selected option in the input', async () => {
		const store = generateStore();

		setupTest(<ShowTag value={[]} tagOptions={[]} onTagChange={jest.fn()} />, {
			store
		});

		expect(screen.getByText('Tag')).toBeVisible();
	});

	it('it should call onChange with the choosen value', async () => {
		const store = generateStore();
		const onChangeFn = jest.fn();
		const tagOptions = [
			{
				avatarBackground: '#ffc107',
				avatarIcon: 'Tag' as const,
				background: 'gray2' as const,
				hasAvatar: true,
				label: 'tag option 1',
				color: 6
			}
		];

		const { user } = setupTest(
			<ShowTag value={[]} tagOptions={tagOptions} onTagChange={onChangeFn} />,
			{
				store
			}
		);

		await user.click(screen.getByText('Tag'));
		await screen.findByTestId('dropdown-popper-list');

		await user.click(screen.getByText(tagOptions[0].label));

		expect(onChangeFn).toHaveBeenCalledTimes(1);
		expect(onChangeFn).toHaveBeenCalledWith([
			{
				avatarBackground: '#ffc107',
				avatarIcon: 'Tag',
				background: 'gray2',
				hasAvatar: true,
				label: 'tag option 1'
			}
		]);
	});
});
