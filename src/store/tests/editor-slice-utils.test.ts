/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shellHooks from '@zextras/carbonio-shell-ui';

import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { generateAccount } from '../../carbonio-ui-commons/test/mocks/accounts/account-generator';
import { AvailableAddress } from '../../carbonio-ui-commons/types/identities';
import { getAvailableAddresses } from '../../helpers/get_available_addresses';
import { generateMessage } from '../../tests/generators/generateMessage';
import { retrieveALL, retrieveCC, retrieveReplyTo } from '../editor-slice-utils';

jest.mock('../../helpers/get_available_addresses', () => ({
	getAvailableAddresses: jest.fn()
}));

describe('retrieveCC', () => {
	beforeEach(() => {
		(getAvailableAddresses as jest.Mock).mockReturnValue([]);
	});

	const defaultIdentity = {
		id: '3b778c1d-529f-45b7-b131-5162c83551f7',
		name: 'DEFAULT',
		_attrs: []
	} as shellHooks.Identity;

	const sendAsIdentityDisplayName = 'Homer Simpson';
	const delegatorAccountAddress = 'delegatoraccount@test.com';
	const sendAsIdentity = {
		id: '80c3aba1-f2e9-4492-9447-cabdbf08a2e8',
		name: 'sendAsIdentity',
		_attrs: [
			{
				zimbraPrefIdentityName: 'sendAsIdentity',
				zimbraPrefFromDisplay: sendAsIdentityDisplayName,
				zimbraPrefFromAddress: delegatorAccountAddress, // Delegator
				zimbraPrefFromAddressType: 'sendAs',
				zimbraPrefReplyToEnabled: 'FALSE'
			}
		]
	} as shellHooks.Identity;

	const accountRights = {
		targets: [
			{
				right: 'sendAs',
				target: [
					{
						id: sendAsIdentity.id,
						name: sendAsIdentityDisplayName,
						type: 'account',
						email: [{ addr: delegatorAccountAddress }],
						d: sendAsIdentityDisplayName
					}
				]
			}
		]
	};

	const mainAccount: shellHooks.Account = {
		...generateAccount(),
		id: defaultIdentity.id,
		name: 'default@test.com',
		displayName: 'default account',
		identities: { identity: [defaultIdentity, sendAsIdentity] },
		rights: accountRights as never // cannot import AccountRights from carbonio-shell-ui
	};

	const defaultIdentityForDelegator = {
		id: sendAsIdentity.id,
		name: 'DEFAULT',
		_attrs: []
	} as shellHooks.Identity;

	const delegatorAccount = {
		...generateAccount(),
		id: defaultIdentityForDelegator.id,
		email: delegatorAccountAddress,
		identities: { identity: [defaultIdentityForDelegator], rights: [] },
		name: delegatorAccountAddress,
		displayName: sendAsIdentityDisplayName
	};

	const externalUser = 'external@test.com';
	const anotherUser = 'userC@test.com';

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	// Scenario: The main account (who has "Send As" rights) starts a conversation and adds the delegator in CC.
	// Expected Behavior: On "Reply All," the delegator remains in CC.
	it('TC1: Main account sends an email, Delegator in CC', () => {
		jest
			.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: mainAccount.name },
			cc: [{ type: 'c', address: delegatorAccount.email }],
			to: []
		});

		expect(retrieveCC(message, mainAccount.name)).toEqual([
			{ type: 'c', address: delegatorAccount.email }
		]);
	});

	// Scenario: The delegator starts the conversation and includes the main account in CC.
	// Expected Behavior: On "Reply All," the main account remains in CC.
	it('TC2: Delegator sends an email, Main Account in CC', () => {
		jest
			.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => delegatorAccount)
			.mockImplementationOnce(() => mainAccount);

		const message = generateMessage({
			from: { type: 'f', address: delegatorAccount.email },
			cc: [{ type: 'c', address: mainAccount.name }],
			to: []
		});

		expect(retrieveCC(message, delegatorAccount.email)).toEqual([
			{ type: 'c', address: mainAccount.name }
		]);
	});

	// Scenario: The main account sends an email using "Send As" permissions for the delegator, while also including the delegator in CC.
	// Expected Behavior: On "Reply All," only Main account remains in CC.
	it('TC3: Main Account sends as Delegator, Delegator in CC', () => {
		jest
			.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: delegatorAccount.email },
			cc: [
				{ type: 'c', address: delegatorAccount.email },
				{ type: 'c', address: mainAccount.name }
			],
			to: []
		});

		expect(retrieveCC(message, delegatorAccount.email)).toEqual([
			{ type: 'c', address: mainAccount.name }
		]);
	});

	// Scenario: The main account sends an email on behalf of the delegator but does not include the delegator in CC.
	// Expected Behavior: On "Reply All," the delegator should not be automatically added to CC.
	it('TC4: Main Account sends as Delegator, Delegator NOT in CC', () => {
		jest
			.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: delegatorAccount.email },
			cc: [],
			to: []
		});

		expect(retrieveCC(message, delegatorAccount.email)).toEqual([]);
	});

	// Scenario: An external user replies to the email thread where both the main account and delegator were in CC.
	// Expected Behavior: On "Reply All," both remain in CC.
	it('TC5: External user replies to conversation with Main Account & Delegator in CC', () => {
		jest
			.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: externalUser },
			cc: [
				{ type: 'c', address: mainAccount.name },
				{ type: 'c', address: delegatorAccount.email }
			],
			to: []
		});

		expect(retrieveCC(message, externalUser)).toEqual([
			{ type: 'c', address: mainAccount.name },
			{ type: 'c', address: delegatorAccount.email }
		]);
	});

	// Scenario: The main account sends an email using "Send As" for the delegator and includes a third party (User C) in CC.
	// Expected Behavior: On "Reply All," Main Account, User C remain in CC.
	it('TC6: Main Account sends as Delegator, Another Account in CC', () => {
		jest
			.spyOn(shellHooks, 'getUserAccount')
			.mockImplementationOnce(() => mainAccount)
			.mockImplementationOnce(() => delegatorAccount);

		const message = generateMessage({
			from: { type: 'f', address: delegatorAccount.email },
			cc: [
				{ type: 'c', address: anotherUser },
				{ type: 'c', address: mainAccount.name },
				{ type: 'c', address: delegatorAccount.email }
			],
			to: []
		});

		expect(retrieveCC(message, delegatorAccount.email)).toEqual([
			{ type: 'c', address: anotherUser },
			{ type: 'c', address: mainAccount.name }
		]);
	});
});

describe('retrieveALL', () => {
	const meAddress = 'me@test.com';
	const sharedAccount = 'sharedAccount@test.com';

	beforeEach(() => {
		const primaryAddress: AvailableAddress = {
			address: meAddress,
			type: 'primary',
			ownerAccount: meAddress
		};
		const sharedAccountAddress: AvailableAddress = {
			address: sharedAccount,
			type: 'delegation',
			ownerAccount: sharedAccount
		};

		(getAvailableAddresses as jest.Mock).mockReturnValue([primaryAddress, sharedAccountAddress]);
	});
	it('should return "someone@test.com" when replying as Me to a message sent to me from "someone@test.com"', () => {
		const receivedMessage = {
			...generateMessage(),
			participants: [
				{ type: ParticipantRole.FROM, address: 'someone@test.com' },
				{ type: ParticipantRole.TO, address: meAddress }
			]
		};
		const result = retrieveALL(receivedMessage, meAddress);

		expect(result).toEqual([{ address: 'someone@test.com', type: 't' }]);
	});

	it('should return "me@test.com" when replying as Me to a message sent to myself when in INBOX folder', () => {
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.INBOX,
			participants: [
				{ type: ParticipantRole.FROM, address: meAddress },
				{ type: ParticipantRole.TO, address: meAddress }
			]
		};
		const result = retrieveALL(receivedMessage, meAddress);

		expect(result).toEqual([{ address: meAddress, type: 't' }]);
	});

	it('should return "me@test.com" when replying as Me to a message sent to myself when in SENT folder', () => {
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.SENT,
			participants: [
				{ type: ParticipantRole.FROM, address: meAddress },
				{ type: ParticipantRole.TO, address: meAddress }
			]
		};

		const result = retrieveALL(receivedMessage, meAddress);

		expect(result).toEqual([{ address: meAddress, type: 't' }]);
	});

	it('should return [Me and "someoneElse"] in To when replying as "sharedAccount" to a message sent by Me To "someoneElse" and "sharedAccount" is in CC', () => {
		const me = meAddress;
		const someoneElse = 'someoneElse@test.com';
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.SENT,
			participants: [
				{ type: ParticipantRole.FROM, address: me },
				{ type: ParticipantRole.TO, address: someoneElse },
				{ type: ParticipantRole.CARBON_COPY, address: sharedAccount }
			]
		};
		const replyMessageRecipients = retrieveALL(receivedMessage, sharedAccount);

		expect(replyMessageRecipients).toEqual([
			{ address: me, type: 't' },
			{ address: someoneElse, type: 't' }
		]);
	});

	it('should remove the sender when it was in the recipients of the original message', () => {
		const me = meAddress;
		const someoneElse = 'someoneElse@test.com';
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.SENT,
			participants: [
				{ type: ParticipantRole.FROM, address: me },
				{ type: ParticipantRole.TO, address: someoneElse },
				{ type: ParticipantRole.TO, address: sharedAccount }
			]
		};
		const replyMessageRecipients = retrieveALL(receivedMessage, sharedAccount);

		expect(replyMessageRecipients).toEqual([
			{ address: me, type: 't' },
			{ address: someoneElse, type: 't' }
		]);
	});

	it('should return someone@test.com (original sender) in the TO when replying to all, moves the rest of the participants to the CC', () => {
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.INBOX,
			participants: [
				{ type: ParticipantRole.FROM, address: 'someone@test.com' },
				{ type: ParticipantRole.TO, address: sharedAccount },
				{ type: ParticipantRole.TO, address: 'another@test.com' }
			]
		};
		const replyMessageRecipients = retrieveALL(receivedMessage, meAddress);
		const ccMessageRecipients = retrieveCC(receivedMessage, meAddress);
		expect(replyMessageRecipients).toEqual([
			{
				address: 'someone@test.com',
				type: 't'
			}
		]);
		expect(ccMessageRecipients).toEqual([
			{
				address: 'sharedAccount@test.com',
				type: 'c'
			},
			{
				address: 'another@test.com',
				type: 'c'
			}
		]);
	});
});

describe('retrieveReplyTo', () => {
	const meAddress = 'me@test.com';
	const sharedAccount = 'sharedAccount@test.com';

	beforeEach(() => {
		const primaryAddress: AvailableAddress = {
			address: meAddress,
			type: 'primary',
			ownerAccount: meAddress
		};
		const sharedAccountAddress: AvailableAddress = {
			address: sharedAccount,
			type: 'delegation',
			ownerAccount: sharedAccount
		};

		(getAvailableAddresses as jest.Mock).mockReturnValue([primaryAddress, sharedAccountAddress]);
	});
	it('should return "me@test.com" when replying as Me to a message sent to myself', () => {
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.SENT,
			participants: [
				{ type: ParticipantRole.FROM, address: meAddress },
				{ type: ParticipantRole.TO, address: meAddress }
			]
		};
		const result = retrieveReplyTo(receivedMessage);

		expect(result).toEqual([{ address: meAddress, type: 't' }]);
	});
});
