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
 * Generates CSS styles that apply user preferences to email content while excluding signature elements
 * and special formatting elements.
 *
 * The selectors target only non-signature, non-special-element content to prevent styles from
 * cascading into elements that should maintain their original styling.
 *
 * Note: Elements with explicit inline styles (e.g., style="color: red") will have those styles
 * inlined with higher specificity after CSS processing, so they will take precedence over
 * user preferences. The juice library respects CSS specificity when inlining.
 *
 * @param style - User preference styles (font, fontSize, color)
 * @returns CSS string with user preference styles
 */
export const generateUserPreferenceStyles = (style: UserPreferenceStyle): string => {
	const styles: string[] = [];

	// Only apply styles if at least one preference is defined
	const hasStyles = style?.color || style?.fontSize || style?.font;

	if (!hasStyles) {
		return 'p { margin: 0; }';
	}

	// Build CSS that applies user preferences to all elements except signature, headings, links, and special elements
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
	const topLevelSelector = `body > *${notSelectors}`;
	const descendantSelector = `body > *:not(.signature-div) *${notSelectors}`;

	const buildRule = (selector: string, includeFontSize: boolean): string => {
		const declarations: string[] = [];
		if (style?.color) {
			declarations.push(`color: ${style.color};`);
		}
		// font-size is applied at the top level only. Inheriting it (instead of
		// forcing it on every descendant) lets nested content keep its own size -
		// e.g. text inside a heading, or sub/sup - rather than being shrunk to the
		// preference size (CO-3793).
		if (includeFontSize && style?.fontSize) {
			declarations.push(`font-size: ${style.fontSize};`);
		}
		if (style?.font) {
			declarations.push(`font-family: ${style.font};`);
		}
		return `${selector} {\n\t\t\t${declarations.join('\n\t\t\t')}\n\t\t}`;
	};

	styles.push('p { margin: 0; }');
	styles.push(buildRule(topLevelSelector, true));
	// Skip the descendant rule when font-size is the only preference (it would be empty)
	if (style?.color || style?.font) {
		styles.push(buildRule(descendantSelector, false));
	}

	return styles.join('\n\t\t');
};

/**
 * Wraps HTML content with user preference styles and inlines them for email compatibility.
 * This ensures that user preferences are applied to the content while preserving signature styles.
 *
 * @param content - The HTML content to wrap
 * @param style - User preference styles (font, fontSize, color)
 * @param baseContentStyles - Optional base CSS styles to include (e.g., TINYMCE_BASE_CONTENT_STYLES)
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
