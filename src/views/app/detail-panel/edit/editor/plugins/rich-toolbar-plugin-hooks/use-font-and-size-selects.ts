/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { type SelectItem } from '@zextras/carbonio-design-system';

import { normalizeCssValue } from '../rich-toolbar-plugin-model';
import { getFonts, getFontSizesOptions } from 'views/settings/components/utils';

type FontAndSizeSelects = {
	fontSelectItems: Array<SelectItem>;
	fontSizeSelectItems: Array<SelectItem>;
	selectedFont: SelectItem;
	selectedFontSize: SelectItem;
};

export function useFontAndSizeSelects(
	currentFont: string,
	currentFontSize: string
): FontAndSizeSelects {
	const fontSelectItems = useMemo<Array<SelectItem>>(
		() => getFonts().map((font) => ({ label: font.label, value: font.value })),
		[]
	);

	const fontSizeSelectItems = useMemo<Array<SelectItem>>(
		() => getFontSizesOptions().map((size) => ({ label: size, value: size })),
		[]
	);

	const defaultFont = useMemo<SelectItem>(() => fontSelectItems[0], [fontSelectItems]);

	const defaultFontSize = useMemo<SelectItem>(() => fontSizeSelectItems[0], [fontSizeSelectItems]);

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
