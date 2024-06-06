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
import { SendersList, SendersListProps } from '../senders-list';

const SENDERS_LIST = 'senders-list';

const buildProps = ({
	settingsObj = {},
	updateSettings = jest.fn(),
	listType = 'Allowed'
}: Partial<SendersListProps>): SendersListProps => ({
	settingsObj,
	updateSettings,
	listType
});

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

		const senderAddressArray: Array<string> = times(3, () => faker.internet.email());
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				amavisBlacklistSender: senderAddressArray
			}
		};
		const { prefs } = generateSettings(customSettings);
		const { user } = setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={prefs} listType="Blocked" />,
			{ store }
		);
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
		expect(nameInput).toBeVisible();
		await user.type(nameInput, newSenderAddress);
		const addButton = screen.getByRole('button', { name: 'label.add' });
		await act(() => user.click(addButton));

		const list = screen.getByTestId(SENDERS_LIST);
		const listItem = await within(list).findByText(newSenderAddress);
		expect(listItem).toBeVisible();
	});

	it('should update settings when new sender address is added', async () => {
		const store = generateStore();
		const updateSettings = jest.fn();
		const newSenderAddress = faker.internet.email();

		const senderAddressArray: Array<string> = [];
		const customSettings: Partial<AccountSettings> = {
			prefs: {
				amavisBlacklistSender: senderAddressArray
			}
		};
		const { prefs } = generateSettings(customSettings);
		const { user } = setupTest(
			<SendersList updateSettings={updateSettings} settingsObj={prefs} listType="Blocked" />,
			{ store }
		);
		const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
		await user.type(nameInput, newSenderAddress);
		const addButton = screen.getByRole('button', { name: 'label.add' });
		await act(() => user.click(addButton));

		expect(updateSettings).toBeCalledWith({
			target: { name: 'amavisBlacklistSender', value: [newSenderAddress] }
		});
	});
});
