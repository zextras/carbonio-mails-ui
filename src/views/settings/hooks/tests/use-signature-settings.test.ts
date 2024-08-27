/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AccountSettings } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { useUserSettings } from '../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { generateSettings } from '../../../../carbonio-ui-commons/test/mocks/settings/settings-generator';
import { setupHook } from '../../../../carbonio-ui-commons/test/test-setup';
import { buildSignature } from '../../../../tests/generators/signatures';
import { SignItemType } from '../../../../types';
import {
	getContentLengthErrorMessageKey,
	getNameLengthErrorMessageKey,
	useSignatureSettings
} from '../use-signature-settings';

describe('useSignatureSettings', () => {
	describe('getNameLengthErrorMessageKey', () => {
		it('should return an error if the signature name is empty', () => {
			const {
				result: {
					current: [t]
				}
			} = setupHook(useTranslation);
			const signature = buildSignature({ name: '' });
			const result = getNameLengthErrorMessageKey(signature, t);
			expect(result).toEqual('Signature information is required.');
		});

		it('should return an error if the signature name is undefined', () => {
			const {
				result: {
					current: [t]
				}
			} = setupHook(useTranslation);
			const signature = buildSignature();
			// @ts-expect-error Testing this corner case
			signature.name = undefined;
			const result = getNameLengthErrorMessageKey(signature, t);
			expect(result).toEqual('Signature information is required.');
		});

		it('should return an error if the signature name contains only spaces', () => {
			const {
				result: {
					current: [t]
				}
			} = setupHook(useTranslation);
			const signature = buildSignature({ name: '    ' });
			const result = getNameLengthErrorMessageKey(signature, t);
			expect(result).toEqual('Signature information is required.');
		});

		it('should return null if the signature name length > 0', () => {
			const {
				result: {
					current: [t]
				}
			} = setupHook(useTranslation);
			const signature = buildSignature();
			const result = getNameLengthErrorMessageKey(signature, t);
			expect(result).toBeNull();
		});
	});

	describe('getContentLengthErrorMessageKey', () => {
		it('should return an error if the signature content is empty', () => {
			const {
				result: {
					current: [t]
				}
			} = setupHook(useTranslation);
			const signature = buildSignature({
				content: [
					{
						type: 'text/html',
						_content: ''
					}
				]
			});
			const result = getContentLengthErrorMessageKey(signature, 0, t);
			expect(result).toEqual('Signature information is required.');
		});

		it('should return an error if the signature content is undefined', () => {
			const {
				result: {
					current: [t]
				}
			} = setupHook(useTranslation);
			const signature = buildSignature();
			signature.content = undefined;
			signature.description = undefined;
			const result = getContentLengthErrorMessageKey(signature, 0, t);
			expect(result).toEqual('Signature information is required.');
		});

		it('should return an error if the signature content contains only spaces', () => {
			const {
				result: {
					current: [t]
				}
			} = setupHook(useTranslation);
			const signature = buildSignature({
				content: [
					{
						type: 'text/html',
						_content: '       '
					}
				]
			});
			const result = getContentLengthErrorMessageKey(signature, 0, t);
			expect(result).toEqual('Signature information is required.');
		});

		it('should return null if the signature content length exceed the limit', () => {
			const {
				result: {
					current: [t]
				}
			} = setupHook(useTranslation);
			const signature = buildSignature({
				content: [
					{
						type: 'text/html',
						_content: '0123456789'
					}
				]
			});
			const result = getContentLengthErrorMessageKey(signature, 5, t);
			expect(result).toEqual('One or more signatures exceed the size limit.');
		});

		it('should return null if the signature content length is within the limit', () => {
			const {
				result: {
					current: [t]
				}
			} = setupHook(useTranslation);
			const signature = buildSignature({
				content: [
					{
						type: 'text/html',
						_content: '0123456789'
					}
				]
			});
			const result = getContentLengthErrorMessageKey(signature, 10, t);
			expect(result).toBeNull();
		});
	});

	describe('validate', () => {
		it('should return an error message if a signature is missing the name', () => {
			const signatures: Array<SignItemType> = [buildSignature(), buildSignature({ name: '' })];
			const { result } = setupHook(useSignatureSettings);

			const { validate } = result.current;
			const validationResult = validate(signatures);
			expect(validationResult).toContain('Signature information is required.');
		});

		it('should return an error message if a signature is missing the content', () => {
			const signatures: Array<SignItemType> = [
				buildSignature(),
				buildSignature({
					content: [
						{
							type: 'text/html',
							_content: ''
						}
					]
				})
			];
			const { result } = setupHook(useSignatureSettings);

			const { validate } = result.current;
			const validationResult = validate(signatures);
			expect(validationResult).toContain('Signature information is required.');
		});

		it('should return an error message if a signature content is exceeding the size limit', () => {
			const customSettings: Partial<AccountSettings> = {
				attrs: {
					zimbraMailSignatureMaxLength: 10
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);
			const signatures: Array<SignItemType> = [
				buildSignature({
					content: [
						{
							type: 'text/html',
							_content: '012345678901234567'
						}
					]
				}),
				buildSignature()
			];

			const { result } = setupHook(useSignatureSettings);

			const { validate } = result.current;
			const validationResult = validate(signatures);
			expect(validationResult).toContain('One or more signatures exceed the size limit.');
		});

		it('should not return an error message if all signatures content is > than zero and size limit is 0', () => {
			const customSettings: Partial<AccountSettings> = {
				attrs: {
					zimbraMailSignatureMaxLength: 0
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);
			const signatures: Array<SignItemType> = [
				buildSignature({
					content: [
						{
							type: 'text/html',
							_content: '012345678901234567'
						}
					]
				}),
				buildSignature()
			];

			const { result } = setupHook(useSignatureSettings);

			const { validate } = result.current;
			const validationResult = validate(signatures);
			expect(validationResult).not.toContain('One or more signatures exceed the size limit.');
		});

		it('should not return an error message if all signatures content is > than zero and size limit setting is not present', () => {
			const settings = generateSettings();
			delete settings.attrs.zimbraMailSignatureMaxLength;
			useUserSettings.mockReturnValue(settings);
			const signatures: Array<SignItemType> = [
				buildSignature({
					content: [
						{
							type: 'text/html',
							_content: ''
						}
					]
				}),
				buildSignature()
			];

			const { result } = setupHook(useSignatureSettings);

			const { validate } = result.current;
			const validationResult = validate(signatures);
			expect(validationResult).not.toContain('One or more signatures exceed the size limit.');
		});

		it('should not return an error message if all signatures name and content are set and the contents size are within the limit', () => {
			const customSettings: Partial<AccountSettings> = {
				attrs: {
					zimbraMailSignatureMaxLength: 0
				}
			};
			const settings = generateSettings(customSettings);
			useUserSettings.mockReturnValue(settings);
			const signatures: Array<SignItemType> = [
				buildSignature({
					content: [
						{
							type: 'text/html',
							_content: '0123456789'
						}
					]
				}),
				buildSignature()
			];

			const { result } = setupHook(useSignatureSettings);

			const { validate } = result.current;
			const validationResult = validate(signatures);
			expect(validationResult).toHaveLength(0);
		});
	});
});
