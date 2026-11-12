/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Text, type SelectItem } from '@zextras/carbonio-design-system';

import { normalizeCssValue } from '../rich-toolbar-plugin-model';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

// Symbol fonts render the label as unreadable glyphs: keep the label in the default font
const FONTS_WITHOUT_PREVIEW = new Set(['wingdings', 'webdings']);

const hasFontPreview = (fontValue: string): boolean =>
	!FONTS_WITHOUT_PREVIEW.has(fontValue.split(',')[0].trim().toLowerCase());

// The custom component replaces the design-system `ListItemContent`, which is the only thing
// marking the current option: replicate its bold weight.
const renderFontLabel = (font: SelectItem, selected: boolean): React.JSX.Element => (
	<Text
		weight={selected ? 'bold' : 'regular'}
		style={hasFontPreview(font.value) ? { fontFamily: font.value } : undefined}
	>
		{font.label}
	</Text>
);

type FontAndSizeSelects = {
	fontSelectItems: Array<SelectItem>;
	fontSizeSelectItems: Array<SelectItem>;
	selectedFont: SelectItem;
	selectedFontSize: SelectItem;
};

export function useFontAndSizeSelects(
	currentFont: string,
	currentFontSize: string,
	preferredFontFamily?: string,
	preferredFontSize?: string
): FontAndSizeSelects {
	const fonts = useMemo<Array<SelectItem>>(
		() => getFonts().map((font) => ({ label: font.label, value: font.value })),
		[]
	);

	const fontSizeSelectItems = useMemo<Array<SelectItem>>(
		() => getFontSizesOptions().map((size) => ({ label: size, value: size })),
		[]
	);

	const defaultFont = useMemo<SelectItem>(
		() =>
			fonts.find(
				(item) => normalizeCssValue(item.value) === normalizeCssValue(preferredFontFamily ?? '')
			) ?? fonts[0],
		[fonts, preferredFontFamily]
	);

	const defaultFontSize = useMemo<SelectItem>(
		() =>
			fontSizeSelectItems.find(
				(item) => normalizeCssValue(item.value) === normalizeCssValue(preferredFontSize ?? '')
			) ?? fontSizeSelectItems[0],
		[fontSizeSelectItems, preferredFontSize]
	);

	const selectedFont = useMemo<SelectItem>(
		() =>
			fonts.find((item) => normalizeCssValue(item.value) === normalizeCssValue(currentFont)) ??
			defaultFont,
		[currentFont, defaultFont, fonts]
	);

	const fontSelectItems = useMemo<Array<SelectItem>>(
		() =>
			fonts.map((font) => ({
				...font,
				customComponent: renderFontLabel(font, font.value === selectedFont.value)
			})),
		[fonts, selectedFont]
	);

	const selectedFontSize = useMemo<SelectItem>(
		() =>
			fontSizeSelectItems.find(
				(item) => normalizeCssValue(item.value) === normalizeCssValue(currentFontSize)
			) ?? defaultFontSize,
		[currentFontSize, defaultFontSize, fontSizeSelectItems]
	);

	return { fontSelectItems, fontSizeSelectItems, selectedFont, selectedFontSize };
}
