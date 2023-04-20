/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account } from '@zextras/carbonio-shell-ui';
import { find, map } from 'lodash';
import { convertHtmlToPlainText } from '../carbonio-ui-commons/utils/text/html';
import { LineType } from '../commons/utils';
import type { SignatureDescriptor } from '../types/signatures';

const NO_SIGNATURE_ID = '11111111-1111-1111-1111-111111111111';
const NO_SIGNATURE_LABEL = 'No signature';

/**
 * Returns signatures descriptors for the given account
 * @param account
 */
const getSignatures = (account: Account): Array<SignatureDescriptor> => {
	const signatureArray = [
		{
			label: NO_SIGNATURE_LABEL,
			value: { description: '', id: NO_SIGNATURE_ID }
		}
	];
	map(account?.signatures?.signature, (item) =>
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

	return isRichText
		? `<br/><br/><div class="${LineType.SIGNATURE_CLASS}">${signatureValue}</div>`
		: `\n\n${LineType.SIGNATURE_PRE_SEP}\n${convertHtmlToPlainText(signatureValue)}`;
};

export {
	NO_SIGNATURE_ID,
	NO_SIGNATURE_LABEL,
	getSignatures,
	getSignature,
	getSignatureValue,
	composeMailBodyWithSignature
};
