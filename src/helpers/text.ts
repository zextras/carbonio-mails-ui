/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Parse a text into a HTML document
 * @param text - the text to parse
 * @returns the HTML document
 */
export function parseTextToHTMLDocument(text: string): Document {
	const parser = new DOMParser();
	return parser.parseFromString(text, 'text/html');
}
