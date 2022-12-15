/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

const _SPECIAL_CHARS_REGEX = /[&/\\#,+()$~%.'":*?!<>{}@^_`=]/g;
const _WHITESPACE_REGEX = /[ ]/g;
const _WHITESPACE_REGEX_2 = / /;

function calcCapitals(label) {
	const noSpecString = label.replace(_SPECIAL_CHARS_REGEX, '');
	if (noSpecString.replace(_WHITESPACE_REGEX, '').length !== 0) {
		// eslint-disable-next-line no-param-reassign
		label = noSpecString;
	} else {
		return null;
	}

	if (label.length <= 2) {
		return label;
	}
	if (_WHITESPACE_REGEX_2.test(label)) {
		let words = label.split(' ');
		words = words.filter((word) => word !== '');

		if (words.length < 2) {
			return words[0][0] + words[0][words[0].length - 1];
		}

		return words[0][0] + words[words.length - 1][0];
	}
	return label[0] + label[label.length - 1];
}

export const useGetAvatarLabel = (label) =>
	useMemo(() => calcCapitals(label.toUpperCase()), [label]);

export const getAvatarLabel = (label) => calcCapitals(label.toUpperCase());
