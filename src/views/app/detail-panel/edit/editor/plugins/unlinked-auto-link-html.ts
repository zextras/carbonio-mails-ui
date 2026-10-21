/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { $createAutoLinkNode, AutoLinkNode } from '@lexical/link';
import {
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type DOMExportOutputMap,
	type LexicalEditor,
	type LexicalNode
} from 'lexical';

/**
 * An `AutoLinkNode` the user removed the link from (flagged as "unlinked") is
 * exported by Lexical as a bare `<span>`: reading the HTML back, the plain URL
 * text would be turned into a link again by the auto-link plugin. The span is
 * marked with this class so the import can rebuild the unlinked node.
 *
 * A class is used on purpose: the mailbox HTML sanitizer removes unknown
 * attributes (e.g. `data-*`) from the saved draft, while classes are kept (the
 * same way `signature-div` survives for signatures).
 */
export const UNLINKED_AUTO_LINK_CLASS = 'mails-unlinked-auto-link';

/**
 * Adds the unlinked auto-link converter on top of `base`. Both target `<span>`,
 * so the marked spans are claimed here and every other span is delegated to the
 * `base` span converter instead of being replaced by this one.
 *
 * The node URL is not stored in the HTML: it is derived from the text, which is
 * what the auto-link plugin does (it normalizes the URL of an auto-link node
 * from its text content).
 */
export const withUnlinkedAutoLinkImport = (base: DOMConversionMap): DOMConversionMap => ({
	...base,
	span: (domNode) =>
		domNode instanceof HTMLElement && domNode.classList.contains(UNLINKED_AUTO_LINK_CLASS)
			? {
					conversion: (domElement): DOMConversionOutput => ({
						node: $createAutoLinkNode(domElement.textContent ?? '', { isUnlinked: true })
					}),
					priority: 4
				}
			: (base.span?.(domNode) ?? null)
});

export const UNLINKED_AUTO_LINK_HTML_EXPORT: DOMExportOutputMap = new Map([
	[
		AutoLinkNode,
		(editor: LexicalEditor, target: LexicalNode): DOMExportOutput => {
			const output = target.exportDOM(editor);
			if (
				target instanceof AutoLinkNode &&
				target.getIsUnlinked() &&
				output.element instanceof HTMLElement
			) {
				output.element.classList.add(UNLINKED_AUTO_LINK_CLASS);
			}
			return output;
		}
	]
]);
