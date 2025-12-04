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
 * Generates CSS styles that apply user preferences to email content while excluding signature elements.
 * The selectors target only non-signature content to prevent styles from cascading into signatures.
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

	// Build CSS that applies user preferences to all elements except signature, headings, and links
	// Using :not(.signature-div) ensures signature and its children are excluded
	// Using :not(h1-h6) ensures headings maintain their styles
	// Using :not(a[href]) ensures links maintain their color styling
	let userPrefRules =
		'body > *:not(.signature-div):not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(a[href]),\n\t\tbody > *:not(.signature-div) *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(a[href]) {\n';

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
