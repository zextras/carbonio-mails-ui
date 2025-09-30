/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AccountSettingsPrefs } from '@zextras/carbonio-ui-soap-lib';

export interface EditorStyle {
	font?: string;
	fontSize?: string;
	color?: string;
}

/**
 * Creates default style configuration for the TinyMCE editor based on user preferences
 * @param userPreferences - User preferences from carbonio shell
 * @returns Editor style configuration object
 */
export function createEditorDefaultStyle(
	userPreferences?: AccountSettingsPrefs | undefined
): EditorStyle {
	return {
		font: userPreferences?.zimbraPrefHtmlEditorDefaultFontFamily,
		fontSize: userPreferences?.zimbraPrefHtmlEditorDefaultFontSize,
		color: userPreferences?.zimbraPrefHtmlEditorDefaultFontColor
	};
}

/**
 * Generates the content_style CSS string for TinyMCE editor
 * @param style - Editor style configuration
 * @returns CSS string to be used in TinyMCE content_style
 */
export function generateEditorContentStyle(style: EditorStyle): string {
	return `body { color: ${style.color}; font-size: ${style.fontSize}; font-family: ${style.font}; }`;
}
