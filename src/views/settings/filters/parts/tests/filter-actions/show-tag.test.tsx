/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { ShowTag } from 'views/settings/filters/parts/filter-actions/show-tag';

const BLACK = '#000000';
const COLOR_2 = '#29B6F6';
describe('Show Tag', () => {
	it('should render the tag input', async () => {
		setupTest(<ShowTag value={[]} tagOptions={[]} onTagChange={vi.fn()} />);

		expect(screen.getByText('Tag')).toBeVisible();
	});

	it('should call onChange with the chosen value', async () => {
		const onChangeFn = vi.fn();
		const tagOptions = [
			{
				label: 'tag option 1',
				color: 6
			}
		];

		const { user } = setupTest(
			<ShowTag value={[]} tagOptions={tagOptions} onTagChange={onChangeFn} />
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
		const tagOptions = [
			{
				label: 'tag option 1'
			}
		];

		const { user } = setupTest(
			<ShowTag value={[]} tagOptions={tagOptions} onTagChange={vi.fn()} />
		);

		await user.click(screen.getByText('Tag'));
		const dropdown = await screen.findByTestId('dropdown-popper-list');

		expect(within(dropdown).getByTestId('icon: Tag')).toBeVisible();
	});
	it('should render the option with a black tag avatar if tag has no color', async () => {
		const tagName = 'tag option 1';
		const tagOptions = [
			{
				label: tagName
			}
		];

		const { user } = setupTest(
			<ShowTag value={[]} tagOptions={tagOptions} onTagChange={vi.fn()} />
		);

		await user.click(screen.getByText('Tag'));
		const dropdown = await screen.findByTestId('dropdown-popper-list');

		expect(within(dropdown).getByTestId(`tag-option-${tagName}-${BLACK}`)).toBeVisible();
	});

	it('should render added chip with the tag avatar', async () => {
		const tagName = 'tag option 1';
		const value = {
			label: tagName
		};
		setupTest(<ShowTag value={[value]} tagOptions={[]} onTagChange={vi.fn()} />);

		expect(
			within(screen.getByTestId(`tag-${tagName}-${BLACK}`)).getByTestId('icon: Tag')
		).toBeVisible();
	});

	it('should display the tag with the same color of corresponding option', async () => {
		const tagName = 'Test Designer';
		setupTest(
			<ShowTag
				tagOptions={[
					{
						label: tagName,
						color: 2 // See Zimbra Colors variable: #29B6F6
					}
				]}
				value={[{ label: tagName }]}
				onTagChange={vi.fn()}
			/>,
			{}
		);
		expect(screen.getByTestId(`tag-${tagName}-${COLOR_2}`)).toBeVisible();
	});
});
