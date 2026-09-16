/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const BODY_TAG_REGEX = /<body[\s>]/i;

/**
 * Wraps an HTML fragment into a complete HTML document.
 *
 * The outgoing text/html mime part must be a full document with a <body> element:
 * the MTA domain disclaimer (altermime) anchors the HTML disclaimer on the closing
 * </body> tag and silently skips the message when it is missing. Other clients
 * (Outlook, Thunderbird) always send a full document, so the web UI must do the same.
 *
 * Content that already contains a <body> element is returned unchanged.
 *
 * @param content - The HTML fragment (body innerHTML) to wrap
 * @returns A complete HTML document string
 */
export const wrapInHtmlDocument = (content = ''): string => {
	if (BODY_TAG_REGEX.test(content)) {
		return content;
	}
	return `<html><body>${content}</body></html>`;
};
