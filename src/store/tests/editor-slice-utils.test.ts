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
	it('should retrieveCC', () => {
		const defaultIdentity = {
			id: '3b778c1d-529f-45b7-b131-5162c83551f7',
			name: 'DEFAULT',
			_attrs: []
		} as shellHooks.Identity;

		const sendAsIdentity = {
			id: '80c3aba1-f2e9-4492-9447-cabdbf08a2e8',
			name: 'sendAsIdentity',
			_attrs: [
				{
					zimbraPrefIdentityName: 'sendAsIdentity',
					zimbraPrefFromDisplay: 'Homer Simpson',
					zimbraPrefFromAddress: 'delegator@email.com',
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
							id: '0',
							name: 'Homer Simpson',
							type: 'account',
							email: [{ addr: 'delegator@email.com' }],
							d: 'Homer Simpson'
						}
					]
				}
			]
		};

		const dummyAccount = generateAccount();
		const account = {
			...dummyAccount,
			id: defaultIdentity.id,
			email: 'default@test.com',
			identities: { identity: [defaultIdentity, sendAsIdentity], rights: accountRights }
		};

		// console.log(account?.rights.targets[0].target[0].email);

		jest.spyOn(shellHooks, 'getUserAccount').mockReturnValue(account);

		const senderAccountName = 'delegator@email.com';
		const message = generateMessage({
			from: {
				type: 'f',
				address: senderAccountName
			},
			cc: [
				{
					type: 'c',
					address: 'delegator@email.com'
				}
			],
			to: []
		});
		const participants = retrieveCC(message, senderAccountName);
		expect(participants).toEqual([
			{
				type: 'c',
				address: 'delegator@email.com'
			}
		]);
	});
});
