/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as shellHooks from '@zextras/carbonio-shell-ui';
import { IdentityAttrs } from '@zextras/carbonio-shell-ui';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';

import { generateAccount } from '@test-utils/accounts/account-generator';
import { generateReplyAllMsgEditor } from 'store/editor/editor-generators';
import { generateMessage } from '__test__/generators/generateMessage';

describe('Reply All', () => {
	const outsider = 'someoneElse@test.com';
	const meAddress = 'me@test.com';
	const sharedAccountAddress = 'sharedAccount@test.com';
	const another = 'another@test.com';
	const sendAsIdentityDisplayName = 'Homer Simpson';

	const defaultIdentity = {
		id: '3b778c1d-529f-45b7-b131-5162c83551f7',
		name: 'DEFAULT',
		_attrs: [] as IdentityAttrs
	};

	const sendAsIdentity = {
		id: '80c3aba1-f2e9-4492-9447-cabdbf08a2e8',
		name: 'sendAsIdentity',
		_attrs: [
			{
				zimbraPrefIdentityName: 'sendAsIdentity',
				zimbraPrefFromDisplay: sendAsIdentityDisplayName,
				zimbraPrefFromAddress: sharedAccountAddress, // Delegator
				zimbraPrefFromAddressType: 'sendAs',
				zimbraPrefReplyToEnabled: 'FALSE'
			}
		] as IdentityAttrs
	};
	const accountRights = {
		targets: [
			{
				right: 'sendAs',
				target: [
					{
						id: sendAsIdentity.id,
						name: sendAsIdentityDisplayName,
						type: 'account',
						email: [{ addr: sharedAccountAddress }],
						d: sendAsIdentityDisplayName
					}
				]
			}
		]
	};
	const mainAccount: shellHooks.Account = {
		...generateAccount(),
		id: defaultIdentity.id,
		name: meAddress,
		displayName: 'default account',
		identities: { identity: [defaultIdentity, sendAsIdentity] },
		rights: accountRights as never // cannot import AccountRights from carbonio-shell-ui
	};
	beforeEach(() => {
		vi.spyOn(shellHooks, 'getUserAccount').mockImplementation(() => mainAccount);
	});
	describe('Messages sent from someoneElse (outsider)', () => {
		describe('A message sent To: [me, sharedAccount, another person]', () => {
			const receivedMessage = {
				...generateMessage(),
				parent: FOLDERS.INBOX,
				participants: [
					{ type: ParticipantRole.FROM, address: outsider },
					{ type: ParticipantRole.TO, address: meAddress },
					{ type: ParticipantRole.TO, address: sharedAccountAddress },
					{ type: ParticipantRole.TO, address: another }
				]
			};
			it('should reply with default identity (Me)', () => {
				const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
				expect(replyMsgEditor.identityId).toEqual('');
			});

			it('should reply with CC: [sharedAccount, another person]', () => {
				const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
				expect(replyMsgEditor.recipients.cc).toEqual([
					{
						address: sharedAccountAddress,
						type: ParticipantRole.CARBON_COPY
					},
					{
						address: another,
						type: ParticipantRole.CARBON_COPY
					}
				]);
			});
			it('should reply To: [original sender]', () => {
				const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
				expect(replyMsgEditor.recipients.to).toEqual([
					{
						address: outsider,
						type: ParticipantRole.TO
					}
				]);
			});
		});
		describe('A message sent To: [sharedAccount, another person], CC: [me]', () => {
			const receivedMessage = {
				...generateMessage(),
				parent: FOLDERS.INBOX,
				participants: [
					{ type: ParticipantRole.FROM, address: outsider },
					{ type: ParticipantRole.CARBON_COPY, address: meAddress },
					{ type: ParticipantRole.TO, address: sharedAccountAddress },
					{ type: ParticipantRole.TO, address: another }
				]
			};
			it('should reply as shared account (To weighs more than CC)', () => {
				const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
				expect(replyMsgEditor.identityId).toEqual(`${sharedAccountAddress}sendAs`);
			});
			it('should reply with CC: [another person, me]', () => {
				const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
				expect(replyMsgEditor.recipients.cc).toEqual([
					{
						address: another,
						type: ParticipantRole.CARBON_COPY
					},
					{ address: meAddress, type: ParticipantRole.CARBON_COPY }
				]);
			});
		});
		describe('A message sent To: [sharedAccount,another person]', () => {
			const receivedMessage = {
				...generateMessage(),
				parent: FOLDERS.INBOX,
				participants: [
					{ type: ParticipantRole.FROM, address: outsider },
					{ type: ParticipantRole.TO, address: sharedAccountAddress },
					{ type: ParticipantRole.TO, address: another }
				]
			};
			it('should reply as delegated account', () => {
				const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
				expect(replyMsgEditor.identityId).toEqual(`${sharedAccountAddress}sendAs`);
			});
			it('should reply with CC: [another person]', () => {
				const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
				expect(replyMsgEditor.recipients.cc).toEqual([
					{
						address: another,
						type: ParticipantRole.CARBON_COPY
					}
				]);
			});
			it('should reply To: [original sender]', () => {
				const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
				expect(replyMsgEditor.recipients.to).toEqual([
					{
						address: outsider,
						type: ParticipantRole.TO
					}
				]);
			});
		});
	});
	describe('Message sent from Me', () => {
		const message = {
			...generateMessage(),
			participants: [
				{ type: ParticipantRole.FROM, address: meAddress },
				{ type: ParticipantRole.TO, address: meAddress }
			]
		};

		it('To [me] should have identity Me when replying to the sent message', () => {
			const messageInSent = { ...message, parent: FOLDERS.SENT };
			const replyMsgEditor = generateReplyAllMsgEditor(messageInSent);
			expect(replyMsgEditor.identityId).toEqual('');
		});

		it('To [me] should have identity Me when replying to the received message', () => {
			const messageReceived = { ...message, parent: FOLDERS.INBOX };
			const replyMsgEditor = generateReplyAllMsgEditor(messageReceived);
			expect(replyMsgEditor.identityId).toEqual('');
		});

		it('To [me] should have only Me in TO when replying to the received message', () => {
			const messageReceived = { ...message, parent: FOLDERS.INBOX };
			const replyMsgEditor = generateReplyAllMsgEditor(messageReceived);
			expect(replyMsgEditor.recipients.to).toEqual([
				{
					address: meAddress,
					type: ParticipantRole.TO
				}
			]);
		});

		it('To [me] should have only Me in TO when replying to the sent message', () => {
			const messageReceived = { ...message, parent: FOLDERS.SENT };
			const replyMsgEditor = generateReplyAllMsgEditor(messageReceived);
			expect(replyMsgEditor.recipients.to).toEqual([
				{
					address: meAddress,
					type: ParticipantRole.TO
				}
			]);
		});

		it('To [me] should have nothing in CC', () => {
			const messageReceived = { ...message, parent: FOLDERS.INBOX };
			const replyMsgEditor = generateReplyAllMsgEditor(messageReceived);
			expect(replyMsgEditor.recipients.cc).toEqual([]);
		});

		describe('A message sent To: [sharedAccount, another person]', () => {
			const messageFromMeToShared = {
				...generateMessage(),
				participants: [
					{ type: ParticipantRole.FROM, address: meAddress },
					{ type: ParticipantRole.TO, address: sharedAccountAddress },
					{ type: ParticipantRole.TO, address: another }
				]
			};
			it('should reply with shared account identity when replying to the sent message', () => {
				const messageInSent = { ...messageFromMeToShared, parent: FOLDERS.SENT };
				const replyMsgEditor = generateReplyAllMsgEditor(messageInSent);
				expect(replyMsgEditor.identityId).toEqual(`${sharedAccountAddress}sendAs`);
			});

			it('should reply To: [Me and another] when replying to the sent message', () => {
				const messageInSent = { ...messageFromMeToShared, parent: FOLDERS.SENT };
				const replyMsgEditor = generateReplyAllMsgEditor(messageInSent);
				expect(replyMsgEditor.recipients.to).toEqual([
					{
						address: meAddress,
						type: ParticipantRole.TO
					},
					{
						address: another,
						type: ParticipantRole.TO
					}
				]);
			});

			it('should reply To: [Me] when replying to the received message', () => {
				const messageInSent = { ...messageFromMeToShared, parent: FOLDERS.INBOX };
				const replyMsgEditor = generateReplyAllMsgEditor(messageInSent);
				expect(replyMsgEditor.recipients.to).toEqual([
					{
						address: meAddress,
						type: ParticipantRole.TO
					}
				]);
			});

			it('should reply CC: [another] when replying to the received message', () => {
				const messageInSent = { ...messageFromMeToShared, parent: FOLDERS.INBOX };
				const replyMsgEditor = generateReplyAllMsgEditor(messageInSent);
				expect(replyMsgEditor.recipients.cc).toEqual([
					{
						address: another,
						type: ParticipantRole.CARBON_COPY
					}
				]);
			});
		});
	});
	describe('Identity Selection', () => {
		it('should use sharedAccount identity when replying to a message with To [sharedAccount] and CC [Me, another]', () => {
			const receivedMessage = {
				...generateMessage(),
				participants: [
					{ type: ParticipantRole.FROM, address: outsider },
					{ type: ParticipantRole.TO, address: sharedAccountAddress },
					{ type: ParticipantRole.CARBON_COPY, address: meAddress },
					{ type: ParticipantRole.CARBON_COPY, address: another }
				]
			};
			const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
			expect(replyMsgEditor.identityId).toEqual(`${sharedAccountAddress}sendAs`);
		});

		it('should use default identity when replying to a message with To [sharedAccount, Me] and CC [another]', () => {
			const receivedMessage = {
				...generateMessage(),
				participants: [
					{ type: ParticipantRole.FROM, address: outsider },
					{ type: ParticipantRole.TO, address: sharedAccountAddress },
					{ type: ParticipantRole.TO, address: meAddress },
					{ type: ParticipantRole.CARBON_COPY, address: another }
				]
			};
			const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
			expect(replyMsgEditor.identityId).toEqual('');
		});
	});
});
