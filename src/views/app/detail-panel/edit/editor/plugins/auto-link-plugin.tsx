/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { type LinkMatcher } from '@lexical/link';
import {
	AutoLinkPlugin as LexicalAutoLinkPlugin,
	createLinkMatcherWithRegExp
} from '@lexical/react/LexicalAutoLinkPlugin';

const URL_REGEX =
	// eslint-disable-next-line max-len
	/((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(?<![-.+():%])/;

const EMAIL_REGEX = /[^<>()[\]\\,;:\s@"]{1,64}@(?:[a-zA-Z\d-]{1,63}\.)+[a-zA-Z]{2,24}/;

// Auto-links open in a new window, the same default the "Insert/Edit Link" modal uses.
const NEW_WINDOW_ATTRIBUTES = { target: '_blank', rel: 'noopener noreferrer' };

const createNewWindowLinkMatcher = (
	regExp: RegExp,
	urlTransformer: (text: string) => string
): LinkMatcher => {
	const matcher = createLinkMatcherWithRegExp(regExp, urlTransformer);
	return (text) => {
		const match = matcher(text);
		return match && { ...match, attributes: NEW_WINDOW_ATTRIBUTES };
	};
};

const MATCHERS = [
	createNewWindowLinkMatcher(URL_REGEX, (text) =>
		text.startsWith('http') ? text : `https://${text}`
	),
	createNewWindowLinkMatcher(EMAIL_REGEX, (text) => `mailto:${text}`)
];

/**
 * Matches `text` against the auto-link matchers only when the whole text is one link,
 * the same condition the auto-link plugin requires to keep an existing auto-link.
 */
export const matchWholeAutoLink = (text: string): ReturnType<LinkMatcher> =>
	MATCHERS.map((matcher) => matcher(text)).find(
		(match) => match?.index === 0 && match.length === text.length
	) ?? null;

export const AutoLinkPlugin = (): React.JSX.Element => (
	<LexicalAutoLinkPlugin matchers={MATCHERS} />
);
