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
		// juice will inline all styles from <style> tags and style attributes
		return juice(html, {
			// Preserve important declarations
			preserveImportant: true,
			// Remove style tags after inlining
			removeStyleTags: true,
			// Preserve media queries for responsive emails
			preserveMediaQueries: false,
			// Preserve font faces
			preserveFontFaces: false,
			// Apply width/height attributes
			applyWidthAttributes: true,
			applyHeightAttributes: true
		});
	} catch (error) {
		// If inlining fails for any reason, return the original HTML
		console.warn('Failed to inline CSS styles:', error);
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
		// First inline all styles
		const inlinedHtml = inlineStyles(html);

		// Then extract just the body content
		const parser = new DOMParser();
		const doc = parser.parseFromString(inlinedHtml, 'text/html');

		return doc.body ? doc.body.innerHTML : '';
	} catch (error) {
		console.warn('Failed to extract body with inlined styles:', error);
		// Fallback to simple body extraction
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		return doc.body ? doc.body.innerHTML : '';
	}
};
