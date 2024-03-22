/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: implement this function
// export const insertIntoText = (text: string, textToInsert: string, position: number): string => {};
//
export function parseTextToHTMLDocument(text: string): Document {
	const parser = new DOMParser();
	return parser.parseFromString(text, 'text/html');
}
