/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Image } from '@tiptap/extension-image';

/**
 * Builds an attribute definition that simply mirrors a DOM attribute on parse
 * and serialization (and is omitted from the output when empty).
 */
const passthroughAttribute = (
	attributeName: string
): {
	default: null;
	parseHTML: (element: HTMLElement) => string | null;
	renderHTML: (attributes: Record<string, unknown>) => Record<string, string>;
} => ({
	default: null,
	parseHTML: (element: HTMLElement): string | null => element.getAttribute(attributeName),
	renderHTML: (attributes: Record<string, unknown>): Record<string, string> => {
		const value = attributes[attributeName];
		return value ? { [attributeName]: String(value) } : {};
	}
});

/**
 * Image extension tailored for mail compose.
 *
 * It extends the base `Image` node so that:
 *  - images are inline (mail bodies place images within text flow);
 *  - `cid:` sources are accepted as-is (no sanitisation);
 *  - the attributes that drive the CID <-> service-url roundtrip are preserved
 *    (`pnsrc`, `data-src`, `data-pnsrc`, `data-cid`) together with the inline
 *    presentation attributes (`width`, `height`, `style`).
 *
 * TinyMCE-specific `data-mce-*` attributes are intentionally NOT preserved.
 */
export const InlineImage = Image.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			width: passthroughAttribute('width'),
			height: passthroughAttribute('height'),
			style: passthroughAttribute('style'),
			pnsrc: passthroughAttribute('pnsrc'),
			'data-src': passthroughAttribute('data-src'),
			'data-pnsrc': passthroughAttribute('data-pnsrc'),
			'data-cid': passthroughAttribute('data-cid')
		};
	}
});
