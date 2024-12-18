/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, within } from '@testing-library/react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../../tests/generators/store';
import { ShowTag } from '../../filter-actions/show-tag';

const BLACK = '#000000';
describe('Show Tag', () => {
	it('should render the tag input', async () => {
		const store = generateStore();

		setupTest(<ShowTag value={[]} tagOptions={[]} onTagChange={jest.fn()} />, {
			store
		});

		expect(screen.getByText('Tag')).toBeVisible();
	});

	it('should call onChange with the chosen value', async () => {
		const store = generateStore();
		const onChangeFn = jest.fn();
		const tagOptions = [
			{
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
				label: 'tag option 1',
				color: 6
			}
		]);
	});

	it('should render the option with the tag avatar', async () => {
		const store = generateStore();
		const tagOptions = [
			{
				label: 'tag option 1'
			}
		];

		const { user } = setupTest(
			<ShowTag value={[]} tagOptions={tagOptions} onTagChange={jest.fn()} />,
			{
				store
			}
		);

		await user.click(screen.getByText('Tag'));
		const dropdown = await screen.findByTestId('dropdown-popper-list');

		expect(within(dropdown).getByTestId('icon: Tag')).toBeVisible();
	});
	it('should render the option with a black tag avatar if tag has no color', async () => {
		const store = generateStore();
		const tagName = 'tag option 1';
		const tagOptions = [
			{
				label: tagName
			}
		];

		const { user } = setupTest(
			<ShowTag value={[]} tagOptions={tagOptions} onTagChange={jest.fn()} />,
			{
				store
			}
		);

		await user.click(screen.getByText('Tag'));
		const dropdown = await screen.findByTestId('dropdown-popper-list');

		expect(within(dropdown).getByTestId(`tag-option-${tagName}-${BLACK}`)).toBeVisible();
	});

	it('should render added chip with the tag avatar', async () => {
		const store = generateStore();
		const value = {
			label: 'tag option 1'
		};
		setupTest(<ShowTag value={[value]} tagOptions={[]} onTagChange={jest.fn()} />, {
			store
		});

		expect(within(screen.getByTestId('chip')).getByTestId('icon: Tag')).toBeVisible();
	});
});
