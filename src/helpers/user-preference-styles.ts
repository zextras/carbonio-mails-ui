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
		'caption'
	];
	const notSelectors = excludedSelectors.map((sel) => `:not(${sel})`).join('');

	let userPrefRules = `body > *${notSelectors},\n\t\tbody > *:not(.signature-div) *${notSelectors} {\n`;

	if (style?.color) {
		userPrefRules += `\t\t\tcolor: ${style.color};\n`;
	}
	if (style?.fontSize) {
		userPrefRules += `\t\t\tfont-size: ${style.fontSize};\n`;
	}
	if (style?.font) {
		userPrefRules += `\t\t\tfont-family: ${style.font};\n`;
	}

	userPrefRules += '\t\t}';

	styles.push('p { margin: 0; }');
	styles.push(userPrefRules);

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
