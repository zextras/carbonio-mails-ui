/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';

import { useLocalStorage } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { screen, setupTest, within } from '../../../../../carbonio-ui-commons/test/test-setup';
import { MAILS_VIEW_LAYOUTS } from '../../../../../constants';
import { TESTID_SELECTORS } from '../../../../../tests/constants';
import { generateStore } from '../../../../../tests/generators/store';
import { LayoutComponent } from '../layout-component';

const bottomViewOutlineIcon = 'icon: BottomViewOutline';
const layoutOutlineIcon = 'icon: LayoutOutline';

describe('LayoutComponent', () => {
	test('the icon has width 1.25rem', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(bottomViewOutlineIcon)).toHaveStyle({ width: '1.25rem' });
	});
	test('the icon has height 1.25rem', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(bottomViewOutlineIcon)).toHaveStyle({ height: '1.25rem' });
	});

	test('a chevron icon is displayed', () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT, jest.fn()]);

		setupTest(<LayoutComponent />);

		expect(
			screen.getByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.chevronDown })
		).toBeVisible();
	});

	test('the layouts options are visible if the chevron is clicked', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT, jest.fn()]);

		const { user } = setupTest(<LayoutComponent />);

		const chevron = screen.getByRoleWithIcon('button', {
			icon: TESTID_SELECTORS.icons.chevronDown
		});
		await act(async () => {
			await user.click(chevron);
		});

		// Check the dropdown has only 3 children
		const list = screen.getByTestId('dropdown-popper-list');
		expect(list.childNodes).toHaveLength(3);

		// Check each item
		expect(within(list).getByText('Vertical view')).toBeVisible();
		expect(within(list).getByTestId(TESTID_SELECTORS.icons.layoutVertical)).toBeVisible();
		expect(within(list).getByText('Horizontal view')).toBeVisible();
		expect(within(list).getByTestId(TESTID_SELECTORS.icons.layoutHorizontal)).toBeVisible();
		expect(within(list).getByText('Hide preview')).toBeVisible();
		expect(within(list).getByTestId(TESTID_SELECTORS.icons.layoutHidePreview)).toBeVisible();
	});

	test('in top to bottom layout icon will render LayoutOutlineIcon icon', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(layoutOutlineIcon)).toBeInTheDocument();
	});
	test('In left to right layout icon will render BottomViewOutline icon', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT, jest.fn()]);
		const store = generateStore();

		setupTest(<LayoutComponent />, { store });

		expect(await screen.findByTestId(bottomViewOutlineIcon)).toBeInTheDocument();
	});
	test('onClick will call the local storage function', async () => {
		const cb = jest.fn();
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT, cb]);
		const store = generateStore();

		const { user } = setupTest(<LayoutComponent />, { store });

		await user.click(screen.getByTestId(bottomViewOutlineIcon));

		expect(cb).toHaveBeenCalledTimes(1);
	});
	test('onHover tooltip will render "Show vertical"', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.TOP_TO_BOTTOM, jest.fn()]);
		const store = generateStore();

		const { user } = setupTest(<LayoutComponent />, { store });

		await user.hover(screen.getByTestId(layoutOutlineIcon));

		const tooltip = await screen.findByText('Vertical view');
		expect(tooltip).toBeVisible();
	});
	test('onHover tooltip will render "Show horizontal"', async () => {
		useLocalStorage.mockImplementation(() => [MAILS_VIEW_LAYOUTS.LEFT_TO_RIGHT, jest.fn()]);
		const store = generateStore();

		const { user } = setupTest(<LayoutComponent />, { store });

		await user.hover(screen.getByTestId(bottomViewOutlineIcon));

		const tooltip = await screen.findByText('Horizontal view');
		expect(tooltip).toBeVisible();
	});
});
