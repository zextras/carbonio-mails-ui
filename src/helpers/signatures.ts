/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account } from '@zextras/carbonio-shell-ui';
import { find, map } from 'lodash';
import { SignatureDescriptor } from '../types/signatures';

/**
 * Returns signatures descriptors for the given account
 * @param account
 */
const getSignatures = (account: Account): Array<SignatureDescriptor> => {
	const signatureArray = [
		{
			label: 'No signature',
			value: { description: '', id: '11111111-1111-1111-1111-111111111111' }
		}
	];
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	map(account.signatures.signature, (item) =>
		signatureArray.push({
			// FIXME the Account type defined in Shell needs to be refactored (signatures and identities type)
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			label: item.name,
			// FIXME the Account type defined in Shell needs to be refactored (signatures and identities type)
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			value: { description: item.content ? item.content[0]._content : '', id: item?.id }
		})
	);
	return signatureArray;
};

/**
 * Returns signature descriptor for the given account and signature id
 * @param account
 * @param signatureId
 * @param fallbackOnFirst - If set to true and if no signature matches the give id (or the given id is undefined) the
 * first signature of the account is returned, instead of returning undefined
 */
const getSignature = (
	account: Account,
	signatureId: string,
	fallbackOnFirst?: boolean
): SignatureDescriptor | undefined => {
	const signatures = getSignatures(account);
	const result = find(
		signatures,
		(signature: SignatureDescriptor) => signature.value.id === signatureId
	);

	return result ?? (fallbackOnFirst ? signatures?.[0] : undefined);
};

/**
 * Returns the signature text value for the given account and signature id
 * @param account
 * @param signatureId
 */
const getSignatureValue = (account: Account, signatureId: string): string =>
	getSignature(account, signatureId)?.value.description ?? '';

/**
 * Composes the body of an email with the given signature
 * @param signatureValue
 * @param isRichText
 */
const composeMailBodyWithSignature = (
	signatureValue: string | undefined,
	isRichText: boolean
): string => {
	if (!signatureValue) {
		return '';
	}

	return (isRichText ? '<br/><br/>' : '\n\n') + signatureValue;
};

export { getSignatures, getSignature, getSignatureValue, composeMailBodyWithSignature };
