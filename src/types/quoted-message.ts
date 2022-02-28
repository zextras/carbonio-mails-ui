/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// eslint-disable-next-line no-shadow
export enum LineType {
	ORIG_UNKNOWN = 'UNKNOWN',
	ORIG_QUOTED = 'QUOTED',
	ORIG_SEP_STRONG = 'SEP_STRONG',
	ORIG_WROTE_STRONG = 'WROTE_STRONG',
	ORIG_WROTE_WEAK = 'WROTE_WEAK',
	ORIG_HEADER = 'HEADER',
	ORIG_LINE = 'LINE',
	HTML_SEP_ID = 'zwchr',
	NOTES_SEPARATOR = '*~*~*~*~*~*~*~*~*~*'
}
