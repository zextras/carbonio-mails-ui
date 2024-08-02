/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';

import { useLocalStorage } from '../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { screen, setupTest, within } from '../../../../../carbonio-ui-commons/test/test-setup';
import {
	LOCAL_STORAGE_LAYOUT,
	LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION,
	MAILS_VIEW_LAYOUTS,
	MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS
} from '../../../../../constants';
import { TESTID_SELECTORS } from '../../../../../tests/constants';
import { MailsListLayout, MailsSplitLayoutOrientation } from '../../../../folder-view';
import { LayoutComponent } from '../layout-component';

const mockLayoutStorage = ({
	layout = MAILS_VIEW_LAYOUTS.SPLIT,
	splitOrientation = MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL,
	callback = jest.fn()
}: {
	layout?: MailsListLayout;
	splitOrientation?: MailsSplitLayoutOrientation;
	callback?: typeof jest.fn;
} = {}): void => {
	useLocalStorage.mockImplementation(
		(key): [MailsListLayout | MailsSplitLayoutOrientation | undefined, typeof jest.fn] => {
			if (key === LOCAL_STORAGE_LAYOUT) {
				return [layout, callback];
			}
			if (key === LOCAL_STORAGE_SPLIT_LAYOUT_ORIENTATION) {
				return [splitOrientation, callback];
			}

			return [undefined, callback];
		}
	);
};

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

	test('onHover tooltip will render "Hide preview"', async () => {
		mockLayoutStorage();

		const { user } = setupTest(<LayoutComponent />);
		await user.hover(screen.getByTestId(TESTID_SELECTORS.icons.layoutNoSplit));
		const tooltip = await screen.findByText('Hide preview');

		expect(tooltip).toBeVisible();
	});

	test('onHover tooltip will render "Switch to vertical"', async () => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.FULL,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
		});

		const { user } = setupTest(<LayoutComponent />);
		await user.hover(screen.getByTestId(TESTID_SELECTORS.icons.layoutVerticalSplit));
		const tooltip = await screen.findByText('Switch to vertical');

		expect(tooltip).toBeVisible();
	});

	test('onHover tooltip will render "Switch to horizontal"', async () => {
		mockLayoutStorage({
			layout: MAILS_VIEW_LAYOUTS.FULL,
			splitOrientation: MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.HORIZONTAL
		});

		const { user } = setupTest(<LayoutComponent />);
		await user.hover(screen.getByTestId(TESTID_SELECTORS.icons.layoutHorizontalSplit));
		const tooltip = await screen.findByText('Switch to horizontal');

		expect(tooltip).toBeVisible();
	});
});
