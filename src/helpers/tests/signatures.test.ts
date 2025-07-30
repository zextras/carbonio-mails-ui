/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, getUserAccount } from '@zextras/carbonio-shell-ui';
import { cloneDeep } from 'lodash';

import { generateAccount } from '@test-utils/accounts/account-generator';
import { LineType } from 'commons/utils';
import {
	composeMailBodyWithSignature,
	getMailBodyWithSignature,
	getSignatures,
	getSignatureValue,
	NO_SIGNATURE_ID,
	NO_SIGNATURE_LABEL
} from 'helpers/signatures';

describe('Signatures', () => {
	describe('composeMailBodyWithSignature', () => {
		test('composeMailBodyWithSignature with plain text', () => {
			expect(composeMailBodyWithSignature('', false)).toBe('');
			expect(composeMailBodyWithSignature('lorem ipsum', false)).toBe(
				`\n\n${LineType.SIGNATURE_PRE_SEP}\nlorem ipsum`
			);
			expect(composeMailBodyWithSignature('lorem ipsum\nlorem ipsum', false)).toBe(
				`\n\n${LineType.SIGNATURE_PRE_SEP}\nlorem ipsum\nlorem ipsum`
			);
		});

		test('composeMailBodyWithSignature in plain text with html signature', () => {
			expect(composeMailBodyWithSignature('lorem ipsum', false)).toBe(
				`\n\n${LineType.SIGNATURE_PRE_SEP}\nlorem ipsum`
			);
			expect(composeMailBodyWithSignature('lorem ipsum<br/>lore ipsum', false)).toBe(
				`\n\n${LineType.SIGNATURE_PRE_SEP}\nlorem ipsum\nlore ipsum`
			);
			expect(
				composeMailBodyWithSignature(
					'lorem ipsum<img src="./placeholder.png" alt="placeholder.png"/> lorem ipsum',
					false
				)
			).toBe(`\n\n${LineType.SIGNATURE_PRE_SEP}\nlorem ipsum lorem ipsum`);
		});

		test('composeMailBodyWithSignature in rich text with html signature', () => {
			expect(composeMailBodyWithSignature('lorem ipsum', true)).toBe(
				`<p></p><div class="${LineType.SIGNATURE_CLASS}">lorem ipsum</div>`
			);
			expect(composeMailBodyWithSignature('lorem ipsum<br/>lore ipsum', true)).toBe(
				`<p></p><div class="${LineType.SIGNATURE_CLASS}">lorem ipsum<br/>lore ipsum</div>`
			);
			expect(
				composeMailBodyWithSignature(
					'lorem ipsum<img src="./placeholder.png" alt="placeholder.png"/> lorem ipsum',
					true
				)
			).toBe(
				`<p></p><div class="${LineType.SIGNATURE_CLASS}">lorem ipsum<img src="./placeholder.png" alt="placeholder.png"/> lorem ipsum</div>`
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
			account && (account.signatures.signature = []);
			expect(getSignatures(account)).toEqual([
				{
					label: NO_SIGNATURE_LABEL,
					value: { description: '', id: NO_SIGNATURE_ID }
				}
			]);
		});

		test('getSignatures returns the "empty" placeholder if there is no account', () => {
			expect(getSignatures(undefined)).toEqual([
				{
					label: NO_SIGNATURE_LABEL,
					value: { description: '', id: NO_SIGNATURE_ID }
				}
			]);
		});

		test('getSignatures from account with signatures', () => {
			const account = getUserAccount();
			// TODO remove the any after the signatures type will be added to account in Shell
			const signature: any = account?.signatures?.signature?.[0];

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
			const signature: any = account?.signatures?.signature?.[0];
			expect(getSignatureValue(account, NO_SIGNATURE_ID)).toEqual('');
			expect(getSignatureValue(account, 'invalid-id')).toEqual('');
			expect(getSignatureValue(account, signature.id)).toEqual(signature.content[0]._content);
		});
	});

	describe('getMailBodyWithSignature', () => {
		const account = generateAccount();
		const signature1 = {
			content: [{ _content: 'This is my Signature 1', type: 'text/html' }],
			id: '123',
			name: 'MySig1'
		};
		const signature2 = {
			content: [{ _content: 'This is my Signature 2', type: 'text/html' }],
			id: '456',
			name: 'MySig2'
		};

		beforeEach(() => {
			(getUserAccount as jest.Mock).mockReturnValue({
				...account,
				signatures: { signature: [signature1, signature2] }
			});
		});

		it('should add HTML signature when not present', () => {
			const editorText = { plainText: '', richText: '<p>hello</p>' };
			const result = getMailBodyWithSignature(editorText, signature1.id);
			expect(result.richText).toContain('<p>hello</p>');
			expect(result.richText).toContain(signature1.content[0]._content);
		});

		it('should remove signature when none selected', () => {
			const editorText = {
				plainText: '',
				richText: '<p>hello</p><div class="signature-div">This is my Signature 1</div>'
			};
			const result = getMailBodyWithSignature(editorText, NO_SIGNATURE_ID);
			expect(result.richText).toBe('<head></head><body><p>hello</p></body>');
		});

		it('should replace existing signature with new one', () => {
			const editorText = {
				plainText: '',
				richText: '<p>hello</p><div class="signature-div">This is my Signature 1</div>'
			};
			const result = getMailBodyWithSignature(editorText, signature2.id);
			expect(result.richText).toBe(
				'<head></head><body><p>hello</p><div class="signature-div">This is my Signature 2</div></body>'
			);
		});

		it.each([NO_SIGNATURE_ID, '123'])(
			`should return whole document when using signature %s`,
			(signatureId: string) => {
				const editorText = { plainText: '', richText: '<p></p>' };
				const result = getMailBodyWithSignature(editorText, signatureId);
				expect(result.richText).toMatch(/^<head><\/head><body>.*<\/body>$/);
			}
		);

		it('should add signature before quoted text separator', () => {
			const editorText = {
				plainText: '',
				richText: '<p>Hello</p><hr id="zwchr" /><p>Quoted text</p>'
			};
			const result = getMailBodyWithSignature(editorText, signature1.id);
			expect(result.richText).toBe(
				'<head></head><body><p>Hello</p><div class="signature-div">This is my Signature 1</div><hr id="zwchr"><p>Quoted text</p></body>'
			);
		});

		it('should replace signature if it exists in the body before quoted text', () => {
			const editorText = {
				plainText: '',
				richText:
					'<p>Hello</p><div class="signature-div">This is my Signature 1</div><hr id="zwchr" /><p>Quoted text</p>'
			};
			const result = getMailBodyWithSignature(editorText, signature2.id);
			expect(result.richText).toBe(
				'<head></head><body><p>Hello</p><div class="signature-div">This is my Signature 2</div><hr id="zwchr"><p>Quoted text</p></body>'
			);
		});

		it('should not replace signature if it exists after quoted text', () => {
			const editorText = {
				plainText: '',
				richText:
					'<p>Hello</p><hr id="zwchr" /><p>Quoted text</p><div class="signature-div">This is my Signature 1</div>'
			};
			const result = getMailBodyWithSignature(editorText, signature2.id);
			expect(result.richText).toBe(
				'<head></head><body><p>Hello</p><div class="signature-div">This is my Signature 2</div><hr id="zwchr"><p>Quoted text</p><div class="signature-div">This is my Signature 1</div></body>'
			);
		});
	});
});
