/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Node, mergeAttributes } from '@tiptap/core';

/**
 * CSS class used as the marker for signature blocks. It must be preserved
 * through any parse -> serialize roundtrip so that signature-aware logic
 * (`getMailBodyWithSignature`, `insertAboveSignature`, ...) keeps working.
 */
export const SIGNATURE_CLASS = 'signature-div';

/**
 * Custom block node that represents a `<div class="signature-div">` wrapper.
 *
 * Without a dedicated node, TipTap's schema would drop the wrapping `<div>`
 * (and therefore the `signature-div` class) during parsing. This node keeps the
 * wrapper - and crucially the class - intact while letting its inner content be
 * regular block content.
 */
export const SignatureBlock = Node.create({
	name: 'signatureBlock',
	group: 'block',
	content: 'block+',
	defining: true,
	parseHTML() {
		return [{ tag: `div.${SIGNATURE_CLASS}` }];
	},
	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes(HTMLAttributes, { class: SIGNATURE_CLASS }), 0];
	}
});
