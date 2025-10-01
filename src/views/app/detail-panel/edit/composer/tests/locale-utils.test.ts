/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { calculateTinyMCELanguage } from '../locale-utils';

// Mock the locale constants
jest.mock('views/app/detail-panel/edit/composer/locale-consts', () => ({
	STATIC_LOCALES: {
		zh_CN: {
			name: '中文 (中国)',
			value: 'zh_CN',
			tinymceLocale: 'zh-Hans',
			labelKey: 'locale.label_chinese',
			labelDefaultValue: 'Chinese (China) - {{value}}'
		},
		nl: {
			name: 'Nederlands',
			value: 'nl',
			tinymceLocale: 'nl',
			labelKey: 'locale.label_dutch',
			labelDefaultValue: 'Dutch - {{value}}'
		},
		en: {
			name: 'English',
			value: 'en',
			tinymceLocale: 'en',
			labelKey: 'locale.label_english',
			labelDefaultValue: 'English - {{value}}'
		},
		de: {
			name: 'Deutsch',
			value: 'de',
			tinymceLocale: 'de',
			labelKey: 'locale.label_german',
			labelDefaultValue: 'German - {{value}}'
		},
		hu: {
			name: 'Magyar',
			value: 'hu',
			tinymceLocale: 'hu_HU',
			labelKey: 'locale.label_hungarian',
			labelDefaultValue: 'Hungarian - {{value}}'
		},
		it: {
			name: 'italiano',
			value: 'it',
			tinymceLocale: 'it',
			labelKey: 'locale.label_italian',
			labelDefaultValue: 'Italian - {{value}}'
		},
		// Test case without tinymceLocale property
		testLocale: {
			name: 'Test Locale',
			value: 'test_locale',
			labelKey: 'locale.label_test',
			labelDefaultValue: 'Test - {{value}}'
		}
	}
}));

describe('calculateTinyMCELanguage', () => {
	describe('when userLocale is undefined', () => {
		it('should return "en" as default locale', () => {
			const result = calculateTinyMCELanguage(undefined);
			expect(result).toBe('en');
		});
	});

	describe('when userLocale is valid and has tinymceLocale', () => {
		it('should return the tinymceLocale for Chinese', () => {
			const result = calculateTinyMCELanguage('zh_CN');
			expect(result).toBe('zh-Hans');
		});

		it('should return the tinymceLocale for Dutch', () => {
			const result = calculateTinyMCELanguage('nl');
			expect(result).toBe('nl');
		});

		it('should return the tinymceLocale for English', () => {
			const result = calculateTinyMCELanguage('en');
			expect(result).toBe('en');
		});

		it('should return the tinymceLocale for German', () => {
			const result = calculateTinyMCELanguage('de');
			expect(result).toBe('de');
		});

		it('should return the tinymceLocale for Hungarian', () => {
			const result = calculateTinyMCELanguage('hu');
			expect(result).toBe('hu_HU');
		});

		it('should return the tinymceLocale for Italian', () => {
			const result = calculateTinyMCELanguage('it');
			expect(result).toBe('it');
		});
	});

	describe('when userLocale is valid but has no tinymceLocale', () => {
		it('should return the value property as fallback', () => {
			const result = calculateTinyMCELanguage('testLocale');
			expect(result).toBe('test_locale');
		});
	});

	describe('when userLocale is not in STATIC_LOCALES', () => {
		it('should return the original locale for unknown locale', () => {
			const result = calculateTinyMCELanguage('unknown_locale');
			expect(result).toBe('unknown_locale');
		});

		it('should return the original locale for empty string', () => {
			const result = calculateTinyMCELanguage('');
			expect(result).toBe('');
		});

		it('should return the original locale for random string', () => {
			const result = calculateTinyMCELanguage('xyz123');
			expect(result).toBe('xyz123');
		});
	});

	describe('edge cases', () => {
		it('should handle null as undefined', () => {
			const result = calculateTinyMCELanguage(null as unknown as string);
			expect(result).toBe('en');
		});

		it('should handle locale with special characters', () => {
			const result = calculateTinyMCELanguage('en-US@variant');
			expect(result).toBe('en-US@variant');
		});

		it('should handle numeric locale strings', () => {
			const result = calculateTinyMCELanguage('123');
			expect(result).toBe('123');
		});
	});

	describe('locale precedence', () => {
		it('should prefer tinymceLocale over value when both exist', () => {
			// All test locales with tinymceLocale should return tinymceLocale, not value
			const result = calculateTinyMCELanguage('zh_CN');
			expect(result).toBe('zh-Hans'); // tinymceLocale
			expect(result).not.toBe('zh_CN'); // value
		});

		it('should use value when tinymceLocale is missing', () => {
			// testLocale doesn't have tinymceLocale, should use value
			const result = calculateTinyMCELanguage('testLocale');
			expect(result).toBe('test_locale'); // value
		});
	});
});
