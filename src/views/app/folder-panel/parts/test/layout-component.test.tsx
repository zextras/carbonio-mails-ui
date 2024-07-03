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
const LayoutOutlineIcon = 'icon: LayoutOutline';

describe('LayoutComponent', () => {
	test('By default it should render LayoutOutlineIcon icon', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.DEFAULT, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(LayoutOutlineIcon)).toBeInTheDocument();
	});
	test('When the value saved in the local storage is horizontal it should render LayoutOutlineIcon icon', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.HORIZONTAL, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(LayoutOutlineIcon)).toBeInTheDocument();
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
});
