/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IdentityAttrs } from '@zextras/carbonio-shell-ui';
import * as shellHooks from '@zextras/carbonio-shell-ui';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { ParticipantRole } from '../../../carbonio-ui-commons/constants/participants';
import { generateAccount } from '../../../carbonio-ui-commons/test/mocks/accounts/account-generator';
import { generateMessage } from '../../../tests/generators/generateMessage';
import { generateReplyAllMsgEditor } from '../editor-generators';

describe('Reply All', () => {
	const meAddress = 'me@test.com';
	const sharedAccountAddress = 'sharedAccount@test.com';
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
		jest.spyOn(shellHooks, 'getUserAccount').mockImplementation(() => mainAccount);
	});

	describe('A message sent to me, the sharedAccount and another person', () => {
		const originalFrom = 'someone@test.com';
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.INBOX,
			participants: [
				{ type: ParticipantRole.FROM, address: originalFrom },
				{ type: ParticipantRole.TO, address: meAddress },
				{ type: ParticipantRole.TO, address: sharedAccountAddress },
				{ type: ParticipantRole.TO, address: 'another@test.com' }
			]
		};
		it('should reply with default identity (Me)', () => {
			const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
			const defaultIdentity = '';
			expect(replyMsgEditor.identityId).toEqual(defaultIdentity);
		});

		it('should move "To" recipients to CC but exclude myself', () => {
			const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
			expect(replyMsgEditor.recipients.cc).toEqual([
				{
					address: sharedAccountAddress,
					type: 'c'
				},
				{
					address: 'another@test.com',
					type: 'c'
				}
			]);
		});
		it('should include only the original From address in the "To" field', () => {
			const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
			expect(replyMsgEditor.recipients.to).toEqual([
				{
					address: originalFrom,
					type: 't'
				}
			]);
		});
	});

	describe('A message sent only to the sharedAccount and another person', () => {
		const originalFrom = 'someone@test.com';
		const receivedMessage = {
			...generateMessage(),
			parent: FOLDERS.INBOX,
			participants: [
				{ type: ParticipantRole.FROM, address: originalFrom },
				{ type: ParticipantRole.TO, address: sharedAccountAddress },
				{ type: ParticipantRole.TO, address: 'another@test.com' }
			]
		};
		it('should reply as delegated account', () => {
			const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
			expect(replyMsgEditor.identityId).toEqual(`${sharedAccountAddress}sendAs`);
		});
		it('should move "To" recipients to CC but exclude the sharedAccount', () => {
			const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
			expect(replyMsgEditor.recipients.cc).toEqual([
				{
					address: 'another@test.com',
					type: 'c'
				}
			]);
		});
		it('should include only the original From address in the "To" field', () => {
			const replyMsgEditor = generateReplyAllMsgEditor(receivedMessage);
			expect(replyMsgEditor.recipients.to).toEqual([
				{
					address: originalFrom,
					type: 't'
				}
			]);
		});
	});
});
