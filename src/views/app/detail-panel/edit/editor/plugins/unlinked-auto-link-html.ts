/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { $createAutoLinkNode, $isAutoLinkNode, AutoLinkNode } from '@lexical/link';
import {
	type DOMConversionMap,
	type DOMExportOutput,
	type DOMExportOutputMap,
	type LexicalEditor,
	type LexicalNode
} from 'lexical';

/**
 * An auto-link the user removed the link from (an `AutoLinkNode` flagged as
 * unlinked) is exported by Lexical as a bare `<span>`: once that HTML is loaded
 * again (reopening a draft, switching signature), the auto-link plugin would turn
 * the URL-like text into a link again. The span is marked with this class so the
 * import can rebuild the unlinked node.
 *
 * A class is used because the mailbox HTML sanitizer drops unknown attributes
 * (e.g. `data-*`) from a saved draft, while it keeps classes (as it does for
 * `signature-div`).
 */
export const UNLINKED_AUTO_LINK_CLASS = 'mails-unlinked-auto-link';

/**
 * Adds the unlinked auto-link converter on top of `base`. Both target `<span>`, so
 * the marked spans are claimed here and every other span goes to the `base` span
 * converter. The span children are converted as usual (keeping their formatting)
 * and appended to the rebuilt node.
 *
 * The URL is not stored in the HTML: it is taken from the text, as the auto-link
 * plugin derives it from the text again when the link is restored.
 */
export const withUnlinkedAutoLinkImport = (base: DOMConversionMap): DOMConversionMap => ({
	...base,
	span: (domNode: HTMLElement) =>
		domNode.classList.contains(UNLINKED_AUTO_LINK_CLASS)
			? {
					conversion: (domElement: HTMLElement) => ({
						node: $createAutoLinkNode(domElement.textContent ?? '', { isUnlinked: true })
					}),
					priority: 2
				}
			: (base.span?.(domNode) ?? null)
});

export const UNLINKED_AUTO_LINK_HTML_EXPORT: DOMExportOutputMap = new Map([
	[
		AutoLinkNode,
		(editor: LexicalEditor, target: LexicalNode): DOMExportOutput => {
			const output = target.exportDOM(editor);
			if (
				$isAutoLinkNode(target) &&
				target.getIsUnlinked() &&
				output.element instanceof HTMLElement
			) {
				output.element.classList.add(UNLINKED_AUTO_LINK_CLASS);
			}
			return output;
		}
	]
]);
