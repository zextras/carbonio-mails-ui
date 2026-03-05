/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, getUserAccount } from '@zextras/carbonio-shell-ui';
import { cloneDeep } from 'lodash';
import type { Mock } from 'vitest';

import { LineType } from '../../commons/utils';
import { generateAccount } from '@test-utils/accounts/account-generator';
import {
	getMailBodyWithSignature,
	getSignatures,
	getSignatureValue,
	NO_SIGNATURE_ID,
	NO_SIGNATURE_LABEL
} from 'helpers/signatures';
import { Signature } from 'types/settings';

describe('Signatures', () => {
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

	describe('getMailBodyWithSignatureV2', () => {
		const account = generateAccount();
		const signature1 = {
			content: [{ _content: 'This is my Signature 1', type: 'text/html' }],
			id: '123',
			name: 'MySig1'
		};
		const signature2: Signature = {
			content: [{ _content: 'This is my Signature 2', type: 'text/html' }],
			id: '456',
			name: 'MySig2'
		};

		beforeEach(() => {
			(getUserAccount as Mock).mockReturnValue({
				...account,
				signatures: { signature: [signature1, signature2] }
			});
		});
		describe('HTML', () => {
			describe('Email with quoted text', () => {
				it('should replace signature before quoted text when new signature not empty', () => {
					const editorText = {
						plainText: '',
						richText:
							'<p>Hello</p><div class="signature-div">This is my Signature 1</div><hr id="zwchr" /><p>Quoted text</p>'
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature2.id });
					expect(result.richText).toBe(
						'<head></head><body><p>Hello</p><div class="signature-div">This is my Signature 2<br><br></div><hr id="zwchr"><p>Quoted text</p></body>'
					);
				});
				it('should add signature with two line breaks before quoted text when new signature not empty', () => {
					const editorText = {
						plainText: '',
						richText: '<p>Hello</p><hr id="zwchr" /><p>Quoted text</p>'
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature2.id });
					expect(result.richText).toBe(
						'<head></head><body><p>Hello</p><div class="signature-div">This is my Signature 2<br><br></div><hr id="zwchr"><p>Quoted text</p></body>'
					);
				});
				it('should remove previous signature before quoted text and add the new to the bottom when new signature not empty', () => {
					const editorText = {
						plainText: '',
						richText:
							'<p>Hello</p><div class="signature-div">This is my Signature 1</div><p>Text after signature</p><hr id="zwchr" /><p>Quoted text</p>'
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature2.id });
					expect(result.richText).toBe(
						'<head></head><body><p>Hello</p><p>Text after signature</p><div class="signature-div">This is my Signature 2<br><br></div><hr id="zwchr"><p>Quoted text</p></body>'
					);
				});

				it('should remove signature with line breaks before quoted text when NO_SIGNATURE selected', () => {
					const editorText = {
						plainText: '',
						richText:
							'<p>hello</p><div class="signature-div">This is my Signature 1<br><br></div><hr id="zwchr"><p>Quoted text</p><div class="signature-div">This is my Signature 1</div>'
					};
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: NO_SIGNATURE_ID
					});
					expect(result.richText).toBe(
						'<head></head><body><p>hello</p><hr id="zwchr"><p>Quoted text</p><div class="signature-div">This is my Signature 1</div></body>'
					);
				});

				it('should not remove text after signature but before quoted text when NO_SIGNATURE selected', () => {
					const editorText = {
						plainText: '',
						richText:
							'<p>hello</p><div class="signature-div">This is my Signature 1</div><p>P.S.: must not be removed</p><hr id="zwchr"><p>Quoted text</p><div class="signature-div">This is my Signature 1</div>'
					};
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: NO_SIGNATURE_ID
					});
					expect(result.richText).toBe(
						'<head></head><body><p>hello</p><p>P.S.: must not be removed</p><hr id="zwchr"><p>Quoted text</p><div class="signature-div">This is my Signature 1</div></body>'
					);
				});

				it('should not replace signature after quoted text when new signature not empty', () => {
					const editorText = {
						plainText: '',
						richText:
							'<p>Hello</p><hr id="zwchr" /><p>Quoted text</p><div class="signature-div">This is my Signature 1</div>'
					};
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: signature2.id
					});
					expect(result.richText).toBe(
						'<head></head><body><p>Hello</p><div class="signature-div">This is my Signature 2<br><br></div><hr id="zwchr"><p>Quoted text</p><div class="signature-div">This is my Signature 1</div></body>'
					);
				});
				it('should not remove signature after quoted text when NO_SIGNATURE selected', () => {
					const editorText = {
						plainText: '',
						richText:
							'<p>hello</p><hr id="zwchr" /><p>Quoted text</p><div class="signature-div">This is my Signature 1</div>'
					};
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: NO_SIGNATURE_ID
					});
					expect(result.richText).toBe(
						'<head></head><body><p>hello</p><hr id="zwchr"><p>Quoted text</p><div class="signature-div">This is my Signature 1</div></body>'
					);
				});

				it('should add signature before quoted text separator when no signature present', () => {
					const editorText = {
						plainText: '',
						richText: '<p>Hello</p><hr id="zwchr" /><p>Quoted text</p>'
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature1.id });
					expect(result.richText).toBe(
						'<head></head><body><p>Hello</p><div class="signature-div">This is my Signature 1<br><br></div><hr id="zwchr"><p>Quoted text</p></body>'
					);
				});
				it('should not add any signature before quoted text when no signature present and NO_SIGNATURE selected', () => {
					const editorText = {
						plainText: '',
						richText: '<p>Hello</p><hr id="zwchr"><p>Quoted text</p>'
					};
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: NO_SIGNATURE_ID
					});
					expect(result.richText).toBe(
						'<head></head><body><p>Hello</p><hr id="zwchr"><p>Quoted text</p></body>'
					);
				});

				it('should add empty paragraph if there is quoted text but the body is empty', () => {
					const editorText = { plainText: '', richText: '<hr id="zwchr"><p>Quoted text</p>' };
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature1.id });
					const emptyParagraph = `<p></p>`;
					expect(result.richText).toBe(
						`<head></head><body>${emptyParagraph}<div class="signature-div">This is my Signature 1<br><br></div><hr id="zwchr"><p>Quoted text</p></body>`
					);
				});

				it('should not add empty paragraph if there is HR tag before quoted text', () => {
					const editorText = { plainText: '', richText: '<hr><hr id="zwchr"><p>Quoted text</p>' };
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature1.id });
					expect(result.richText).toBe(
						`<head></head><body><hr><div class="signature-div">This is my Signature 1<br><br></div><hr id="zwchr"><p>Quoted text</p></body>`
					);
				});

				it('should add empty paragraph if there is quoted text with empty body and NO_SIGNATURE', () => {
					const editorText = { plainText: '', richText: '<hr id="zwchr"><p>Quoted text</p>' };
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: NO_SIGNATURE_ID
					});
					const emptyParagraph = `<p></p>`;
					expect(result.richText).toBe(
						`<head></head><body>${emptyParagraph}<hr id="zwchr"><p>Quoted text</p></body>`
					);
				});

				it('should not add empty paragraph if there is quoted text with non empty body', () => {
					const editorText = {
						plainText: '',
						richText: '<p>hello</p><hr id="zwchr"><p>Quoted text</p>'
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature1.id });
					expect(result.richText).toBe(
						`<head></head><body><p>hello</p><div class="signature-div">This is my Signature 1<br><br></div><hr id="zwchr"><p>Quoted text</p></body>`
					);
				});
			});

			describe('Email without quoted text', () => {
				it('should remove previous signature and add the new one to the bottom', () => {
					const editorText = {
						plainText: '',
						richText:
							'<p>hello</p><div class="signature-div">This is my Signature 1</div><p>Text after</p>'
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature2.id });
					expect(result.richText).toBe(
						'<head></head><body><p>hello</p><p>Text after</p><div class="signature-div">This is my Signature 2</div></body>'
					);
				});
				it('should remove signature when NO_SIGNATURE selected', () => {
					const editorText = {
						plainText: '',
						richText: '<p>hello</p><div class="signature-div">This is my Signature 1</div>'
					};
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: NO_SIGNATURE_ID
					});
					expect(result.richText).toBe('<head></head><body><p>hello</p></body>');
				});
				it('should not add any signature when no signature is present and NO_SIGNATURE selected', () => {
					const editorText = {
						plainText: '',
						richText: '<p>Hello</p>'
					};
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: NO_SIGNATURE_ID
					});
					expect(result.richText).toBe('<head></head><body><p>Hello</p></body>');
				});
			});
		});

		describe('Plain Text', () => {
			describe('Email without quoted text', () => {
				it('should not add signature if NO_SIGNATURE selected', () => {
					const editorText = {
						plainText: '',
						richText: ''
					};
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: NO_SIGNATURE_ID
					});
					expect(result.plainText).toBe('\n\n');
				});

				it('should add signature with two leading line breaks if original body empty', () => {
					const editorText = {
						plainText: '',
						richText: ''
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature2.id });
					expect(result.plainText).toBe('\n\n---\nThis is my Signature 2\n');
				});

				it('should add signature with one trailing line break', () => {
					const editorText = {
						plainText: '',
						richText: ''
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature1.id });
					expect(result.plainText).toBe('\n\n---\nThis is my Signature 1\n');
				});

				it('should add signature right below text if original body not empty', () => {
					const editorText = {
						plainText: 'Hello there!',
						richText: ''
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature2.id });
					expect(result.plainText).toBe('Hello there!\n---\nThis is my Signature 2\n');
				});

				it('should remove old signature if new one is NO_SIGNATURE', () => {
					const editorText = {
						plainText: 'Hello there!\n---\nThis is my Signature 1\n',
						richText: ''
					};
					const result = getMailBodyWithSignature({
						editorText,
						oldSignatureId: signature1.id,
						newSignatureId: NO_SIGNATURE_ID
					});
					expect(result.plainText).toBe('Hello there!\n');
				});

				it('should replace existing signature with new one', () => {
					const editorText = {
						plainText: 'Hello there!\n---\nThis is my Signature 1\n',
						richText: ''
					};
					const result = getMailBodyWithSignature({
						editorText,
						oldSignatureId: signature1.id,
						newSignatureId: signature2.id
					});
					expect(result.plainText).toBe('Hello there!\n---\nThis is my Signature 2\n');
				});

				it('should remove previous signature and add the new one to the bottom, preserving text after signature', () => {
					const editorText = {
						plainText: 'Hello there!\n---\nThis is my Signature 1\n\nText after signature',
						richText: ''
					};
					const result = getMailBodyWithSignature({
						editorText,
						oldSignatureId: signature1.id,
						newSignatureId: signature2.id
					});
					expect(result.plainText).toBe(
						'Hello there!\n\nText after signature\n---\nThis is my Signature 2\n'
					);
				});
			});
			describe('Email with quoted text', () => {
				it('should add signature when body contain quoted text', () => {
					const editorText = {
						plainText: `Hello\n${LineType.PLAINTEXT_SEP}\nQuoted text`,
						richText: ''
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature1.id });
					expect(result.plainText).toBe(
						`Hello\n---\nThis is my Signature 1\n\n\n${LineType.PLAINTEXT_SEP}\nQuoted text`
					);
				});

				it('should add signature with one trailing line break', () => {
					const editorText = {
						plainText: `Hello\n${LineType.PLAINTEXT_SEP}\nQuoted text`,
						richText: ''
					};
					const result = getMailBodyWithSignature({ editorText, newSignatureId: signature1.id });
					expect(result.plainText).toBe(
						'Hello\n' +
							'---\n' +
							'This is my Signature 1\n' +
							'\n' +
							'\n' +
							'---------------------------\n' +
							'Quoted text'
					);
				});

				it('should replace signature', () => {
					const editorText = {
						plainText: `Hello\n${LineType.SIGNATURE_PRE_SEP}\nThis is my Signature 1\n\n\n${LineType.PLAINTEXT_SEP}\nQuoted text`,
						richText: ''
					};
					const result = getMailBodyWithSignature({
						editorText,
						oldSignatureId: signature1.id,
						newSignatureId: signature2.id
					});
					expect(result.plainText).toBe(
						`Hello\n---\nThis is my Signature 2\n\n\n${LineType.PLAINTEXT_SEP}\nQuoted text`
					);
				});

				it('should not remove/replace signature after quoted text', () => {
					const editorText = {
						plainText: `Hello\n---\nThis is my Signature 1\n\n\n${LineType.PLAINTEXT_SEP}\nQuoted text\n---\nThis is my Signature 1\n`,
						richText: ''
					};
					const result = getMailBodyWithSignature({
						editorText,
						newSignatureId: signature2.id,
						oldSignatureId: signature1.id
					});
					expect(result.plainText).toBe(
						`Hello\n---\nThis is my Signature 2\n\n\n${LineType.PLAINTEXT_SEP}\nQuoted text\n---\nThis is my Signature 1\n`
					);
				});
			});
		});

		it.each([NO_SIGNATURE_ID, '123'])(
			`should wrap original body in a document when using signature %s`,
			(signatureId: string) => {
				const editorText = { plainText: '', richText: '<p></p>' };
				const result = getMailBodyWithSignature({ editorText, newSignatureId: signatureId });
				expect(result.richText).toMatch(/^<head><\/head><body>.*<\/body>$/);
			}
		);
	});
});
