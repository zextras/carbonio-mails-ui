/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import {
	$getNodeByKey,
	DecoratorNode,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
	type Spread
} from 'lexical';

import { ImageComponent } from './image-component';
import { type ImageAlignment, type ImageDimension } from './image-types';

export type { ImageAlignment, ImageDimension } from './image-types';

export type SerializedImageNode = Spread<
	{
		src: string;
		cidUrl: string | undefined;
		altText: string;
		width: ImageDimension;
		height: ImageDimension;
		alignment: ImageAlignment | undefined;
	},
	SerializedLexicalNode
>;

function alignmentClassName(alignment: ImageAlignment | undefined): string | undefined {
	return alignment ? `mails-lexical-image-${alignment}` : undefined;
}

function parseDimension(value: string | number | undefined): ImageDimension | undefined {
	if (typeof value === 'number') {
		return value > 0 ? value : undefined;
	}
	if (!value) {
		return undefined;
	}
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseAlignment(domNode: HTMLImageElement): ImageAlignment | undefined {
	const { float } = domNode.style;
	if (float === 'left' || float === 'right') {
		return float;
	}
	if (
		domNode.style.display === 'block' &&
		domNode.style.marginLeft === 'auto' &&
		domNode.style.marginRight === 'auto'
	) {
		return 'center';
	}
	return undefined;
}

/**
 * Decorator node representing an inline image (an inline attachment) inside the
 * Lexical editor.
 *
 * It preserves the cid bookkeeping used by the rest of the compose pipeline:
 * the `src` holds the download-service URL used to display the image, while
 * `cidUrl` holds the original `cid:` reference. On export both `data-pnsrc` and
 * `data-mce-src` are written with the cid so that:
 *  - `replaceServiceUrlWithCidUrl` (save draft / send) can restore the cid src;
 *  - `editorUtils.retrieveCIdsFromContent` can detect the still-referenced cids.
 *
 * Width/height (set by the resizer) and alignment (set from the toolbar) are
 * serialized as inline styles on the exported `<img>` so they round-trip through
 * the saved draft and render in the recipient's email.
 */
export class ImageNode extends DecoratorNode<React.JSX.Element> {
	__src: string;

	__cidUrl: string | undefined;

	__altText: string;

	__width: ImageDimension;

	__height: ImageDimension;

	__alignment: ImageAlignment | undefined;

	static override getType(): string {
		return 'inline-image';
	}

	static override clone(node: ImageNode): ImageNode {
		return new ImageNode(
			node.__src,
			node.__cidUrl,
			node.__altText,
			node.__width,
			node.__height,
			node.__alignment,
			node.__key
		);
	}

	constructor(
		src: string,
		cidUrl?: string,
		altText?: string,
		width?: ImageDimension,
		height?: ImageDimension,
		alignment?: ImageAlignment,
		key?: NodeKey
	) {
		super(key);
		this.__src = src;
		this.__cidUrl = cidUrl;
		this.__altText = altText ?? 'Inline attachment';
		this.__width = width ?? 'inherit';
		this.__height = height ?? 'inherit';
		this.__alignment = alignment;
	}

	static override importJSON(serializedNode: SerializedImageNode): ImageNode {
		return new ImageNode(
			serializedNode.src,
			serializedNode.cidUrl,
			serializedNode.altText,
			serializedNode.width,
			serializedNode.height,
			serializedNode.alignment
		);
	}

	override exportJSON(): SerializedImageNode {
		return {
			type: ImageNode.getType(),
			version: 2,
			src: this.__src,
			cidUrl: this.__cidUrl,
			altText: this.__altText,
			width: this.__width,
			height: this.__height,
			alignment: this.__alignment
		};
	}

	static override importDOM(): DOMConversionMap | null {
		return {
			img: () => ({
				conversion: (domNode: HTMLElement): DOMConversionOutput | null => {
					if (!(domNode instanceof HTMLImageElement)) {
						return null;
					}
					const cidUrl =
						domNode.getAttribute('data-pnsrc') ??
						domNode.getAttribute('data-mce-src') ??
						(domNode.getAttribute('src')?.startsWith('cid:')
							? domNode.getAttribute('src')
							: undefined) ??
						undefined;
					const src = domNode.getAttribute('src') ?? '';
					const altText = domNode.getAttribute('alt') ?? 'Inline attachment';

					const width = parseDimension(domNode.style.width) ?? parseDimension(domNode.width);
					const height = parseDimension(domNode.style.height) ?? parseDimension(domNode.height);
					const alignment = parseAlignment(domNode);

					return {
						node: new ImageNode(src, cidUrl, altText, width, height, alignment)
					};
				},
				priority: 1
			})
		};
	}

	override exportDOM(): DOMExportOutput {
		const element = document.createElement('img');
		element.setAttribute('src', this.__src);
		element.setAttribute('alt', this.__altText);
		if (this.__cidUrl) {
			element.setAttribute('data-pnsrc', this.__cidUrl);
			element.setAttribute('data-mce-src', this.__cidUrl);
		}
		if (this.__width !== 'inherit') {
			element.style.width = `${this.__width}px`;
		}
		if (this.__height !== 'inherit') {
			element.style.height = `${this.__height}px`;
		}
		if (this.__alignment === 'left' || this.__alignment === 'right') {
			element.style.float = this.__alignment;
		} else if (this.__alignment === 'center') {
			element.style.display = 'block';
			element.style.marginLeft = 'auto';
			element.style.marginRight = 'auto';
		}
		return { element };
	}

	override createDOM(config: EditorConfig): HTMLElement {
		const span = document.createElement('span');
		const classNames = [config.theme.image, alignmentClassName(this.__alignment)].filter(Boolean);
		if (classNames.length) {
			span.className = classNames.join(' ');
		}
		return span;
	}

	override updateDOM(prevNode: ImageNode, dom: HTMLElement, config: EditorConfig): false {
		if (prevNode.__alignment !== this.__alignment) {
			const classNames = [config.theme.image, alignmentClassName(this.__alignment)].filter(Boolean);
			// eslint-disable-next-line no-param-reassign -- updating the decorator's host element is the intended Lexical pattern
			dom.className = classNames.join(' ');
		}
		return false;
	}

	getSrc(): string {
		return this.__src;
	}

	getCidUrl(): string | undefined {
		return this.__cidUrl;
	}

	getAlignment(): ImageAlignment | undefined {
		return this.__alignment;
	}

	setAlignment(alignment: ImageAlignment | undefined): void {
		const writable = this.getWritable();
		writable.__alignment = alignment;
	}

	setWidthAndHeight(width: ImageDimension, height: ImageDimension): void {
		const writable = this.getWritable();
		writable.__width = width;
		writable.__height = height;
	}

	override decorate(editor: LexicalEditor): React.JSX.Element {
		const key = this.getKey();
		return (
			<ImageComponent
				nodeKey={key}
				src={this.__src}
				altText={this.__altText}
				width={this.__width}
				height={this.__height}
				onResize={(width, height): void => {
					editor.update(() => {
						const node = $getNodeByKey(key);
						if (node instanceof ImageNode) {
							node.setWidthAndHeight(width, height);
						}
					});
				}}
			/>
		);
	}
}

export function $createImageNode(
	src: string,
	cidUrl?: string,
	altText?: string,
	width?: ImageDimension,
	height?: ImageDimension,
	alignment?: ImageAlignment
): ImageNode {
	return new ImageNode(src, cidUrl, altText, width, height, alignment);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
	return node instanceof ImageNode;
}
