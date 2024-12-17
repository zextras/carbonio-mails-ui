/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { t } from '@zextras/carbonio-shell-ui';

import { populateFoldersStore } from '../../../../../carbonio-ui-commons/test/mocks/store/folders';
import {
	makeListItemsVisible,
	setupTest
} from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../tests/generators/store';
import CreateFilterModal from '../create-filter-modal';

describe('create-filter-modal', () => {
	test('create button is disabled when filter name is empty', async () => {
		const store = generateStore();

		setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});

		const createButton = screen.getByRole('button', {
			name: /label\.create/i
		});
		expect(createButton).toBeDisabled();
	});
	test('create button is enabled only when filter name is added', async () => {
		const store = generateStore();

		const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});
		const filterInputElement = screen.getByRole('textbox', {
			name: 'settings.filter_name*'
		});
		await user.type(filterInputElement, 'My filter');

		const createButton = screen.getByRole('button', {
			name: /label\.create/i
		});
		expect(createButton).toBeEnabled();
	});

	test('"Active filter" is unchecked by default', async () => {
		const store = generateStore();

		setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});

		const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: Square'
		);
		expect(filterActiveUnChecked).toBeVisible();
	});
	test('clicking "Active filter" should check the checkbox', async () => {
		const store = generateStore();

		const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});
		const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: Square'
		);
		await act(() => user.click(filterActiveUnChecked));

		const filterActiveChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: CheckmarkSquare'
		);
		expect(filterActiveChecked).toBeVisible();
	});

	test('Filter conditions should be visible', async () => {
		const store = generateStore();

		const { user } = setupTest(<CreateFilterModal t={t} onClose={jest.fn()} />, {
			store
		});
		await user.click(screen.getByText(/settings\.field/i));

		const fieldAnyOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/label\.any/i
		);
		const fieldAllOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/label\.all/i
		);
		expect(fieldAnyOption).toBeInTheDocument();
		expect(fieldAllOption).toBeInTheDocument();
	});

	test('Move into folder action allows selecting junk folder', async () => {
		const closeModal = jest.fn();
		const store = generateStore();
		populateFoldersStore();
		const { user } = setupTest(<CreateFilterModal t={t} onClose={(): void => closeModal()} />, {
			store
		});
		await user.click(screen.getByText('Keep in Inbox'));

		await user.click(screen.getByText('Move Into Folder'));
		const button = screen.getByRole('button', {
			name: 'Browse'
		});
		await act(async () => {
			await user.click(button);
		});

		makeListItemsVisible();
		act(() => {
			jest.advanceTimersByTime(500);
		});
		expect(screen.getByText(/junk/i)).toBeVisible();
	});
});
