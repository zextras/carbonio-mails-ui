/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Account, getUserAccount } from '@zextras/carbonio-shell-ui';
import { find, isEmpty, map } from 'lodash';

import { convertHtmlToPlainText } from 'commons/utilities';
import { LineType } from 'commons/utils';
import type { EditorText } from 'types/editor';
import type { SignatureDescriptor } from 'types/signatures';

const NO_SIGNATURE_ID = '11111111-1111-1111-1111-111111111111';
const NO_SIGNATURE_LABEL = 'No signature';

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
 * @param oldSignature - signature content to be replaced
 * @param newSignature - signature content
 */
const replaceSignatureOnPlainTextBody = (
	body: string,
	oldSignature: string,
	newSignature: string
): string => {
	const bodyAndQuotedText = body.split(LineType.PLAINTEXT_SEP);
	let bodyWithoutQuotedText = bodyAndQuotedText[0];
	const hasQuotedText = bodyAndQuotedText.length > 1;

	const optionalNewLine = bodyWithoutQuotedText.endsWith('\n') ? '' : '\n';
	bodyWithoutQuotedText += optionalNewLine;

	const signatureTemplate: (signatureContent: string) => string = (signatureContent: string) => {
		if (isEmpty(signatureContent)) {
			return '';
		}
		return `${LineType.SIGNATURE_PRE_SEP}\n${signatureContent}\n${hasQuotedText ? '\n\n' : ''}`;
	};

	if (isEmpty(oldSignature)) {
		if (isEmpty(newSignature)) {
			return body;
		}
		bodyAndQuotedText[0] = `${bodyWithoutQuotedText}${signatureTemplate(newSignature)}`;
		return bodyAndQuotedText.join(`${LineType.PLAINTEXT_SEP}`);
	}

	const newBody = bodyWithoutQuotedText.replace(signatureTemplate(oldSignature), '');

	bodyAndQuotedText[0] = `${newBody}${signatureTemplate(newSignature)}`;
	return bodyAndQuotedText.join(`${LineType.PLAINTEXT_SEP}`);
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

const getMailBodyWithSignature = ({
	editorText,
	oldSignatureId,
	newSignatureId
}: {
	editorText: EditorText;
	oldSignatureId?: string;
	newSignatureId?: string;
}): EditorText => {
	const newSignatureValue = newSignatureId
		? getSignatureValue(getUserAccount(), newSignatureId)
		: '';
	const oldSignatureValue = oldSignatureId
		? getSignatureValue(getUserAccount(), oldSignatureId)
		: '';
	const previousPlainText = editorText.plainText || '\n\n';
	const newPlainSignatureValue = newSignatureValue
		? `${convertHtmlToPlainText(newSignatureValue)}`
		: '';
	const oldPlainSignatureValue = oldSignatureValue
		? `${convertHtmlToPlainText(oldSignatureValue)}`
		: '';
	const previousRichText = editorText.richText.trim() || '<p></p><p></p>';

	const doc = new DOMParser().parseFromString(previousRichText, 'text/html');

	insertParagraphBeforeQuotedSeparator(doc);

	const richText = replaceSignatureOnHtmlBody(doc, newSignatureValue);
	const plainText = replaceSignatureOnPlainTextBody(
		previousPlainText,
		oldPlainSignatureValue,
		newPlainSignatureValue
	);

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
