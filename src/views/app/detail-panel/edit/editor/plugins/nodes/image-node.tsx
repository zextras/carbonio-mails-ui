/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import {
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

export type SerializedImageNode = Spread<
	{
		src: string;
		cidUrl: string | undefined;
		altText: string;
	},
	SerializedLexicalNode
>;

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
 */
export class ImageNode extends DecoratorNode<React.JSX.Element> {
	__src: string;

	__cidUrl: string | undefined;

	__altText: string;

	static override getType(): string {
		return 'inline-image';
	}

	static override clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__src, node.__cidUrl, node.__altText, node.__key);
	}

	constructor(src: string, cidUrl?: string, altText?: string, key?: NodeKey) {
		super(key);
		this.__src = src;
		this.__cidUrl = cidUrl;
		this.__altText = altText ?? 'Inline attachment';
	}

	static override importJSON(serializedNode: SerializedImageNode): ImageNode {
		return new ImageNode(serializedNode.src, serializedNode.cidUrl, serializedNode.altText);
	}

	override exportJSON(): SerializedImageNode {
		return {
			type: ImageNode.getType(),
			version: 1,
			src: this.__src,
			cidUrl: this.__cidUrl,
			altText: this.__altText
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
					return { node: new ImageNode(src, cidUrl, altText) };
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
		return { element };
	}

	// eslint-disable-next-line class-methods-use-this
	override createDOM(config: EditorConfig): HTMLElement {
		const span = document.createElement('span');
		const className = config.theme.image;
		if (className) {
			span.className = className;
		}
		return span;
	}

	// eslint-disable-next-line class-methods-use-this
	override updateDOM(): false {
		return false;
	}

	getSrc(): string {
		return this.__src;
	}

	getCidUrl(): string | undefined {
		return this.__cidUrl;
	}

	override decorate(_editor: LexicalEditor): React.JSX.Element {
		return (
			<img src={this.__src} alt={this.__altText} style={{ maxWidth: '100%', height: 'auto' }} />
		);
	}
}

export function $createImageNode(src: string, cidUrl?: string, altText?: string): ImageNode {
	return new ImageNode(src, cidUrl, altText);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
	return node instanceof ImageNode;
}
