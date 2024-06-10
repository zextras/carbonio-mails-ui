/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { act, fireEvent } from '@testing-library/react';
import { AccountSettings, AccountSettingsPrefs } from '@zextras/carbonio-shell-ui';
import { times } from 'lodash';

import { generateSettings } from '../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { UserEvent, screen, setupTest, within } from '../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../tests/generators/store';
import { SendersList, SendersListProps } from '../senders-list';

const SENDERS_LIST = 'senders-list';
const FIND_TIMEOUT = 2000;
const SENDERS_LIST_ITEM = 'senders-list-item';

const buildProps = ({
	settingsObj = { attrs: {}, prefs: {} },
	updateSettings = jest.fn(),
	listType = 'Allowed'
}: Partial<SendersListProps>): SendersListProps => ({
	settingsObj,
	updateSettings,
	listType
});

function setupSettings({
	blacklist = [],
	whitelist = []
}: {
	blacklist?: Array<string>;
	whitelist?: Array<string>;
} = {}): AccountSettingsPrefs {
	const customSettings: Partial<AccountSettings> = {
		attrs: {
			amavisBlacklistSender: blacklist,
			amavisWhitelistSender: whitelist
		}
	};
	const { attrs } = generateSettings(customSettings);

	return attrs;
}

async function addAddress(user: UserEvent, newSenderAddress: string): Promise<void> {
	const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
	await user.type(nameInput, newSenderAddress);
	const addButton = screen.getByRole('button', { name: 'label.add' });
	await act(() => user.click(addButton));
}

function buildAddresses(count: number): Array<string> {
	return times(count, () => faker.internet.email());
}

describe('Allowed sender list addresses settings', () => {
	it('should render the section title', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Allowed' })} />);
		expect(screen.getByText('label.allowed_addresses')).toBeVisible();
	});
	it('should render the section message', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Allowed' })} />);
		expect(screen.getByText('messages.allowed_addresses')).toBeVisible();
	});
	it('should render the "add" widget', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Allowed' })} />);
		expect(screen.getByRole('button', { name: 'label.add' })).toBeVisible();
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
		expect(nameInput).toBeVisible();
	});
});

describe('Blocked sender list addresses settings', () => {
	it('should render the section title', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Blocked' })} />);
		expect(screen.getByText('label.blocked_addresses')).toBeVisible();
	});
	it('should render the section message', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Blocked' })} />);
		expect(screen.getByText('messages.blocked_addresses')).toBeVisible();
	});
	it('should render the "add" widget', () => {
		setupTest(<SendersList {...buildProps({ listType: 'Blocked' })} />);
		expect(screen.getByRole('button', { name: 'label.add' })).toBeVisible();
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
		expect(nameInput).toBeVisible();
	});
	it('should add new sender address in the list of blocked addresses', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();
		const newSenderAddress = faker.internet.email();
		const prefs = setupSettings();

		const { user } = setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={prefs} listType="Blocked" />,
			{ store }
		);
		await addAddress(user, newSenderAddress);

		const list = screen.getByTestId(SENDERS_LIST);
		const listItem = await within(list).findByText(newSenderAddress);
		expect(listItem).toBeVisible();
	});

	it('should update settings when new sender address is added and list is empty', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();
		const newSenderAddress = faker.internet.email();
		const prefs = setupSettings();

		const { user } = setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={prefs} listType="Blocked" />,
			{ store }
		);
		await addAddress(user, newSenderAddress);

		expect(updateSettings).toBeCalledWith({
			target: { name: 'amavisBlacklistSender', value: [newSenderAddress] }
		});
	});

	it('should render list from settings', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();

		const senderAddressArray: Array<string> = times(3, () => faker.internet.email());
		const customSettings: Partial<AccountSettings> = {
			attrs: {
				amavisBlacklistSender: senderAddressArray
			}
		};
		const { attrs } = generateSettings(customSettings);
		setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={attrs} listType="Blocked" />,
			{ store }
		);
		senderAddressArray.forEach((address) => {
			expect(screen.getByText(address)).toBeVisible();
		});
	});

	it('should update settings when new sender address is added and list is NOT empty', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();
		const newSenderAddress = faker.internet.email();
		const senderAddressArray: Array<string> = times(3, () => faker.internet.email());
		const customSettings: Partial<AccountSettings> = {
			attrs: {
				amavisBlacklistSender: senderAddressArray
			}
		};
		const { attrs } = generateSettings(customSettings);

		const { user } = setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={attrs} listType="Blocked" />,
			{ store }
		);
		await addAddress(user, newSenderAddress);

		expect(updateSettings).toBeCalledWith({
			target: { name: 'amavisBlacklistSender', value: [...senderAddressArray, newSenderAddress] }
		});
	});

	it('should clean the input field after adding a new sender address', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();
		const newSenderAddress = faker.internet.email();
		const attrs = setupSettings();

		const { user } = setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={attrs} listType="Blocked" />,
			{ store }
		);
		await addAddress(user, newSenderAddress);

		const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
		expect(nameInput).toHaveValue('');
	});

	it('add button disabled with empty address', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();
		const attrs = setupSettings();

		setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={attrs} listType="Blocked" />,
			{ store }
		);

		expect(screen.getByRole('button', { name: 'label.add' })).toBeDisabled();
	});

	it('add button disabled with invalid address', async () => {
		const updateSettings = jest.fn();
		const attrs = setupSettings();
		const newSenderAddress = 'invalid';
		const { user } = setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={attrs} listType="Blocked" />
		);
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
		await user.type(nameInput, newSenderAddress);

		expect(screen.getByRole('button', { name: 'label.add' })).toBeDisabled();
		expect(screen.getByText('messages.invalid_sender_address')).toBeVisible();
	});

	it('should display existing allowed senders items', () => {
		const addresses = buildAddresses(42);
		const attrs = setupSettings({ whitelist: addresses });
		const updateSettings = jest.fn();

		setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={attrs} listType="Allowed" />
		);

		addresses.forEach((address) => {
			expect(screen.getByText(address)).toBeVisible();
		});
	});

	it('should not display any senders list items', () => {
		const attrsWithoutAddresses = setupSettings();
		const updateSettings = jest.fn();

		setupTest(
			<SendersList
				updateSettings={updateSettings}
				settingsObj={attrsWithoutAddresses}
				listType="Allowed"
			/>
		);

		expect(screen.queryByTestId(SENDERS_LIST_ITEM)).not.toBeInTheDocument();
	});

	it('should remove sender address from the list', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();
		const senderAddressArray: Array<string> = times(3, () => faker.internet.email());
		const customSettings: Partial<AccountSettings> = {
			attrs: {
				amavisBlacklistSender: senderAddressArray
			}
		};
		const { attrs } = generateSettings(customSettings);

		const { user } = setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={attrs} listType="Blocked" />,
			{ store }
		);

		await screen.findByText(senderAddressArray[0], undefined, { timeout: FIND_TIMEOUT });
		senderAddressArray.forEach((address) => {
			expect(screen.getByText(address)).toBeVisible();
		});
		const list = screen.getByTestId(SENDERS_LIST);
		const listItem = await within(list).findByText(senderAddressArray[1]);
		await act(async () => {
			await user.hover(listItem);
		});
		const button = await screen.findByRole('button', { name: 'label.remove' });
		expect(button).toBeVisible();

		fireEvent(button, new MouseEvent('click', { bubbles: true, cancelable: true }));
		expect(updateSettings).toBeCalledWith({
			target: {
				name: 'amavisBlacklistSender',
				value: [senderAddressArray[0], senderAddressArray[2]]
			}
		});
	});
});
