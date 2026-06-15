/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { extractBodyWithInlinedStyles } from './inline-styles';

export type UserPreferenceStyle = {
	font: string | undefined;
	fontSize: string | undefined;
	color: string | undefined;
};

/**
 * Default font-family used as a fallback when neither the user preference nor
 * the author specified a font, so content renders in a consistent font instead
 * of the client default.
 */
export const DEFAULT_FONT_FAMILY = 'arial, helvetica, sans-serif';

/**
 * Generates CSS styles that apply user preferences to email content while excluding signature elements
 * and special formatting elements.
 *
 * The preference is applied to top-level body elements only and inherited by their
 * descendants, so nested content that should keep its own value (headings, sub/sup,
 * code blocks) is not overridden.
 *
 * A font-family is always emitted - the preference, or {@link DEFAULT_FONT_FAMILY}
 * as a fallback when the author didn't provide one.
 *
 * Note: Elements with explicit inline styles (e.g., style="color: red") will have those styles
 * inlined with higher specificity after CSS processing, so they will take precedence over
 * user preferences. The juice library respects CSS specificity when inlining.
 *
 * @param style - User preference styles (font, fontSize, color)
 * @returns CSS string with user preference styles
 */
export const generateUserPreferenceStyles = (style: UserPreferenceStyle): string => {
	// A font-family is always applied: the user's preference, or a default
	// fallback when the author didn't provide one. This keeps content in a
	// consistent font instead of the client default.
	const fontFamily = style?.font || DEFAULT_FONT_FAMILY;

	// Build CSS that applies user preferences to top-level body elements except signature, headings, links, and special elements
	// Excluded elements maintain their original/intended styling:
	// - .signature-div: signature content and children
	// - h1-h6: heading hierarchy
	// - a[href]: links with proper colors
	// - button: call-to-action buttons
	// - code, pre: code blocks with monospace fonts
	// - mark: highlighted text with specific styling
	// - blockquote: quoted content with distinct styling
	// - caption: table captions with bold/larger text
	// - font, [color]: author color/size set via legacy <font> or a color
	//   attribute must win over the compose preference (CO-3793)
	const excludedSelectors = [
		'.signature-div',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'a[href]',
		'button',
		'code',
		'pre',
		'mark',
		'blockquote',
		'caption',
		'font',
		'[color]'
	];
	const notSelectors = excludedSelectors.map((sel) => `:not(${sel})`).join('');

	// Apply the preference only to top-level body elements and let it inherit.
	// Painting it on every descendant would override nested content that should
	// keep its own value - text inside a heading, sub/sup, or a code block - and
	// shrink/recolour/re-font it (CO-3793). Inheritance covers nested content;
	// the author's inline styles still win.
	const declarations: string[] = [];
	if (style?.color) {
		declarations.push(`color: ${style.color};`);
	}
	if (style?.fontSize) {
		declarations.push(`font-size: ${style.fontSize};`);
	}
	declarations.push(`font-family: ${fontFamily};`);

	const styles = [
		'p { margin: 0; }',
		`body > *${notSelectors} {\n\t\t\t${declarations.join('\n\t\t\t')}\n\t\t}`,
		// Some clients (e.g. Outlook) do not inherit font-family into table cells,
		// so set the fallback explicitly. Scoped away from signatures and skipped
		// when the author already styled the cell's font.
		`body > *:not(.signature-div) td:not([style*="font"]),\n\t\tbody > *:not(.signature-div) th:not([style*="font"]) {\n\t\t\tfont-family: ${fontFamily};\n\t\t}`
	];

	return styles.join('\n\t\t');
};

/**
 * Wraps HTML content with user preference styles and inlines them for email compatibility.
 * This ensures that user preferences are applied to the content while preserving signature styles.
 *
 * @param content - The HTML content to wrap
 * @param style - User preference styles (font, fontSize, color)
 * @param baseContentStyles - Optional base CSS styles to include (e.g., MAIL_EDITOR_CONTENT_STYLES)
 * @returns HTML content with inlined styles
 */
export const applyUserPreferenceStyles = (
	content: string,
	style: UserPreferenceStyle,
	baseContentStyles?: string
): string => {
	const userPrefStyles = generateUserPreferenceStyles(style);
	const allStyles = baseContentStyles ? `${baseContentStyles}\n${userPrefStyles}` : userPrefStyles;

	const htmlWithStyles = `<html><head><style>${allStyles}</style></head><body>${content}</body></html>`;

	// Inline the CSS styles into the HTML elements for email client compatibility
	return extractBodyWithInlinedStyles(htmlWithStyles);
};
