/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, truncate } from 'lodash';
import { useLocation } from 'react-router-dom';

import type { MailsEditorV2, MessageAction } from 'types/index.d';

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

/**
 * Add smart links to the text of the editor
 * both in plain text and rich text
 */
export function addSmartLinksToText({
	publicLinkUrl,
	text,
	filename
}: {
	publicLinkUrl: string;
	text: MailsEditorV2['text'];
	filename: string;
}): MailsEditorV2['text'] {
	return {
		plainText: text.plainText.concat(publicLinkUrl),
		richText: text.richText.concat(
			` ${generateSmartLinkHtml({
				publicLinkUrl,
				filename
			})}`
		)
	};
}

// returns if in search module or not based on path
export function useInSearchModule(): boolean {
	return useLocation().pathname.startsWith('/search');
}
