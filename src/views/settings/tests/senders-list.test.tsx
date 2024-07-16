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
import { screen, setupTest, UserEvent, within } from '../../../carbonio-ui-commons/test/test-setup';
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

describe.each`
	listType     | titleKey                     | subtitleKey                     | settingsField              | settingsBuilderParam
	${'Allowed'} | ${'label.allowed_addresses'} | ${'messages.allowed_addresses'} | ${'amavisWhitelistSender'} | ${'whitelist'}
	${'Blocked'} | ${'label.blocked_addresses'} | ${'messages.blocked_addresses'} | ${'amavisBlacklistSender'} | ${'blacklist'}
`(
	'$listType sender list addresses settings',
	({ listType, titleKey, subtitleKey, settingsField, settingsBuilderParam }) => {
		it('should render the section title', () => {
			setupTest(<SendersList {...buildProps({ listType })} />);

			expect(screen.getByText(titleKey)).toBeVisible();
		});

		it('should render the section message', () => {
			setupTest(<SendersList {...buildProps({ listType })} />);

			expect(screen.getByText(subtitleKey)).toBeVisible();
		});

		it('should render the "add" widget', () => {
			setupTest(<SendersList {...buildProps({ listType })} />);

			expect(screen.getByRole('button', { name: 'label.add' })).toBeVisible();
			const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
			expect(nameInput).toBeVisible();
		});

		it(`should add new sender address in the addresses list `, async () => {
			const newSenderAddress = faker.internet.email();

			const { user } = setupTest(
				<SendersList updateSettings={jest.fn()} settingsObj={setupSettings()} listType={listType} />
			);
			await addAddress(user, newSenderAddress);

			const list = screen.getByTestId(SENDERS_LIST);
			const listItem = await within(list).findByText(newSenderAddress);
			expect(listItem).toBeVisible();
		});

		it('should update settings when new sender address is added and list is empty', async () => {
			const updateSettings = jest.fn();
			const newSenderAddress = faker.internet.email();

			const { user } = setupTest(
				<SendersList
					updateSettings={updateSettings}
					settingsObj={setupSettings()}
					listType={listType}
				/>
			);
			await addAddress(user, newSenderAddress);

			expect(updateSettings).toBeCalledWith({
				target: { name: settingsField, value: [newSenderAddress] }
			});
		});

		it('should render list from settings', () => {
			const senderAddressArray = buildAddresses(3);

			setupTest(
				<SendersList
					updateSettings={jest.fn()}
					settingsObj={setupSettings({ [settingsBuilderParam]: senderAddressArray })}
					listType={listType}
				/>
			);

			senderAddressArray.forEach((address) => {
				expect(screen.getByText(address)).toBeVisible();
			});
		});

		it('should update settings when new sender address is added and list is NOT empty', async () => {
			const updateSettings = jest.fn();
			const newSenderAddress = faker.internet.email();
			const senderAddressArray = buildAddresses(3);

			const { user } = setupTest(
				<SendersList
					updateSettings={updateSettings}
					settingsObj={setupSettings({ [settingsBuilderParam]: senderAddressArray })}
					listType={listType}
				/>
			);
			await addAddress(user, newSenderAddress);

			expect(updateSettings).toBeCalledWith({
				target: { name: settingsField, value: [...senderAddressArray, newSenderAddress] }
			});
		});

		it('should clean the input field after adding a new sender address', async () => {
			const newSenderAddress = faker.internet.email();

			const { user } = setupTest(
				<SendersList updateSettings={jest.fn()} settingsObj={setupSettings()} listType={listType} />
			);
			await addAddress(user, newSenderAddress);

			const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
			expect(nameInput).toHaveValue('');
		});

		it('add button disabled with empty address', () => {
			setupTest(
				<SendersList updateSettings={jest.fn()} settingsObj={setupSettings()} listType={listType} />
			);

			expect(screen.getByRole('button', { name: 'label.add' })).toBeDisabled();
		});

		it('add button disabled with invalid address', async () => {
			const newSenderAddress = 'invalid';

			const { user } = setupTest(
				<SendersList updateSettings={jest.fn()} settingsObj={setupSettings()} listType={listType} />
			);
			const nameInput = screen.getByRole('textbox', { name: 'label.enter_single_email_address' });
			await user.type(nameInput, newSenderAddress);

			expect(screen.getByRole('button', { name: 'label.add' })).toBeDisabled();
			expect(screen.getByText('messages.invalid_sender_address')).toBeVisible();
		});

		it('should not display any senders list items', () => {
			const attrsWithoutAddresses = setupSettings();

			setupTest(
				<SendersList
					updateSettings={jest.fn()}
					settingsObj={attrsWithoutAddresses}
					listType={listType}
				/>
			);

			expect(screen.queryByTestId(SENDERS_LIST_ITEM)).not.toBeInTheDocument();
		});

		it('should remove sender address from the list', async () => {
			const updateSettings = jest.fn();
			const senderAddressArray = buildAddresses(3);

			const { user } = setupTest(
				<SendersList
					updateSettings={updateSettings}
					settingsObj={setupSettings({ [settingsBuilderParam]: senderAddressArray })}
					listType={listType}
				/>
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
			const button = await screen.findByRole('button', { name: 'label.remove_one' });
			expect(button).toBeVisible();

			fireEvent(button, new MouseEvent('click', { bubbles: true, cancelable: true }));
			expect(updateSettings).toBeCalledWith({
				target: {
					name: settingsField,
					value: [senderAddressArray[0], senderAddressArray[2]]
				}
			});
		});
	}
);
