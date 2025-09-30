/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	generateToolbarConfig,
	generateQuickBarsConfig,
	createTinyMCEConfig
} from '../tinymce-config-utils';

describe('tinymce-config-utils', () => {
	describe('generateToolbarConfig', () => {
		it('should return false for inline mode', () => {
			const result = generateToolbarConfig(true);
			expect(result).toBe(false);
		});

		it('should return toolbar string for non-inline mode', () => {
			const result = generateToolbarConfig(false);
			expect(typeof result).toBe('string');
			expect(result).toContain('fontfamily');
			expect(result).toContain('bold italic');
			expect(result).toContain('imageSelector');
		});
	});

	describe('generateQuickbarsConfig', () => {
		it('should return correct config for inline mode', () => {
			const result = generateQuickBarsConfig(true);
			expect(result).toEqual({
				quickbars_insert_toolbar: 'bullist numlist',
				quickbars_selection_toolbar:
					'bold italic underline | forecolor backcolor | removeformat | link'
			});
		});

		it('should return correct config for non-inline mode', () => {
			const result = generateQuickBarsConfig(false);
			expect(result).toEqual({
				quickbars_insert_toolbar: '',
				quickbars_selection_toolbar: 'link'
			});
		});
	});

	describe('createTinyMCEConfig', () => {
		const mockSetup = jest.fn();

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should create config with all required properties', () => {
			const options = {
				language: 'en',
				inline: false,
				contentStyle: 'body { color: #000; }',
				setup: mockSetup
			};

			const result = createTinyMCEConfig(options);

			expect(result.language).toBe('en');
			expect(result.inline).toBe(false);
			expect(result.content_style).toBe('body { color: #000; }');
			expect(result.setup).toBe(mockSetup);
			expect(result.min_height).toBe(350);
			expect(result.auto_focus).toBe(true);
			expect(result.menubar).toBe(false);
		});

		it('should include BASE_PATH in content_css and language_url', () => {
			const options = {
				language: 'de',
				inline: false,
				contentStyle: 'body { color: #000; }'
			};

			const result = createTinyMCEConfig(options);

			expect(result.content_css).toEqual(['']);
			expect(result.language_url).toBe('/test-base-path/tinymce/langs/de.js');
		});

		it('should merge custom options correctly', () => {
			const options = {
				language: 'en',
				inline: false,
				contentStyle: 'body { color: #000; }',
				customOptions: {
					min_height: 500,
					custom_property: 'test-value'
				}
			};

			const result = createTinyMCEConfig(options);

			expect(result.min_height).toBe(500); // overridden
			expect(result.custom_property).toBe('test-value'); // added
		});

		it('should use correct toolbar configuration based on inline mode', () => {
			const inlineOptions = {
				language: 'en',
				inline: true,
				contentStyle: 'body { color: #000; }'
			};

			const normalOptions = {
				language: 'en',
				inline: false,
				contentStyle: 'body { color: #000; }'
			};

			const inlineResult = createTinyMCEConfig(inlineOptions);
			const normalResult = createTinyMCEConfig(normalOptions);

			expect(inlineResult.toolbar).toBe(false);
			expect(normalResult.toolbar).toContain('fontfamily');
		});
	});
});
