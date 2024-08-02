/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';

import { screen, setupTest, within } from '../../../../../carbonio-ui-commons/test/test-setup';
import { MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../../../../../constants';
import { TESTID_SELECTORS } from '../../../../../tests/constants';
import { mockLayoutStorage } from '../../../../../tests/layouts-utils';
import { LayoutComponent } from '../layout-component';

describe('LayoutComponent', () => {
	test('the icon has width 1.25rem', async () => {
		mockLayoutStorage();

		setupTest(<LayoutComponent />);

		expect(await screen.findByTestId(TESTID_SELECTORS.icons.layoutNoSplit)).toHaveStyle({
			width: '1.25rem'
		});
	});

	test('the icon has height 1.25rem', async () => {
		mockLayoutStorage();

		setupTest(<LayoutComponent />);

		expect(await screen.findByTestId(TESTID_SELECTORS.icons.layoutNoSplit)).toHaveStyle({
			height: '1.25rem'
		});
	});

	test('a chevron icon is displayed', () => {
		mockLayoutStorage();

		setupTest(<LayoutComponent />);

		expect(
			screen.getByRoleWithIcon('button', { icon: TESTID_SELECTORS.icons.chevronDown })
		).toBeVisible();
	});

	test('the layouts options are visible if the chevron is clicked', async () => {
		mockLayoutStorage();

		const { user } = setupTest(<LayoutComponent />);
		const chevron = screen.getByRoleWithIcon('button', {
			icon: TESTID_SELECTORS.icons.chevronDown
		});
		await act(async () => {
			await user.click(chevron);
		});
		const list = screen.getByTestId('dropdown-popper-list');

		// Check the dropdown has only 3 children
		expect(list.childNodes).toHaveLength(3);

		// Check each item
		expect(within(list).getByText('Vertical split')).toBeVisible();
		expect(within(list).getByTestId(TESTID_SELECTORS.icons.layoutVerticalSplit)).toBeVisible();
		expect(within(list).getByText('Horizontal split')).toBeVisible();
		expect(within(list).getByTestId(TESTID_SELECTORS.icons.layoutHorizontalSplit)).toBeVisible();
		expect(within(list).getByText('No split')).toBeVisible();
		expect(within(list).getByTestId(TESTID_SELECTORS.icons.layoutNoSplit)).toBeVisible();
	});

	test('if the current layout is "split" the button will render the "NoSplit" icon', async () => {
		mockLayoutStorage({ layout: MAILS_VIEW_LAYOUTS.SPLIT });
		setupTest(<LayoutComponent />);

		expect(await screen.findByTestId(TESTID_SELECTORS.icons.layoutNoSplit)).toBeInTheDocument();
	});

	test('if the current layout is "no split", and the last split orientation was vertical, the button will render the "vertical" icon', async () => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.FULL,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		});
		setupTest(<LayoutComponent />);

		expect(
			await screen.findByTestId(TESTID_SELECTORS.icons.layoutVerticalSplit)
		).toBeInTheDocument();
	});

	test('if the current layout is "no split", and the last split orientation was horizontal, the button will render the "horizontal" icon', async () => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.FULL,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL
		});
		setupTest(<LayoutComponent />);

		expect(
			await screen.findByTestId(TESTID_SELECTORS.icons.layoutHorizontalSplit)
		).toBeInTheDocument();
	});

	test('onClick will call the local storage function', async () => {
		const callback = jest.fn();
		mockLayoutStorage({ callback });

		const { user } = setupTest(<LayoutComponent />);
		await user.click(screen.getByTestId(TESTID_SELECTORS.icons.layoutNoSplit));

		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('onHover tooltip will render "Switch to no split"', async () => {
		mockLayoutStorage();

		const { user } = setupTest(<LayoutComponent />);
		await user.hover(screen.getByTestId(TESTID_SELECTORS.icons.layoutNoSplit));
		const tooltip = await screen.findByText('Switch to no split');

		expect(tooltip).toBeVisible();
	});

	test('onHover tooltip will render "Switch to vertical split"', async () => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.FULL,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		});

		const { user } = setupTest(<LayoutComponent />);
		await user.hover(screen.getByTestId(TESTID_SELECTORS.icons.layoutVerticalSplit));
		const tooltip = await screen.findByText('Switch to vertical split');

		expect(tooltip).toBeVisible();
	});

	test('onHover tooltip will render "Switch to horizontal split"', async () => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.FULL,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL
		});

		const { user } = setupTest(<LayoutComponent />);
		await user.hover(screen.getByTestId(TESTID_SELECTORS.icons.layoutHorizontalSplit));
		const tooltip = await screen.findByText('Switch to horizontal split');

		expect(tooltip).toBeVisible();
	});
});
