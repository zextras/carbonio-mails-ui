/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, getUserAccount, getUserAccounts } from '@zextras/carbonio-shell-ui';
import { cloneDeep } from 'lodash';
import {
	composeMailBodyWithSignature,
	getSignature,
	getSignatures,
	getSignatureValue,
	NO_SIGNATURE_ID,
	NO_SIGNATURE_LABEL
} from '../signatures';

describe('Signatures', () => {
	describe('composeMailBodyWithSignature', () => {
		test('composeMailBodyWithSignature with plain text', () => {
			expect(composeMailBodyWithSignature('', false)).toBe('');
			expect(composeMailBodyWithSignature('lorem ipsum', false)).toBe('\n\n---\nlorem ipsum');
			expect(composeMailBodyWithSignature('lorem ipsum\nlorem ipsum', false)).toBe(
				'\n\n---\nlorem ipsum\nlorem ipsum'
			);
		});

		test('composeMailBodyWithSignature in plain text with html signature', () => {
			expect(composeMailBodyWithSignature('lorem ipsum', false)).toBe('\n\n---\nlorem ipsum');
			expect(composeMailBodyWithSignature('lorem ipsum<br/>lore ipsum', false)).toBe(
				'\n\n---\nlorem ipsum\nlore ipsum'
			);
			expect(
				composeMailBodyWithSignature(
					'lorem ipsum<img src="./placeholder.png" alt="placeholder.png"/> lorem ipsum',
					false
				)
			).toBe('\n\n---\nlorem ipsum lorem ipsum');
		});

		test('composeMailBodyWithSignature in rich text with html signature', () => {
			expect(composeMailBodyWithSignature('lorem ipsum', true)).toBe(
				'<br/><br/><div class="signature-div">lorem ipsum</div>'
			);
			expect(composeMailBodyWithSignature('lorem ipsum<br/>lore ipsum', true)).toBe(
				'<br/><br/><div class="signature-div">lorem ipsum<br/>lore ipsum</div>'
			);
			expect(
				composeMailBodyWithSignature(
					'lorem ipsum<img src="./placeholder.png" alt="placeholder.png"/> lorem ipsum',
					true
				)
			).toBe(
				'<br/><br/><div class="signature-div">lorem ipsum<img src="./placeholder.png" alt="placeholder.png"/> lorem ipsum</div>'
			);
		});
	});

	describe('getSignatures', () => {
		test('getSignatures from empty account', () => {
			expect(getSignatures({} as Account)).toEqual([
				{
					label: NO_SIGNATURE_LABEL,
					value: { description: '', id: NO_SIGNATURE_ID }
				}
			]);
		});

		test('getSignatures from account with empty signatures', () => {
			const account = cloneDeep(getUserAccount());
			account.signatures.signature = [];
			expect(getSignatures(account)).toEqual([
				{
					label: NO_SIGNATURE_LABEL,
					value: { description: '', id: NO_SIGNATURE_ID }
				}
			]);
		});

		test('getSignatures from account with signatures', () => {
			const account = getUserAccount();
			// TODO remove the any after the signatures type will be added to account in Shell
			const signature: any = account.signatures.signature[0];

			expect(getSignatures(account).length).toBeGreaterThan(1);
			expect(getSignatures(account)[0].label).toBe(NO_SIGNATURE_LABEL);
			expect(getSignatures(account)[0].value.id).toBe(NO_SIGNATURE_ID);
			expect(getSignatures(account)[1].label).toBe(signature.name);
			expect(getSignatures(account)[1].value.id).toBe(signature.id);
			expect(getSignatures(account)[1].value.description).toBe(signature.content[0]._content);
		});
	});

	describe('getSignatureValue', () => {
		test('getSignatureValue', () => {
			const account = getUserAccount();
			// TODO remove the any after the signatures type will be added to account in Shell
			const signature: any = account.signatures.signature[0];
			expect(getSignatureValue(account, NO_SIGNATURE_ID)).toEqual('');
			expect(getSignatureValue(account, 'invalid-id')).toEqual('');
			expect(getSignatureValue(account, signature.id)).toEqual(signature.content[0]._content);
		});
	});
});
