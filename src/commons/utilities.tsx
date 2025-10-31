/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { Theme } from '@zextras/carbonio-design-system';

export const calcColor = (label: string, theme: Theme): string => {
	let sum = 0;
	for (let i = 0; i < label.length; i += 1) {
		sum += label.charCodeAt(i);
	}
	return theme.avatarColors[`avatar_${(sum % 50) + 1}`];
};

export const FOLDER_ACTIONS = {
	MOVE: 'move',
	EMPTY_TRASH: 'emptyTrash',
	REMOVE_FROM_LIST: 'removeFromList',
	SHARES_INFO: 'sharesInfo',
	EDIT: 'edit',
	NEW: 'new',
	DELETE: 'delete',
	SHARE: 'share',
	SHARE_URL: 'share_url',
	TRASH: 'trash'
} as const;

export const CONVACTIONS = {
	MOVE: 'move',
	FLAG: 'flag',
	UNFLAG: '!flag',
	MARK_READ: 'read',
	MARK_UNREAD: '!read',
	TAG: 'tag',
	UNTAG: '!tag',
	TRASH: 'trash',
	DELETE: 'delete',
	MARK_SPAM: 'spam',
	MARK_NOT_SPAM: '!spam'
} as const;

export const convertToDecimal = (source: string): string => {
	let result = '';
	for (let i = 0; i < source.length; i += 1) {
		const charCode = source.charCodeAt(i);
		// Encode non-ascii or double quotes
		if (charCode > 127 || charCode === 34) {
			let temp = charCode.toString(10);
			while (temp.length < 4) {
				temp = `0${temp}`;
			}
			result += `&#${temp};`;
		} else {
			result += source.charAt(i);
		}
	}
	return result;
};

const P_TAG = /<p[^>]*>/g;
const BR_TAG = /<br[^>]*>/g;
const DIV_TAG = /<div[^>]*>/g;
const SCRIPT_TAG = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_TAG = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;

export const convertHtmlToPlainText = (html: string): string => {
	if (!html) {
		return '';
	}

	let result = html
		// Remove script tags
		.replace(SCRIPT_TAG, '')
		// Remove style tags
		.replace(STYLE_TAG, '')
		// Add a couple of newline before every p tag
		.replace(P_TAG, '\n\n<p>')
		// Convert br tags to new lines
		.replace(BR_TAG, '\n')
		// Add a newline before every p tag
		.replace(DIV_TAG, '\n<div>');
	const doc = new DOMParser().parseFromString(result, 'text/html');
	result = doc.body.textContent ?? '';

	return result;
};
