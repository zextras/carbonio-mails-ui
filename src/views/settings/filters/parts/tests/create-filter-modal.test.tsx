/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
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
	test('create filter add filter name and by default it will be inactive (in available filters)', async () => {
		const closeModal = jest.fn();
		const store = generateStore();

		const { user } = setupTest(<CreateFilterModal t={t} onClose={(): void => closeModal()} />, {
			store
		});

		expect(screen.getByTestId('filter-name')).toBeInTheDocument();
		const filterName = screen.getByTestId('filter-name');
		const name = faker.lorem.word();
		const filterInputElement = within(filterName).getByRole('textbox');
		await user.clear(filterInputElement);

		// Insert the new filter name into the text input
		await act(() => user.type(filterInputElement, name));

		const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: Square'
		);
		expect(filterActiveUnChecked).toBeInTheDocument();
		await act(() => user.click(filterActiveUnChecked));

		const filterActiveChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: CheckmarkSquare'
		);

		expect(filterActiveChecked).toBeInTheDocument();
	});

	test('create button will be disabled and enabled only once filter name is added', async () => {
		const closeModal = jest.fn();
		const store = generateStore();

		const { user } = setupTest(<CreateFilterModal t={t} onClose={(): void => closeModal()} />, {
			store
		});

		const createButton = screen.getByRole('button', {
			name: /label\.create/i
		});
		expect(createButton).toBeDisabled();
		expect(screen.getByTestId('filter-name')).toBeInTheDocument();
		const filterName = screen.getByTestId('filter-name');
		const name = faker.lorem.word();
		const filterInputElement = within(filterName).getByRole('textbox');
		await user.clear(filterInputElement);

		// Insert the new filter name into the text input
		await user.type(filterInputElement, name);

		// filter name added so now create button should be enabled
		expect(createButton).toBeEnabled();
	});

	test('create filter add filter name and add condition', async () => {
		const closeModal = jest.fn();
		const store = generateStore();

		const { user } = setupTest(<CreateFilterModal t={t} onClose={(): void => closeModal()} />, {
			store
		});

		expect(screen.getByTestId('filter-name')).toBeInTheDocument();
		const filterName = screen.getByTestId('filter-name');
		const name = faker.lorem.word();
		const filterInputElement = within(filterName).getByRole('textbox');
		await act(() => user.clear(filterInputElement));

		// Insert the new filter name into the text input
		await act(() => user.type(filterInputElement, name));

		const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: Square'
		);
		expect(filterActiveUnChecked).toBeInTheDocument();
		await act(() => user.click(filterActiveUnChecked));

		const filterActiveChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: CheckmarkSquare'
		);
		expect(filterActiveChecked).toBeInTheDocument();
		act(() => {
			jest.advanceTimersByTime(5000);
		});

		const fieldLabel = screen.getByText(/settings\.field/i);
		expect(fieldLabel).toBeInTheDocument();

		await act(() => user.click(fieldLabel));

		const fieldAnyOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/label\.any/i
		);
		const fieldAllOption = within(screen.getByTestId('dropdown-popper-list')).getByText(
			/label\.all/i
		);
		expect(fieldAnyOption).toBeInTheDocument();
		expect(fieldAllOption).toBeInTheDocument();

		const createButton = screen.getByRole('button', {
			name: /label\.create/i
		});
		expect(createButton).toBeEnabled();
	});

	test('junk folder is selectable', async () => {
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
