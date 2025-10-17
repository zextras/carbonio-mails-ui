/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { faker } from '@faker-js/faker';
import { FOLDERS, getRootsMap, ParticipantRole } from '@zextras/carbonio-ui-commons';

import { populateFoldersStore } from '@test-utils/store/folders';
import { getMocksContext } from '@test-utils/utils/mocks-context';
import { getMessageOwnerAccountName } from 'helpers/folders';
import {
	getAddressOwnerAccount,
	getExtraAccountsIds,
	getIdentitiesDescriptors,
	getMessageSenderAccount,
	getMessageSenderAddress
} from 'helpers/identities';
import { generateMessage } from '__test__/generators/generateMessage';

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

	test('returns the primary account if address is the primary address', () => {
		const inputAddress = mocksContext.identities.primary.identity.email;
		expect(getAddressOwnerAccount(inputAddress)).toBe(inputAddress);
	});

	test('returns the primary account if address is an alias of the primary address', () => {
		const inputaddress = mocksContext.identities.aliases[0].identity.email;
		expect(getAddressOwnerAccount(inputaddress)).toBe(
			mocksContext.identities.primary.identity.email
		);
	});

	test('returns the shared account if address is an address belongs to an account on which the user has the "sendAs" right', () => {
		const inputAddress = mocksContext.identities.sendAs[0].identity.email;
		expect(getAddressOwnerAccount(inputAddress)).toBe(inputAddress);
	});

	test('returns the shared account if address belongs to an account on which the user has the "sendOnBehalf" right', () => {
		const inputAddress = mocksContext.identities.sendOnBehalf[0].identity.email;
		expect(getAddressOwnerAccount(inputAddress)).toBe(inputAddress);
	});

	test("returns null if the address isn't within the primary, the aliases or the shared account", () => {
		const inputAddress = faker.internet.email();
		expect(getAddressOwnerAccount(inputAddress)).toBeNull();
	});
});

describe('Message sender account', () => {
	const mocksContext = getMocksContext();

	test('returns the primary account if sender is the primary address', () => {
		const from = {
			type: ParticipantRole.FROM,
			address: mocksContext.identities.primary.identity.email
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg)).toBe(mocksContext.identities.primary.identity.email);
	});

	test('returns the primary account if sender is an alias of the primary address', () => {
		const from = {
			type: ParticipantRole.FROM,
			address: mocksContext.identities.aliases[0].identity.email
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg)).toBe(mocksContext.identities.primary.identity.email);
	});

	test('returns the shared account if sender is an address on which the user has the "sendAs" right', () => {
		const targetAddress = mocksContext.identities.sendAs[0].identity.email;
		const from = {
			type: ParticipantRole.FROM,
			address: targetAddress
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg)).toBe(targetAddress);
	});

	test('returns the shared account if sender is an address on which the user has the "sendOnBehalf" right', () => {
		const targetAddress = mocksContext.identities.sendOnBehalf[0].identity.email;
		const from = {
			type: ParticipantRole.FROM,
			address: targetAddress
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg)).toBe(targetAddress);
	});

	test("returns null if sender address isn't within the primary, the aliases or the shared account", () => {
		const from = {
			type: ParticipantRole.FROM,
			address: mocksContext.otherUsersIdentities[0].email
		};
		const msg = generateMessage({ from });
		expect(getMessageSenderAccount(msg)).toBeNull();
	});
});

describe('Message folder owner account', () => {
	const mocksContext = getMocksContext();

	test('returns the primary account if the the message is located under the primary account', () => {
		populateFoldersStore();
		const folderRoots = getRootsMap();
		const from = {
			type: ParticipantRole.TO,
			address: mocksContext.identities.primary.identity.email
		};
		const folderId = `${mocksContext.identities.primary.identity.id}:2`;
		const msg = generateMessage({ from, folderId });
		expect(getMessageOwnerAccountName(msg, folderRoots)).toBe(
			mocksContext.identities.primary.identity.email
		);
	});
	test('returns the shared account if the message is located under the shared account', () => {
		populateFoldersStore();
		const folderRoots = getRootsMap();
		const to = [
			{
				type: ParticipantRole.TO,
				address: mocksContext.identities.sendOnBehalf[0].identity.email
			}
		];
		const folderId = `${mocksContext.identities.sendOnBehalf[0].identity.id}:2`;
		const msg = generateMessage({ to, folderId });
		expect(getMessageOwnerAccountName(msg, folderRoots)).toBe(
			mocksContext.identities.sendOnBehalf[0].identity.email
		);
	});
});

describe('getExtraAccountsIds', () => {
	const mocksContext = getMocksContext();
	test('returns an empty array when roots do not contain any shared account', () => {
		populateFoldersStore({ noSharedAccounts: true });
		const result = getExtraAccountsIds();
		expect(result).toEqual([]);
	});

	test('excludes the default account when rootsMap is not empty', () => {
		populateFoldersStore();
		const result = getExtraAccountsIds();
		expect(result).not.toContain(mocksContext.identities.primary.identity.id);
	});

	test('returns a number of ids equal to number of roots minus one', () => {
		populateFoldersStore();
		const roots = getRootsMap();
		const { length } = Object.keys(roots);
		const result = getExtraAccountsIds();
		expect(result?.length).toBe(length - 1);
	});
	test('return all the roots zids when account when rootsMap is not empty', () => {
		populateFoldersStore();
		const roots = getRootsMap();
		const rootsArray = Object.keys(roots);
		const result = getExtraAccountsIds();
		result?.forEach((id) => {
			expect(rootsArray).toContain(`${id}:${FOLDERS.USER_ROOT}`);
		});
	});
});

describe('getIdentitiesDescriptors', () => {
	test('returns all identities including primary, aliases, and delegations', () => {
		const result = getIdentitiesDescriptors();
		const primaryIdentity = result.find((identity) => identity.type === 'primary');
		const aliasIdentities = result.filter((identity) => identity.type === 'alias');
		const delegationIdentities = result.filter((identity) => identity.type === 'delegation');

		expect(primaryIdentity).toBeDefined();
		expect(aliasIdentities.length).toBeGreaterThan(0);
		expect(delegationIdentities.length).toBeGreaterThan(0);
	});

	test('returns unique identities for delegation accounts', () => {
		const result = getIdentitiesDescriptors();
		const delegationIdentities = result.filter((identity) => identity.type === 'delegation');
		const uniqueDelegationIdentities = new Set(
			delegationIdentities.map((identity) => identity.fromAddress)
		);

		expect(delegationIdentities.length).toBe(uniqueDelegationIdentities.size);
	});

	test('returns identities with correct owner account', () => {
		const result = getIdentitiesDescriptors();
		result.forEach((identity) => {
			expect(identity.ownerAccount).toBeDefined();
		});
	});

	test('returns identities with correct type and right', () => {
		const result = getIdentitiesDescriptors();
		result.forEach((identity) => {
			if (identity.type === 'delegation') {
				expect(identity.right).toBeDefined();
			} else {
				expect(identity.right).toBeUndefined();
			}
		});
	});
});
