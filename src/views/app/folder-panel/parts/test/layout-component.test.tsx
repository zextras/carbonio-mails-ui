/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useLocalStorage } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { screen, setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { MAILS_VIEW_LAYOUTS } from '../../../../../constants';
import { generateStore } from '../../../../../tests/generators/store';
import { LayoutComponent } from '../layout-component';

const bottomViewOutlineIcon = 'icon: BottomViewOutline';
const layoutOutlineIcon = 'icon: LayoutOutline';

describe('LayoutComponent', () => {
	test('the icon has width 1.25rem', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.DEFAULT, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(layoutOutlineIcon)).toHaveStyle({ width: '1.25rem' });
	});
	test('the icon has height 1.25rem', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.DEFAULT, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(layoutOutlineIcon)).toHaveStyle({ height: '1.25rem' });
	});
	test('By default it should render LayoutOutlineIcon icon', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.DEFAULT, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(layoutOutlineIcon)).toBeInTheDocument();
	});
	test('When the value saved in the local storage is horizontal it should render LayoutOutlineIcon icon', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.HORIZONTAL, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(layoutOutlineIcon)).toBeInTheDocument();
	});
	test('When the value saved in the local storage is vertical it should render BottomViewOutline icon', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.VERTICAL, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(bottomViewOutlineIcon)).toBeInTheDocument();
	});
	test('onClick it should call the local storage function', async () => {
		const cb = jest.fn();
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.VERTICAL, cb]);
		const store = generateStore();

		const { user } = setupTest(<LayoutComponent />, { store });

		await user.click(screen.getByTestId(bottomViewOutlineIcon));

		expect(cb).toHaveBeenCalledTimes(1);
	});
	test('onHover during horizontal view it should render "Show vertical"', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.HORIZONTAL, jest.fn()]);
		const store = generateStore();

		const { user } = setupTest(<LayoutComponent />, { store });

		await user.hover(screen.getByTestId(layoutOutlineIcon));

		const tooltip = await screen.findByText('Vertical view');
		expect(tooltip).toBeVisible();
	});
	test('onHover during vertical view it should render "Show horizontal"', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.VERTICAL, jest.fn()]);
		const store = generateStore();

		const { user } = setupTest(<LayoutComponent />, { store });

		await user.hover(screen.getByTestId(bottomViewOutlineIcon));

		const tooltip = await screen.findByText('Horizontal view');
		expect(tooltip).toBeVisible();
	});
});
