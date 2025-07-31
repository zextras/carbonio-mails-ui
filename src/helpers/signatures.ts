/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, getUserAccount } from '@zextras/carbonio-shell-ui';
import { find, map } from 'lodash';

import { convertHtmlToPlainText } from 'commons/utilities';
import { LineType } from 'commons/utils';
import type { EditorText } from 'types/editor/index.d';
import type { SignatureDescriptor } from 'types/signatures/index.d';

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
	account: Account | undefined,
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
const getSignatureValue = (account: Account | undefined, signatureId: string): string =>
	getSignature(account, signatureId)?.value.description ?? '';

const isElementInQuotedText = (signatureWrapper: Element, doc: Document): boolean => {
	const quotedTextSeparator = doc.getElementById(LineType.HTML_SEP_ID);
	if (!quotedTextSeparator) {
		return false;
	}
	return (
		signatureWrapper.compareDocumentPosition(quotedTextSeparator) !==
		Node.DOCUMENT_POSITION_FOLLOWING
	);
};

const SIGNATURE_CLASS = 'signature-div';
const getSignatureBeforeQuotedText = (doc: Document): Element | null => {
	const signatureWrappers = doc.getElementsByClassName(SIGNATURE_CLASS);
	const firstSignatureInBody = signatureWrappers.item(0);
	if (!firstSignatureInBody || isElementInQuotedText(firstSignatureInBody, doc)) {
		return null;
	}
	return firstSignatureInBody;
};

const addSignatureToDoc = (doc: Document, signature: string): string => {
	const quotedBlockSeparator = doc.getElementById(LineType.HTML_SEP_ID);
	const newSignatureWrapper = doc.createElement('div');
	newSignatureWrapper.className = SIGNATURE_CLASS;
	newSignatureWrapper.innerHTML = signature;
	if (quotedBlockSeparator) {
		newSignatureWrapper.appendChild(doc.createElement('br'));
		newSignatureWrapper.appendChild(doc.createElement('br'));
	}
	quotedBlockSeparator
		? quotedBlockSeparator.parentNode?.insertBefore(newSignatureWrapper, quotedBlockSeparator)
		: doc.body.appendChild(newSignatureWrapper);
	return doc.documentElement.innerHTML;
};
/**
 * Replaces the signature in a HTML message body.
 *
 * @param doc
 * @param newSignature - content of the new signature
 */
const replaceSignatureOnHtmlBody = (doc: Document, newSignature: string): string => {
	const signatureBeforeQuotedText = getSignatureBeforeQuotedText(doc);
	if (signatureBeforeQuotedText) {
		signatureBeforeQuotedText.remove();
	}

	if (newSignature !== '') {
		addSignatureToDoc(doc, newSignature);
	}
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
 * Inserts a paragraph before the quoted text separator if the first child is an HR element.
 * @param doc - The HTML document to modify.
 */
function insertParagraphBeforeQuotedSeparator(doc: Document): void {
	const quotedTextSepElement = doc.getElementById(LineType.HTML_SEP_ID);
	const parentNode = quotedTextSepElement?.parentNode;
	if (parentNode?.firstChild === quotedTextSepElement) {
		parentNode.insertBefore(doc.createElement('p'), quotedTextSepElement);
	}
}

/**
 * Returns the mail body with the signature applied.
 * @param text
 * @param signatureId
 */
const getMailBodyWithSignature = (text: EditorText, signatureId = ''): EditorText => {
	const signatureValue = signatureId ? getSignatureValue(getUserAccount(), signatureId) : '';
	const plainSignatureValue = signatureValue
		? `\n${convertHtmlToPlainText(signatureValue)}\n\n`
		: '';
	const previousRichText = text.richText.trim() || '<p></p>';

	const doc = new DOMParser().parseFromString(previousRichText, 'text/html');

	insertParagraphBeforeQuotedSeparator(doc);

	const richText = replaceSignatureOnHtmlBody(doc, signatureValue);
	const plainText = replaceSignatureOnPlainTextBody(text.plainText, plainSignatureValue);

	return { plainText, richText };
};

export {
	NO_SIGNATURE_ID,
	NO_SIGNATURE_LABEL,
	getSignatures,
	getSignature,
	getSignatureValue,
	replaceSignatureOnPlainTextBody,
	getMailBodyWithSignature
};
