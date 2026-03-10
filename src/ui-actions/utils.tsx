/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, truncate } from 'lodash';
import { useLocation } from 'react-router-dom';

import { SEARCH_ROUTE } from '../constants';
import { MessageAction } from 'types/actions';
import { MailsEditorV2 } from 'types/editor';

/**
 *
 * @param actions
 * @param id
 */
export const findMessageActionById = (
	actions: Array<MessageAction>,
	id: string
): MessageAction | undefined => {
	if (!actions || !actions.length) {
		return undefined;
	}

	return find(actions, ['id', id]);
};

export function insertAboveSignature(htmlContent: string, contentToInsert: string): string {
	// Parse the HTML string into a DOM document
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlContent, 'text/html');

	// Find the signature div
	const signatureDiv = Array.from(doc.querySelectorAll('div')).find((div) =>
		div.classList.contains('signature-div')
	);

	// Parse the content to insert
	const contentDoc = parser.parseFromString(contentToInsert, 'text/html');
	const contentNodes = Array.from(contentDoc.body.childNodes);

	if (signatureDiv) {
		// Insert each node before the signature div
		contentNodes.forEach((node) => {
			const clonedNode = node.cloneNode(true);
			signatureDiv.parentNode?.insertBefore(clonedNode, signatureDiv);
		});
	} else {
		// Append at the end of the body if no signature div found
		contentNodes.forEach((node) => {
			const clonedNode = node.cloneNode(true);
			doc.body.appendChild(clonedNode);
		});
	}

	return doc.body.innerHTML;
}

/**
 * Generate the html for the smart link
 */
export const generateSmartLinkHtml = ({
	publicLinkUrl,
	filename
}: {
	publicLinkUrl: string;
	filename: MailsEditorV2['savedAttachments'][0]['filename'];
}): string =>
	`<a style='background-color: #D3EBF8;
padding: 11px 16px;
color: #2B73D2;
display: inline-block;
margin-top: 5px;
max-width: 80%;
border-radius: 5px;'
 href='${publicLinkUrl}' download>${truncate(filename ?? publicLinkUrl, {
		length: 76,
		omission: '...'
 })}</a>`;

// returns if in search module or not based on path
export function useInSearchModule(): boolean {
	return useLocation().pathname.startsWith(`/${SEARCH_ROUTE}`);
}
