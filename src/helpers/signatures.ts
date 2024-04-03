/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, getUserAccount, useUserAccount, useUserSettings } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { convertHtmlToPlainText } from '../carbonio-ui-commons/utils/text/html';
import { LineType } from '../commons/utils';
import type { EditorText } from '../types/editor';
import type { SignatureDescriptor } from '../types/signatures';

const NO_SIGNATURE_ID = '11111111-1111-1111-1111-111111111111';
const NO_SIGNATURE_LABEL = 'No signature';

/**
 * Match the first string which is between a
 * signature separator and either a quoted text
 * delimiter or the end of the content
 */
const PLAINTEXT_SIGNATURE_REGEX = new RegExp(
	`^(${LineType.SIGNATURE_PRE_SEP}\\n)(((?!\\s${LineType.PLAINTEXT_SEP}$).)*)`,
	'ms'
);

/**
 * Returns signatures descriptors for the given account
 * @param account
 */
const getSignatures = (account: Account | undefined): Array<SignatureDescriptor> => {
	const signatureArray = [
		{
			label: NO_SIGNATURE_LABEL,
			value: {
				html: '',
				text: '',
				id: NO_SIGNATURE_ID
			}
		} as SignatureDescriptor
	];

	map(account?.signatures?.signature, (item) =>

		{
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const htmlIndex = item.content.findIndex(obj => obj.type == "text/html");
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const textIndex = item.content.findIndex(obj => obj.type == "text/plain");
			signatureArray.push({
				// FIXME the Account type defined in Shell needs to be refactored (signatures and identities type)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				label: item.name,
				value: {
					// FIXME the Account type defined in Shell needs to be refactored (signatures and identities type)
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					html: htmlIndex !== -1 ? item.content[htmlIndex]._content : '',
					// FIXME the Account type defined in Shell needs to be refactored (signatures and identities type)
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					text: textIndex !== -1 ? item.content[textIndex]._content : '',
					// FIXME the Account type defined in Shell needs to be refactored (signatures and identities type)
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					id: item?.id
				}
			})
		}
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
	account: Account | undefined,
	signatureId: string,
	fallbackOnFirst?: boolean,
): SignatureDescriptor => {
	const signatures = getSignatures(account);
	const objIndex = signatures.findIndex(obj => obj.value.id == signatureId);
	if (objIndex === -1) {
		return signatures?.[0];
	}

	return signatures[objIndex];
};

/**
 * Returns the signature text value for the given account and signature id
 * @param account
 * @param signatureId
 */
/*const getSignatureValue = (account: Account | undefined, signatureId: string): string =>
	getSignature(account, signatureId,)?.value.description ?? '';*/

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
		? `<p></p><br><div class="${LineType.SIGNATURE_CLASS}">${signatureValue}</div>`
		: `\n\n${LineType.SIGNATURE_PRE_SEP}\n${convertHtmlToPlainText(signatureValue)}`;
};

/**
 * Replaces the signature in a HTML message body.
 *
 * @param body - HTML message body
 * @param newSignature - content of the new signature
 */
const replaceSignatureOnHtmlBody = (body: string, newSignature: string): string => {
	const doc = new DOMParser().parseFromString(body, 'text/html');

	// Get the element which wraps the signature
	const signatureWrappers = doc.getElementsByClassName(LineType.SIGNATURE_CLASS);

	let signatureWrapper = null;

	// Locate the separator
	const separator = doc.getElementById(LineType.HTML_SEP_ID);

	// Locate the first signature. If no wrapper is found then the unchanged mail body is returned
	signatureWrapper = signatureWrappers.item(0);
	if (signatureWrapper == null) {
		return body;
	}

	/*
	 * If a separator is present it should be located after the signature
	 * (the content after the separator is quoted text which shouldn't be altered).
	 * Otherwise the original body content is returned
	 */
	if (
		separator &&
		signatureWrapper.compareDocumentPosition(separator) !== Node.DOCUMENT_POSITION_FOLLOWING
	) {
		return body;
	}

	signatureWrapper.innerHTML = newSignature;
	return doc.documentElement.innerHTML;
};

/**
 * Replaces the signature in a plain text message body
 *
 * @param body - plain text message body
 * @param newSignature - signature content
 */
const replaceSignatureOnPlainTextBody = (body: string, newSignature: string): string => {
	// If no eligible signature is found the original body is returned
	if (!body.match(PLAINTEXT_SIGNATURE_REGEX)) {
		return body;
	}

	// Locate the first quoted text separator
	const quotedTextSeparatorPos = body.indexOf(LineType.PLAINTEXT_SEP);

	const match = body.match(PLAINTEXT_SIGNATURE_REGEX);

	/*
	 * If the body content doesn't match the regex or if it matches it
	 * but after a quoted-text separator (= the target signature is
	 * located inside the quoted text. This could happen when the user
	 * will manually remove the preset signature inside the UNquoted text.
	 */
	if (!match || (quotedTextSeparatorPos >= 0 && quotedTextSeparatorPos < (match.index ?? 0))) {
		return body;
	}

	// Replace the target signature
	return body.replace(PLAINTEXT_SIGNATURE_REGEX, `$1${newSignature}`);
};

/**
 * Composes the body of an email with signature of given signature id
 * @param text
 * @param signatureId
 */
const getMailBodyWithSignature = (text: EditorText, signatureId = ''): EditorText => {
	const signatureValue = signatureId !== '' ? getSignature(getUserAccount(), signatureId) : '';
	const plainSignatureValue =
		signatureValue !== '' ? `\n${convertHtmlToPlainText(signatureValue.value.text)}\n\n` : '';
	const htmlSignatureValue =
		signatureValue !== '' ? `${signatureValue.value.html}` : '';
	const richText = replaceSignatureOnHtmlBody(text.richText, htmlSignatureValue);
	const plainText = replaceSignatureOnPlainTextBody(text.plainText, plainSignatureValue);
	return { plainText, richText };
};

export {
	NO_SIGNATURE_ID,
	NO_SIGNATURE_LABEL,
	getSignatures,
	getSignature,
	composeMailBodyWithSignature,
	replaceSignatureOnPlainTextBody,
	getMailBodyWithSignature
};
