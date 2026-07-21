/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import {
	AutoLinkPlugin as LexicalAutoLinkPlugin,
	createLinkMatcherWithRegExp
} from '@lexical/react/LexicalAutoLinkPlugin';

const URL_REGEX =
	// eslint-disable-next-line max-len
	/((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;

const EMAIL_REGEX =
	// eslint-disable-next-line max-len
	/(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const MATCHERS = [
	createLinkMatcherWithRegExp(URL_REGEX, (text) =>
		text.startsWith('http') ? text : `https://${text}`
	),
	createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => `mailto:${text}`)
];

export const AutoLinkPlugin = (): React.JSX.Element => (
	<LexicalAutoLinkPlugin matchers={MATCHERS} />
);
