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
import { $isElementNode, $isLineBreakNode, $isTextNode, type LexicalNode, TextNode } from 'lexical';

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

// The characters the auto-link plugin wants around a link (its default `separatorRegex`).
const SEPARATOR_REGEX = /[.,;\s]/;

export type AutoLinkMatch = NonNullable<ReturnType<LinkMatcher>>;

/** The first auto-link in `text`, from the first matcher that matches, as in the auto-link plugin. */
const findAutoLink = (text: string): ReturnType<LinkMatcher> =>
	MATCHERS.reduce<ReturnType<LinkMatcher>>((found, matcher) => found ?? matcher(text), null);

/**
 * Whether a link can sit next to `sibling` (the node before it when `side` is
 * `before`, the one after it otherwise), as the auto-link plugin checks it.
 */
function $isLinkBoundary(sibling: LexicalNode | null, side: 'before' | 'after'): boolean {
	let node = sibling;
	if ($isElementNode(node)) {
		node = side === 'before' ? node.getLastDescendant() : node.getFirstDescendant();
	}
	if (node === null || $isLineBreakNode(node)) {
		return true;
	}
	const text = $isTextNode(node) ? node.getTextContent() : '';
	return SEPARATOR_REGEX.test(side === 'before' ? text.slice(-1) : text.slice(0, 1));
}

/**
 * Returns the matches the auto-link plugin turns into links in `nodes`, adjacent
 * simple text nodes, in their order and with their index in the joined text of the
 * nodes. As in the plugin, a link may span several nodes (e.g. a URL partly in
 * bold), and it must have a separator, or no text, on both sides: in
 * `abchttps://x.com` nothing is linked.
 */
export function $matchAutoLinks(nodes: Array<TextNode>): Array<AutoLinkMatch> {
	const text = nodes.map((node) => node.getTextContent()).join('');
	const isSeparatedAt = (index: number): boolean => {
		if (index < 0) {
			return $isLinkBoundary(nodes[0].getPreviousSibling(), 'before');
		}
		if (index >= text.length) {
			return $isLinkBoundary(nodes.at(-1)?.getNextSibling() ?? null, 'after');
		}
		return SEPARATOR_REGEX.test(text[index]);
	};
	const matchBetween = (from: number, to: number): Array<AutoLinkMatch> => {
		const match = findAutoLink(text.slice(from, to));
		if (!match) {
			return [];
		}
		const index = from + match.index;
		const end = index + match.length;
		const linked = isSeparatedAt(index - 1) && isSeparatedAt(end) ? [{ ...match, index }] : [];
		// The first matcher that matches decides, not the first link in the text: the
		// text before the match can hold one as well as the text after it.
		return [...matchBetween(from, index), ...linked, ...matchBetween(end, to)];
	};
	return matchBetween(0, text.length);
}

/**
 * Returns the auto-link match of `text` only when the whole text is that link, the
 * condition under which the auto-link plugin keeps an existing auto-link.
 */
export const matchWholeAutoLink = (text: string): ReturnType<LinkMatcher> => {
	const match = findAutoLink(text);
	return match?.text === text ? match : null;
};

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
