/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect } from 'react';

import {
	$isAutoLinkNode,
	type AutoLinkNode,
	createLinkMatcherWithRegExp,
	type LinkMatcher,
	registerAutoLink
} from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $isTextNode, type LexicalNode, TextNode } from 'lexical';

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

/** The first auto-link in `text`, from the first matcher that matches, as in the auto-link plugin. */
const findAutoLink = (text: string): ReturnType<LinkMatcher> =>
	MATCHERS.reduce<ReturnType<LinkMatcher>>((found, matcher) => found ?? matcher(text), null);

/**
 * Returns the auto-link match of `text` only when the whole text is that link: the
 * first matcher that matches decides, as in the auto-link plugin, which keeps an
 * existing auto-link only under the same condition.
 */
export const matchWholeAutoLink = (text: string): ReturnType<LinkMatcher> => {
	const match = findAutoLink(text);
	return match?.text === text ? match : null;
};

// The characters the auto-link plugin wants around a link (its default `separatorRegex`).
const SEPARATOR_REGEX = /[.,;\s]/;

const $isRemovedAutoLink = (node: LexicalNode | null): node is AutoLinkNode =>
	$isAutoLinkNode(node) && node.getIsUnlinked();

/**
 * Moves into `removedLink` the start of the content right after it, when there is no
 * separator in between and the auto-link matchers would make that start part of the
 * same link. Returns whether the content after it may be glued as well.
 */
function $absorbGluedContent(removedLink: AutoLinkNode): boolean {
	const next = removedLink.getNextSibling();
	if (!(($isTextNode(next) && next.isSimpleText()) || $isRemovedAutoLink(next))) {
		return false;
	}
	const removedText = removedLink.getTextContent();
	const nextText = next.getTextContent();
	const match = findAutoLink(removedText + nextText);
	const gluedLength = match?.index === 0 ? match.length - removedText.length : 0;
	if (SEPARATOR_REGEX.test(nextText.charAt(0)) || gluedLength <= 0) {
		return false;
	}
	if ($isTextNode(next)) {
		const [glued] = gluedLength < nextText.length ? next.splitText(gluedLength) : [next];
		removedLink.append(glued);
		return gluedLength === nextText.length;
	}
	if (gluedLength < nextText.length) {
		return false;
	}
	removedLink.append(...next.getChildren());
	next.remove();
	return true;
}

/**
 * Keeps a removed auto-link plain when content is glued right after it: text typed
 * with no separator in between (e.g. a path added to a URL), or another removed link.
 *
 * The auto-link plugin wants a separator around a removed link too. When it checks
 * the removed link again (on an edit of its text, and on every HTML load, such as
 * reopening a draft) it unwraps the link and links the text again, glued content
 * included. Once that content is inside the removed link, the check passes and the
 * text stays plain.
 */
function $keepGluedTextInRemovedAutoLink(textNode: TextNode): void {
	const parent = textNode.getParent();
	const previous = textNode.getPreviousSibling();
	let removedLink: AutoLinkNode | null = null;
	if ($isRemovedAutoLink(parent)) {
		removedLink = parent;
	} else if ($isRemovedAutoLink(previous)) {
		removedLink = previous;
	}
	if (removedLink) {
		while ($absorbGluedContent(removedLink)) {
			// Each pass moves one node: the content after it may be glued too.
		}
	}
}

export const AutoLinkPlugin = (): null => {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			mergeRegister(
				// Transforms run in the order they are registered: the glued text has to be
				// moved before the auto-link transform checks the removed link.
				editor.registerNodeTransform(TextNode, $keepGluedTextInRemovedAutoLink),
				registerAutoLink(editor, { matchers: MATCHERS, changeHandlers: [], excludeParents: [] })
			),
		[editor]
	);

	return null;
};
