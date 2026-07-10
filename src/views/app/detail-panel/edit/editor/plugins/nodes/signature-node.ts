/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	ElementNode,
	type DOMConversionMap,
	type DOMExportOutput,
	type LexicalNode,
	type SerializedElementNode
} from 'lexical';

import { SIGNATURE_CLASS } from 'helpers/signatures';

/**
 * Element node that preserves the signature wrapper `<div class="signature-div">`
 * through the editor's HTML round-trip.
 *
 * Without a dedicated node, Lexical flattens the wrapping `<div>` into plain
 * paragraphs and drops the `signature-div` class, so the signature becomes
 * indistinguishable from the body. The signature-replacement logic in
 * `helpers/signatures.ts` relies on that class to locate and remove the previous
 * signature; losing it makes a signature change append a new signature instead
 * of replacing the old one. Keeping the wrapper as a first-class node lets
 * `$generateHtmlFromNodes` re-emit `<div class="signature-div">…</div>` intact.
 */
export class SignatureNode extends ElementNode {
	static override getType(): string {
		return 'signature';
	}

	static override clone(node: SignatureNode): SignatureNode {
		return new SignatureNode(node.__key);
	}

	static override importDOM(): DOMConversionMap | null {
		return {
			div: (domNode: HTMLElement) =>
				domNode.classList.contains(SIGNATURE_CLASS)
					? { conversion: () => ({ node: new SignatureNode() }), priority: 2 }
					: null
		};
	}

	static override importJSON(): SignatureNode {
		return new SignatureNode();
	}

	override exportJSON(): SerializedElementNode {
		return {
			...super.exportJSON(),
			type: SignatureNode.getType(),
			version: 1
		};
	}

	// eslint-disable-next-line class-methods-use-this -- required Lexical override with no per-instance state
	override createDOM(): HTMLElement {
		const dom = document.createElement('div');
		dom.classList.add(SIGNATURE_CLASS);
		return dom;
	}

	// eslint-disable-next-line class-methods-use-this -- required Lexical override; the wrapper never needs re-rendering
	override updateDOM(): boolean {
		return false;
	}

	// eslint-disable-next-line class-methods-use-this -- required Lexical override with no per-instance state
	override exportDOM(): DOMExportOutput {
		const element = document.createElement('div');
		element.classList.add(SIGNATURE_CLASS);
		return { element };
	}

	// eslint-disable-next-line class-methods-use-this -- signature wrapper is always a block element
	override isInline(): boolean {
		return false;
	}
}

export function $createSignatureNode(): SignatureNode {
	return new SignatureNode();
}

export function $isSignatureNode(node: LexicalNode | null | undefined): node is SignatureNode {
	return node instanceof SignatureNode;
}
