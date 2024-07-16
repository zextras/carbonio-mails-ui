/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import { AccountSettings } from '@zextras/carbonio-shell-ui';
import { times } from 'lodash';

import { generateSettings } from '../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { screen, setupTest, within } from '../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../tests/generators/store';
import type { InputProps } from '../../../types';
import TrusteeAddresses from '../trustee-addresses';

const FIND_TIMEOUT = 2000;
const TRUSTEE_LIST = 'trustee-list';

const buildProps = ({
	settingsObj = {},
	updateSettings = jest.fn()
}: Partial<InputProps>): InputProps => ({
	settingsObj,
	updateSettings
});

describe('Trustee addresses settings', () => {
	it('should render the section title', () => {
		setupTest(<TrusteeAddresses {...buildProps({})} />);
		expect(screen.getByText('label.trusted_addresses')).toBeVisible();
	});
	it('should render the section message', () => {
		setupTest(<TrusteeAddresses {...buildProps({})} />);
		expect(screen.getByText('messages.trustee_addresses')).toBeVisible();
	});
	it('should render the "add" button', () => {
		setupTest(<TrusteeAddresses {...buildProps({})} />);
		expect(screen.getByRole('button', { name: 'label.add' })).toBeVisible();
	});

	it('should render the input field for the trustee email or domain name', () => {
		setupTest(<TrusteeAddresses {...buildProps({})} />);
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_email_address' });
		expect(nameInput).toBeVisible();
	});

	it('should render the list of trustee addresses', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();

		const trusteeAddressArray: Array<string> = times(3, () => faker.internet.email());
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefMailTrustedSenderList: trusteeAddressArray
			}
		};
		const { prefs } = generateSettings(customSettings);
		setupTest(<TrusteeAddresses updateSettings={updateSettings} settingsObj={prefs} />, { store });

		await screen.findByText(trusteeAddressArray[0], undefined, { timeout: FIND_TIMEOUT });
		trusteeAddressArray.forEach((trusteeAdress) => {
			expect(screen.getByText(trusteeAdress)).toBeVisible();
		});
	});

	it('should display a delete button when user hover on the trustee address item', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();

		const trusteeAddressArray: Array<string> = times(1, () => faker.internet.email());
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefMailTrustedSenderList: trusteeAddressArray
			}
		};
		const { prefs } = generateSettings(customSettings);

		const { user } = setupTest(
			<TrusteeAddresses updateSettings={updateSettings} settingsObj={prefs} />,
			{ store }
		);

		await screen.findByText(trusteeAddressArray[0], undefined, { timeout: FIND_TIMEOUT });
		trusteeAddressArray.forEach((trusteeAdress) => {
			expect(screen.getByText(trusteeAdress)).toBeVisible();
		});

		const list = screen.getByTestId(TRUSTEE_LIST);
		const listItem = await within(list).findByText(trusteeAddressArray[0]);
		await act(async () => {
			await user.hover(listItem);
		});
		const button = await screen.findByRole('button', { name: 'label.remove_one' });
		expect(button).toBeVisible();
	});

	it('should remove the trustee address from the list if the remove button is clicked', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();
		const trusteeAddressArray: Array<string> = times(1, () => faker.internet.email());
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefMailTrustedSenderList: trusteeAddressArray
			}
		};
		const { prefs } = generateSettings(customSettings);
		const { user } = setupTest(
			<TrusteeAddresses updateSettings={updateSettings} settingsObj={prefs} />,
			{ store }
		);

		await screen.findByText(trusteeAddressArray[0], undefined, { timeout: FIND_TIMEOUT });
		trusteeAddressArray.forEach((trusteeAdress) => {
			expect(screen.getByText(trusteeAdress)).toBeVisible();
		});
		const list = screen.getByTestId(TRUSTEE_LIST);
		const listItem = await within(list).findByText(trusteeAddressArray[0]);
		await act(async () => {
			await user.hover(listItem);
		});
		const button = await screen.findByRole('button', { name: 'label.remove_one' });
		expect(button).toBeVisible();
		user.click(button);
	});

	it('should add new trustee address in the list of trustee addresses', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();
		const newTrusteeAddress = faker.internet.email();

		const trusteeAddressArray: Array<string> = times(3, () => faker.internet.email());
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				zimbraPrefMailTrustedSenderList: trusteeAddressArray
			}
		};
		const { prefs } = generateSettings(customSettings);
		const { user } = setupTest(
			<TrusteeAddresses updateSettings={updateSettings} settingsObj={prefs} />,
			{ store }
		);
		trusteeAddressArray.forEach((trusteeAdress) => {
			expect(screen.getByText(trusteeAdress)).toBeVisible();
		});
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_email_address' });
		expect(nameInput).toBeVisible();
		await user.type(nameInput, newTrusteeAddress);
		const addButton = screen.getByRole('button', { name: 'label.add' });
		await act(() => user.click(addButton));

		const list = screen.getByTestId(TRUSTEE_LIST);
		const listItem = await within(list).findByText(newTrusteeAddress);
		expect(listItem).toBeVisible();
	});
});
