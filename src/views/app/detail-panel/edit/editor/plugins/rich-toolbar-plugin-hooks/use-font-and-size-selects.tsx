/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';

import { Container, Text, type SelectItem } from '@zextras/carbonio-design-system';

import { normalizeCssValue } from '../rich-toolbar-plugin-model';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

// Symbol fonts render the label as unreadable glyphs: keep the label in the default font
const FONTS_WITHOUT_PREVIEW = ['wingdings'];

const hasFontPreview = (fontValue: string): boolean =>
	!FONTS_WITHOUT_PREVIEW.includes(fontValue.split(',')[0].trim().toLowerCase());

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
	const fontSelectItems = useMemo<Array<SelectItem>>(
		() =>
			getFonts().map((font) => ({
				label: font.label,
				value: font.value,
				customComponent: (
					<Container mainAlignment="flex-start" crossAlignment="flex-start" height="fit">
						<Text style={hasFontPreview(font.value) ? { fontFamily: font.value } : undefined}>
							{font.label}
						</Text>
					</Container>
				)
			})),
		[]
	);

	const fontSizeSelectItems = useMemo<Array<SelectItem>>(
		() => getFontSizesOptions().map((size) => ({ label: size, value: size })),
		[]
	);

	const defaultFont = useMemo<SelectItem>(
		() =>
			fontSelectItems.find(
				(item) => normalizeCssValue(item.value) === normalizeCssValue(preferredFontFamily ?? '')
			) ?? fontSelectItems[0],
		[fontSelectItems, preferredFontFamily]
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
			fontSelectItems.find(
				(item) => normalizeCssValue(item.value) === normalizeCssValue(currentFont)
			) ?? defaultFont,
		[currentFont, defaultFont, fontSelectItems]
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
