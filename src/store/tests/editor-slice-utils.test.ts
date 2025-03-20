/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shellHooks from '@zextras/carbonio-shell-ui';

import { generateAccount } from '../../carbonio-ui-commons/test/mocks/accounts/account-generator';
import { generateMessage } from '../../tests/generators/generateMessage';
import { retrieveCC } from '../editor-slice-utils';

describe('retrieveCC', () => {
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
	// Expected Behavior: On "Reply All," both the main account and delegator remain in CC.
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
	// Expected Behavior: On "Reply All," both accounts remain in CC.
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
