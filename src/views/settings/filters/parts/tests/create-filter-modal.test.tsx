/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { act, screen, within } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { t } from '@zextras/carbonio-shell-ui';
import CreateFilterModal from '../create-filter-modal';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../../../tests/generators/store';

describe('create-filter-modal', () => {
	test('create filter add filter name and by default it will be deactive', async () => {
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
		await user.type(filterInputElement, name);

		const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: Square'
		);
		expect(filterActiveUnChecked).toBeInTheDocument();
		await user.click(filterActiveUnChecked);

		const filterActiveChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: CheckmarkSquare'
		);

		expect(filterActiveChecked).toBeInTheDocument();
	});

	test('create button will be disable and enabled once filter name added', async () => {
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
		await user.clear(filterInputElement);

		// Insert the new filter name into the text input
		await user.type(filterInputElement, name);

		const filterActiveUnChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: Square'
		);
		expect(filterActiveUnChecked).toBeInTheDocument();
		await user.click(filterActiveUnChecked);

		const filterActiveChecked = within(screen.getByTestId('active-filter')).getByTestId(
			'icon: CheckmarkSquare'
		);
		expect(filterActiveChecked).toBeInTheDocument();
		act(() => {
			jest.advanceTimersByTime(5000);
		});

		const fieldLabel = screen.getByText(/settings\.field/i);
		expect(fieldLabel).toBeInTheDocument();

		await user.click(fieldLabel);

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
});
