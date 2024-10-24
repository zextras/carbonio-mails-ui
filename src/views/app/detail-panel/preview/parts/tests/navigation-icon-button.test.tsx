/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { setupTest, screen } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { NavigationIconButton } from '../navigation-icon-button';

describe('NavigationIconButton', () => {
	test('renders correctly', () => {
		const item = {
			tooltipLabel: 'test-tooltip',
			disabled: false,
			icon: 'ArrowIosForward',
			action: jest.fn()
		};
		setupTest(<NavigationIconButton item={item} />);

		const button = screen.getByRoleWithIcon('button', { icon: 'icon: ArrowIosForward' });

		expect(button).toBeVisible();
	});
	test('if item is disabled, icon is disabled', () => {
		const item = {
			tooltipLabel: 'test-tooltip',
			disabled: true,
			icon: 'ArrowIosForward',
			action: jest.fn()
		};

		setupTest(<NavigationIconButton item={item} />);

		const button = screen.getByRoleWithIcon('button', { icon: 'icon: ArrowIosForward' });

		expect(button).toBeDisabled();
	});
	test('on hover will show a tooltip', async () => {
		const tooltipLabel = 'test tooltip';
		const item = {
			tooltipLabel,
			disabled: false,
			icon: 'ArrowIosForward',
			action: jest.fn()
		};

		const { user } = setupTest(<NavigationIconButton item={item} />);

		const button = screen.getByRoleWithIcon('button', { icon: 'icon: ArrowIosForward' });

		await user.hover(button);

		expect(await screen.findByText(tooltipLabel)).toBeVisible();
	});
	test('on click will call the item action', async () => {
		const action = jest.fn();

		const item = {
			tooltipLabel: 'test-tooltip',
			disabled: false,
			icon: 'ArrowIosForward',
			action
		};

		const { user } = setupTest(<NavigationIconButton item={item} />);

		const button = screen.getByRoleWithIcon('button', { icon: 'icon: ArrowIosForward' });

		await user.click(button);

		expect(action).toHaveBeenCalled();
	});
});
