/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { STATIC_LOCALES } from 'views/app/detail-panel/edit/composer/locale-consts';

/**
 * Type guard to check if a string is a valid locale key
 */
function isLocaleKey(key: string): key is keyof typeof STATIC_LOCALES {
	return key in STATIC_LOCALES;
}

/**
 * Calculates the language code for TinyMCE based on user preferences
 * @param userLocale - The user's preferred locale from preferences
 * @returns The language code to use for TinyMCE
 */
export function calculateTinyMCELanguage(userLocale: string | undefined): string {
	const locale = userLocale ?? 'en';
	const localeObj = isLocaleKey(locale) ? STATIC_LOCALES[locale] : undefined;

	return (
		(localeObj &&
			(('tinymceLocale' in localeObj && localeObj?.tinymceLocale) || localeObj?.value)) ||
		locale
	);
}
