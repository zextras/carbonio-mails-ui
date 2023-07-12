/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { getUserAccount, getUserSettings } from '@zextras/carbonio-shell-ui';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { getMocksContext } from '../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { generateMessage } from '../../tests/generators/generateMessage';
import {
	getAddressOwnerAccount,
	getMessageSenderAccount,
	getMessageSenderAddress
} from '../identities';

describe('Message sender address', () => {
	test('returns the address if sender is a participant of type FROM', () => {
		const from = { type: ParticipantRole.FROM, address: faker.internet.email() };
		const msg = generateMessage({ from });
		expect(getMessageSenderAddress(msg)).toBe(from.address);
	});

	test('returns null if there is no participant of type FROM', () => {
		const from = { type: undefined, address: faker.internet.email() };

		const msg = generateMessage({
			// Testing the specific corner case
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			from
		});
		expect(getMessageSenderAddress(msg)).toBeNull();
	});

	test('returns null if there is no participants', () => {
		const msg = generateMessage({});
		msg.participants = [];
		expect(getMessageSenderAddress(msg)).toBeNull();
	});
});

describe('Address owner account', () => {
	const mocksContext = getMocksContext();
	const primaryAccount = getUserAccount();
	const settings = getUserSettings();

	test('returns the primary account if address is the primary address', () => {
		const inputAddress = mocksContext.identities.primary.identity.email;
		expect(getAddressOwnerAccount(inputAddress, primaryAccount, settings)).toBe(inputAddress);
	});

	test('returns the primary account if address is an alias of the primary address', () => {
		const inputaddress = mocksContext.identities.aliases[0].identity.email;
		expect(getAddressOwnerAccount(inputaddress, primaryAccount, settings)).toBe(
			mocksContext.identities.primary.identity.email
		);
	});

	test('returns the shared account if address is an address belongs to an account on which the user has the "sendAs" right', () => {
		const inputAddress = mocksContext.identities.sendAs[0].identity.email;
		expect(getAddressOwnerAccount(inputAddress, primaryAccount, settings)).toBe(inputAddress);
	});

	test('returns the shared account if address belongs to an account on which the user has the "sendOnBehalf" right', () => {
		const inputAddress = mocksContext.identities.sendOnBehalf[0].identity.email;
		expect(getAddressOwnerAccount(inputAddress, primaryAccount, settings)).toBe(inputAddress);
	});

	test("returns null if the address isn't within the primary, the aliases or the shared account", () => {
		const inputAddress = faker.internet.email();
		expect(getAddressOwnerAccount(inputAddress, primaryAccount, settings)).toBeNull();
	});
});

describe('Message sender account', () => {
	const mocksContext = getMocksContext();
	const primaryAccount = getUserAccount();
	const settings = getUserSettings();

	test('returns the primary account if sender is the primary address', () => {
		const from = {
			type: ParticipantRole.FROM,
			address: mocksContext.identities.primary.identity.email
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg, primaryAccount, settings)).toBe(
			mocksContext.identities.primary.identity.email
		);
	});

	test('returns the primary account if sender is an alias of the primary address', () => {
		const from = {
			type: ParticipantRole.FROM,
			address: mocksContext.identities.aliases[0].identity.email
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg, primaryAccount, settings)).toBe(
			mocksContext.identities.primary.identity.email
		);
	});

	test('returns the shared account if sender is an address on which the user has the "sendAs" right', () => {
		const targetAddress = mocksContext.identities.sendAs[0].identity.email;
		const from = {
			type: ParticipantRole.FROM,
			address: targetAddress
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg, primaryAccount, settings)).toBe(targetAddress);
	});

	test('returns the shared account if sender is an address on which the user has the "sendOnBehalf" right', () => {
		const targetAddress = mocksContext.identities.sendOnBehalf[0].identity.email;
		const from = {
			type: ParticipantRole.FROM,
			address: targetAddress
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg, primaryAccount, settings)).toBe(targetAddress);
	});

	test("returns null if sender address isn't within the primary, the aliases or the shared account", () => {
		const from = {
			type: ParticipantRole.FROM,
			address: mocksContext.otherUsersIdentities[0].email
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg, primaryAccount, settings)).toBeNull();
	});
});
