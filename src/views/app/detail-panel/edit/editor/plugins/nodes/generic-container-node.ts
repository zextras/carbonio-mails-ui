/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	$createParagraphNode,
	$isDecoratorNode,
	$isElementNode,
	ElementNode,
	type DOMConversion,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
	type ParagraphNode,
	type SerializedElementNode,
	type Spread
} from 'lexical';

import {
	applyAttributes,
	applyEditorViewAttributes,
	areAttributesEqual,
	extractPreservedAttributes,
	hasBlockChild,
	type PreservedAttributes
} from './preserved-attributes';
import { SIGNATURE_CLASS } from 'helpers/signatures';

const CONTAINER_TAGS = [
	'div',
	'center',
	'section',
	'article',
	'header',
	'footer',
	'aside',
	'main',
	'nav',
	'address'
] as const;

export type GenericContainerTag = (typeof CONTAINER_TAGS)[number];

export type SerializedGenericContainerNode = Spread<
	{ tag: GenericContainerTag; attributes: PreservedAttributes },
	SerializedElementNode
>;

const isBlock = (node: LexicalNode): boolean =>
	($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline();

/**
 * Groups every run of inline nodes (text, links, line breaks, inline images)
 * under a paragraph, so that the container only ever holds blocks and the caret
 * can always be split with Enter.
 */
function wrapInlineRuns(children: LexicalNode[]): LexicalNode[] {
	const result: LexicalNode[] = [];
	let currentRun: ParagraphNode | null = null;
	children.forEach((child) => {
		if (isBlock(child)) {
			currentRun = null;
			result.push(child);
			return;
		}
		if (currentRun === null) {
			currentRun = $createParagraphNode();
			result.push(currentRun);
		}
		currentRun.append(child);
	});
	return result;
}

/**
 * Block container that preserves the tag and the attributes (inline `style`,
 * `class`, `id`, ...) of a `<div>`, `<center>`, `<section>` and similar wrappers.
 *
 * Lexical has no importer for those elements: it drops the wrapper and keeps
 * its children, so a `display: none` block becomes visible text and any layout
 * carried by the wrapper is lost. Email HTML coming from other clients relies
 * on these wrappers heavily, so the compose pipeline has to keep them.
 *
 * `<div class="signature-div">` is left to `SignatureNode`, and `<div>`s that
 * only hold inline content are paragraph-like and are handled by
 * `StyledParagraphNode`.
 */
export class GenericContainerNode extends ElementNode {
	__tag: GenericContainerTag;

	__attributes: PreservedAttributes;

	constructor(tag: GenericContainerTag, attributes: PreservedAttributes, key?: NodeKey) {
		super(key);
		this.__tag = tag;
		this.__attributes = attributes;
	}

	static override getType(): string {
		return 'generic-container';
	}

	static override clone(node: GenericContainerNode): GenericContainerNode {
		return new GenericContainerNode(node.__tag, node.__attributes, node.__key);
	}

	static override importDOM(): DOMConversionMap | null {
		return Object.fromEntries(
			CONTAINER_TAGS.map((tag) => [
				tag,
				(domNode: HTMLElement): DOMConversion | null =>
					domNode.classList.contains(SIGNATURE_CLASS) || (tag === 'div' && !hasBlockChild(domNode))
						? null
						: {
								conversion: (element: HTMLElement): DOMConversionOutput => ({
									node: new GenericContainerNode(tag, extractPreservedAttributes(element)),
									after: wrapInlineRuns
								}),
								priority: 1
							}
			])
		);
	}

	static override importJSON(serializedNode: SerializedGenericContainerNode): GenericContainerNode {
		return new GenericContainerNode(serializedNode.tag, serializedNode.attributes).updateFromJSON(
			serializedNode
		);
	}

	override exportJSON(): SerializedGenericContainerNode {
		return {
			...super.exportJSON(),
			type: GenericContainerNode.getType(),
			tag: this.__tag,
			attributes: this.__attributes,
			version: 1
		};
	}

	override createDOM(): HTMLElement {
		const dom = document.createElement(this.__tag);
		applyEditorViewAttributes(dom, this.__attributes);
		return dom;
	}

	override updateDOM(prevNode: this): boolean {
		return (
			prevNode.__tag !== this.__tag || !areAttributesEqual(prevNode.__attributes, this.__attributes)
		);
	}

	override exportDOM(editor: LexicalEditor): DOMExportOutput {
		const { element } = super.exportDOM(editor);
		if (element instanceof HTMLElement) {
			element.removeAttribute('style');
			applyAttributes(element, this.__attributes);
		}
		return { element };
	}

	// eslint-disable-next-line class-methods-use-this -- always a block element
	override isInline(): boolean {
		return false;
	}

	// eslint-disable-next-line class-methods-use-this -- containers are not indented as a whole
	override canIndent(): boolean {
		return false;
	}

	/**
	 * Pressing Enter inside a container always happens inside one of its
	 * paragraphs (see `wrapInlineRuns`), so this is only reached for an empty
	 * container: leave it with a fresh paragraph instead of doing nothing.
	 */
	// eslint-disable-next-line class-methods-use-this -- no per-instance state
	override insertNewAfter(): LexicalNode {
		return $createParagraphNode();
	}
}

export function $createGenericContainerNode(
	tag: GenericContainerTag = 'div',
	attributes: PreservedAttributes = {}
): GenericContainerNode {
	return new GenericContainerNode(tag, attributes);
}

export function $isGenericContainerNode(
	node: LexicalNode | null | undefined
): node is GenericContainerNode {
	return node instanceof GenericContainerNode;
}
