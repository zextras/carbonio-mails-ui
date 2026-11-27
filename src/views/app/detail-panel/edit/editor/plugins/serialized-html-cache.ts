/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { $generateDOMFromRoot } from '@lexical/html';
import { $dfs } from '@lexical/utils';
import {
	$getRoot,
	$isElementNode,
	type EditorState,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey
} from 'lexical';

import { editorUtils } from '../parts/editor-utils';
import { TINYMCE_BASE_CONTENT_STYLES } from 'constants/tinymce-content-styles';
import {
	applyUserPreferenceStyles,
	type UserPreferenceStyle
} from 'helpers/user-preference-styles';

/**
 * Marks the end of a chunk while its styles are inlined. The base styles contain
 * `p:last-child`, which a chunk processed on its own would always match for its
 * last paragraph: with an element after it the chunk is styled exactly as it is
 * inside the whole document. Only the last chunk of the document goes without.
 */
const CHUNK_END_TAG = 'zx-chunk-end';
const CHUNK_END_PATTERN = new RegExp(`<${CHUNK_END_TAG}[^>]*></${CHUNK_END_TAG}>`);

type CacheEntry = {
	isLast: boolean;
	/** Identity of every node of the subtree, in document order. */
	nodes: ReadonlyArray<LexicalNode>;
	/** The processed (styles inlined) HTML of the top-level node. */
	html: string;
	cids: ReadonlyArray<string>;
};

export type SerializedContent = {
	richText: string;
	plainText: string;
	usedCids: Array<string>;
	/** How many top-level nodes had to be exported again (diagnostics and tests). */
	reexportedNodes: number;
};

export type SerializedHtmlCache = {
	serialize: (
		editor: LexicalEditor,
		editorState: EditorState,
		style: UserPreferenceStyle
	) => SerializedContent;
};

/**
 * The nodes of the subtree of `node`, in document order. Lexical clones a node
 * when it is written but only marks its ancestors as dirty, so an edit deep
 * inside a node leaves the node itself untouched: whether a top-level node
 * changed can only be told by looking at all the nodes below it.
 */
function $collectSubtree(node: LexicalNode): Array<LexicalNode> {
	const last = $isElementNode(node) ? (node.getLastDescendant() ?? node) : node;
	return $dfs(node, last).map(({ node: descendant }) => descendant);
}

function sameNodes(a: ReadonlyArray<LexicalNode>, b: ReadonlyArray<LexicalNode>): boolean {
	return a.length === b.length && a.every((node, index) => node === b[index]);
}

function processChunk(
	exportedHtml: string,
	isLast: boolean,
	style: UserPreferenceStyle
): Pick<CacheEntry, 'html' | 'cids'> {
	const content = isLast ? exportedHtml : `${exportedHtml}<${CHUNK_END_TAG}></${CHUNK_END_TAG}>`;
	const html = applyUserPreferenceStyles(content, style, TINYMCE_BASE_CONTENT_STYLES).replace(
		CHUNK_END_PATTERN,
		''
	);
	return { html, cids: editorUtils.retrieveCIdsFromContent({ htmlContent: html }).usedCids };
}

/**
 * Serializes the editor content to the HTML that is kept in the store, exporting
 * again only the top-level nodes that changed since the previous call.
 *
 * Exporting the whole document, inlining its styles and parsing it for the cids
 * costs time proportional to the size of the document on every keystroke, which
 * is what makes replying to a long thread slow. The output is the same the whole
 * document would produce.
 *
 * A top-level node is reused when its fingerprint is unchanged: the identities of
 * all the nodes of its subtree, and whether it is the last one of the document.
 * Every write clones the written node, so the fingerprint changes with any edit
 * (including an undo, which brings back older nodes) without depending on update
 * listeners or tags. Lexical keeps the sibling links on the nodes, so adding or
 * removing a node at the end already clones its neighbour; the flag only avoids
 * relying on that implementation detail.
 *
 * Each top-level node is processed by its own, so a document made of a great
 * number of small top-level nodes pays a fixed cost per node the first time it is
 * serialized (and after the whole content is replaced).
 */
export const createSerializedHtmlCache = (): SerializedHtmlCache => {
	const entries = new Map<NodeKey, CacheEntry>();
	let stylesKey: string | undefined;

	const serialize: SerializedHtmlCache['serialize'] = (editor, editorState, style) => {
		// The style preferences change the processed HTML of every node.
		const currentStylesKey = JSON.stringify([style.font, style.fontSize, style.color]);
		if (currentStylesKey !== stylesKey) {
			entries.clear();
			stylesKey = currentStylesKey;
		}

		return editorState.read(
			() => {
				const root = $getRoot();
				const children = root.getChildren();
				const liveKeys = new Set<NodeKey>();
				let reexportedNodes = 0;

				const chunks = children.map((child, index) => {
					const key = child.getKey();
					liveKeys.add(key);
					const isLast = index === children.length - 1;
					const nodes = $collectSubtree(child);
					const cached = entries.get(key);
					if (cached?.isLast === isLast && sameNodes(cached.nodes, nodes)) {
						return cached;
					}

					reexportedNodes += 1;
					const exportedHtml = $generateDOMFromRoot(document.createElement('div'), child).innerHTML;
					const entry: CacheEntry = { isLast, nodes, ...processChunk(exportedHtml, isLast, style) };
					entries.set(key, entry);
					return entry;
				});

				// Do not hold on to the nodes that are no longer in the document.
				entries.forEach((_, key) => {
					if (!liveKeys.has(key)) {
						entries.delete(key);
					}
				});

				return {
					richText: chunks.map(({ html }) => html).join(''),
					plainText: root.getTextContent(),
					usedCids: chunks.flatMap(({ cids }) => cids),
					reexportedNodes
				};
			},
			{ editor }
		);
	};

	return { serialize };
};
