/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	DecoratorNode,
	type DOMConversionMap,
	type DOMExportOutput,
	type LexicalNode,
	type SerializedLexicalNode
} from 'lexical';

import { LineType } from 'commons/utils';

/**
 * Leaf node that preserves the quoted-text separator `<hr id="zwchr">` through
 * the editor's HTML round-trip.
 *
 * The separator marks the boundary between the user's compose area and the
 * quoted original message in replies/forwards (see `generateReplyText`). The
 * compose pipeline relies on it to place the signature just above the quote
 * (`helpers/signatures.ts`) and to detect the quoted region elsewhere. Lexical
 * drops unknown `<hr>` elements (and their `id`) on import, so without a
 * dedicated node the boundary is lost after the first edit. Rendering it as a
 * decorator leaf keeps `$generateHtmlFromNodes` emitting `<hr id="zwchr">`.
 */
export class QuotedSeparatorNode extends DecoratorNode<null> {
	static override getType(): string {
		return 'quoted-separator';
	}

	static override clone(node: QuotedSeparatorNode): QuotedSeparatorNode {
		return new QuotedSeparatorNode(node.__key);
	}

	static override importDOM(): DOMConversionMap | null {
		return {
			hr: (domNode: HTMLElement) =>
				domNode.id === LineType.HTML_SEP_ID
					? { conversion: () => ({ node: new QuotedSeparatorNode() }), priority: 2 }
					: null
		};
	}

	static override importJSON(): QuotedSeparatorNode {
		return new QuotedSeparatorNode();
	}

	override exportJSON(): SerializedLexicalNode {
		return {
			...super.exportJSON(),
			type: QuotedSeparatorNode.getType(),
			version: 1
		};
	}

	// eslint-disable-next-line class-methods-use-this -- required Lexical override with no per-instance state
	override createDOM(): HTMLElement {
		const element = document.createElement('hr');
		element.id = LineType.HTML_SEP_ID;
		return element;
	}

	// eslint-disable-next-line class-methods-use-this -- required Lexical override; the separator never re-renders
	override updateDOM(): boolean {
		return false;
	}

	// eslint-disable-next-line class-methods-use-this -- required Lexical override with no per-instance state
	override exportDOM(): DOMExportOutput {
		const element = document.createElement('hr');
		element.id = LineType.HTML_SEP_ID;
		return { element };
	}

	// eslint-disable-next-line class-methods-use-this -- the separator is a block-level rule
	override isInline(): boolean {
		return false;
	}

	// eslint-disable-next-line class-methods-use-this -- leaf separator renders only its host <hr>
	override decorate(): null {
		return null;
	}
}

export function $createQuotedSeparatorNode(): QuotedSeparatorNode {
	return new QuotedSeparatorNode();
}

export function $isQuotedSeparatorNode(
	node: LexicalNode | null | undefined
): node is QuotedSeparatorNode {
	return node instanceof QuotedSeparatorNode;
}
