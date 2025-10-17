/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import juice from 'juice';

/**
 * Inlines CSS styles from <style> tags in the HTML head into the corresponding HTML elements.
 * This ensures better email client compatibility and preserves formatting when forwarding/replying to emails.
 *
 * @param html - The complete HTML string (including <html>, <head>, and <body> tags)
 * @returns HTML string with inlined styles
 */
export const inlineStyles = (html: string): string => {
	if (!html || html.trim() === '') {
		return html;
	}

	try {
		return juice(html, {
			preserveImportant: true,
			removeStyleTags: true,
			preserveMediaQueries: false,
			preserveFontFaces: false,
			applyWidthAttributes: true,
			applyHeightAttributes: true
		});
	} catch {
		return html;
	}
};

/**
 * Extracts the body content from HTML after inlining styles.
 * This is useful when you need just the body content but with styles preserved.
 *
 * @param html - The complete HTML string
 * @returns The body innerHTML with inlined styles
 */
export const extractBodyWithInlinedStyles = (html: string): string => {
	if (!html || html.trim() === '') {
		return html;
	}

	try {
		const inlinedHtml = inlineStyles(html);

		const parser = new DOMParser();
		const doc = parser.parseFromString(inlinedHtml, 'text/html');

		return doc.body ? doc.body.innerHTML : '';
	} catch {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		return doc.body ? doc.body.innerHTML : '';
	}
};
