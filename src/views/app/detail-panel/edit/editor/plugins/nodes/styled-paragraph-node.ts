/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	$isElementNode,
	ParagraphNode,
	type DOMConversion,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
	type SerializedParagraphNode,
	type Spread
} from 'lexical';

import {
	applyAttributes,
	applyEditorViewAttributes,
	areAttributesEqual,
	extractParagraphAttributes,
	hasBlockChild,
	type PreservedAttributes
} from './preserved-attributes';

export type StyledParagraphTag = 'p' | 'div';

export type SerializedStyledParagraphNode = Spread<
	{ tag: StyledParagraphTag; attributes: PreservedAttributes },
	SerializedParagraphNode
>;

/**
 * Paragraph that remembers the tag (`<p>` or `<div>`) and the attributes
 * (inline `style`, `class`, `id`, ...) of the element it was imported from.
 *
 * Lexical's `ParagraphNode` only reads alignment, indentation and direction from
 * a `<p>`, and has no importer for `<div>` at all (its content ends up in a
 * plain `<p>`). For replies, forwards and drafts authored elsewhere that means
 * margins, fonts or even `display: none` are silently lost. This node keeps them
 * so `$generateHtmlFromNodes` writes the element back the way it came.
 */
export class StyledParagraphNode extends ParagraphNode {
	__tag: StyledParagraphTag;

	__attributes: PreservedAttributes;

	constructor(tag: StyledParagraphTag, attributes: PreservedAttributes, key?: NodeKey) {
		super(key);
		this.__tag = tag;
		this.__attributes = attributes;
	}

	static override getType(): string {
		return 'styled-paragraph';
	}

	static override clone(node: StyledParagraphNode): StyledParagraphNode {
		return new StyledParagraphNode(node.__tag, node.__attributes, node.__key);
	}

	static override importDOM(): DOMConversionMap | null {
		const paragraphConversions = ParagraphNode.importDOM();
		const wrap =
			(tag: StyledParagraphTag, isEligible: (element: HTMLElement) => boolean) =>
			(domNode: HTMLElement): DOMConversion | null => {
				if (!isEligible(domNode)) {
					return null;
				}
				const paragraphConversion = paragraphConversions?.p?.(domNode);
				return {
					conversion: (element): DOMConversionOutput => {
						const base = paragraphConversion?.conversion(element);
						const attributes = extractParagraphAttributes(element);
						const baseNode = base?.node;
						if (
							Object.keys(attributes).length === 0 &&
							tag === 'p' &&
							baseNode &&
							!Array.isArray(baseNode)
						) {
							return base;
						}
						const node = new StyledParagraphNode(tag, attributes);
						if (baseNode && !Array.isArray(baseNode) && $isElementNode(baseNode)) {
							node.setFormat(baseNode.getFormatType());
							node.setIndent(baseNode.getIndent());
							node.setDirection(baseNode.getDirection());
						}
						return { node };
					},
					priority: 1
				};
			};
		return {
			p: wrap('p', () => true),
			// Only `<div>`s holding inline content only are paragraph-like; those
			// holding other blocks are handled by `GenericContainerNode`.
			div: wrap('div', (element) => !hasBlockChild(element))
		};
	}

	static override importJSON(serializedNode: SerializedStyledParagraphNode): StyledParagraphNode {
		return new StyledParagraphNode(serializedNode.tag, serializedNode.attributes).updateFromJSON(
			serializedNode
		);
	}

	override exportJSON(): SerializedStyledParagraphNode {
		return {
			...super.exportJSON(),
			type: StyledParagraphNode.getType(),
			tag: this.__tag,
			attributes: this.__attributes,
			version: 1
		};
	}

	override createDOM(config: EditorConfig): HTMLElement {
		const dom = document.createElement(this.__tag);
		const paragraphClass = config.theme.paragraph;
		if (paragraphClass) {
			dom.classList.add(...paragraphClass.split(' '));
		}
		applyEditorViewAttributes(dom, this.__attributes);
		return dom;
	}

	override updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
		return (
			prevNode.__tag !== this.__tag ||
			!areAttributesEqual(prevNode.__attributes, this.__attributes) ||
			super.updateDOM(prevNode as unknown as ParagraphNode, dom, config)
		);
	}

	override exportDOM(editor: LexicalEditor): DOMExportOutput {
		const output = super.exportDOM(editor);
		const { element } = output;
		if (element instanceof HTMLElement) {
			// Alignment and indentation come from the node's own (possibly edited)
			// state, everything else from the element the node was imported from.
			const { textAlign, paddingInlineStart } = element.style;
			element.removeAttribute('style');
			applyAttributes(element, this.__attributes);
			if (textAlign) {
				element.style.textAlign = textAlign;
			}
			if (paddingInlineStart) {
				element.style.paddingInlineStart = paddingInlineStart;
			}
		}
		return output;
	}
}

export function $createStyledParagraphNode(
	tag: StyledParagraphTag = 'p',
	attributes: PreservedAttributes = {}
): StyledParagraphNode {
	return new StyledParagraphNode(tag, attributes);
}

export function $isStyledParagraphNode(
	node: LexicalNode | null | undefined
): node is StyledParagraphNode {
	return node instanceof StyledParagraphNode;
}
