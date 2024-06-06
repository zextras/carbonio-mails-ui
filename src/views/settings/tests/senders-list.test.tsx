/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import { AccountSettings, AccountSettingsPrefs } from '@zextras/carbonio-shell-ui';
import { times } from 'lodash';

import { generateSettings } from '../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { UserEvent, screen, setupTest, within } from '../../../carbonio-ui-commons/test/test-setup';
import { generateStore } from '../../../tests/generators/store';
import { SendersList, SendersListProps } from '../senders-list';

const SENDERS_LIST = 'senders-list';

const buildProps = ({
	settingsObj = { attrs: {}, prefs: {} },
	updateSettings = jest.fn(),
	listType = 'Allowed'
}: Partial<SendersListProps>): SendersListProps => ({
	settingsObj,
	updateSettings,
	listType
});

function setupSettings(): AccountSettingsPrefs {
	const senderAddressArray: Array<string> = [];
	const customSettings: Partial<AccountSettings> = {
		attrs: {
			amavisBlacklistSender: senderAddressArray
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
		const store = generateStore();
		const updateSettings = jest.fn();
		const attrs = setupSettings();
		const newSenderAddress = 'invalid';
		const { user } = setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={attrs} listType="Blocked" />,
			{ store }
		);
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
		await user.type(nameInput, newSenderAddress);

		expect(screen.getByRole('button', { name: 'label.add' })).toBeDisabled();
	});
});
