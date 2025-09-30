/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createEditorDefaultStyle, generateEditorContentStyle } from '../editor-style-utils';

describe('editor-style-utils', () => {
	const htmlEditorDefaultFontFamily = 'Arial, sans-serif';
	describe('createEditorDefaultStyle', () => {
		it('should return style object with all properties when prefs are provided', () => {
			const prefs = {
				zimbraPrefHtmlEditorDefaultFontFamily: htmlEditorDefaultFontFamily,
				zimbraPrefHtmlEditorDefaultFontSize: '14px',
				zimbraPrefHtmlEditorDefaultFontColor: '#333333'
			};

			const result = createEditorDefaultStyle(prefs);

			expect(result).toEqual({
				font: htmlEditorDefaultFontFamily,
				fontSize: '14px',
				color: '#333333'
			});
		});

		it('should return style object with undefined properties when prefs are not provided', () => {
			const result = createEditorDefaultStyle();

			expect(result).toEqual({
				font: undefined,
				fontSize: undefined,
				color: undefined
			});
		});

		it('should return style object with partial properties when some prefs are missing', () => {
			const prefs = {
				zimbraPrefHtmlEditorDefaultFontFamily: htmlEditorDefaultFontFamily,
				zimbraPrefHtmlEditorDefaultFontColor: '#333333'
			};

			const result = createEditorDefaultStyle(prefs);

			expect(result).toEqual({
				font: htmlEditorDefaultFontFamily,
				fontSize: undefined,
				color: '#333333'
			});
		});
	});

	describe('generateEditorContentStyle', () => {
		it('should generate correct CSS string with all style properties', () => {
			const style = {
				font: htmlEditorDefaultFontFamily,
				fontSize: '14px',
				color: '#333333'
			};

			const result = generateEditorContentStyle(style);

			expect(result).toBe(
				'body { color: #333333; font-size: 14px; font-family: Arial, sans-serif; }'
			);
		});

		it('should generate CSS string with undefined values when properties are missing', () => {
			const style = {
				font: undefined,
				fontSize: undefined,
				color: undefined
			};

			const result = generateEditorContentStyle(style);

			expect(result).toBe(
				'body { color: undefined; font-size: undefined; font-family: undefined; }'
			);
		});

		it('should generate CSS string with mixed defined and undefined properties', () => {
			const style = {
				font: htmlEditorDefaultFontFamily,
				fontSize: undefined,
				color: '#333333'
			};

			const result = generateEditorContentStyle(style);

			expect(result).toBe(
				'body { color: #333333; font-size: undefined; font-family: Arial, sans-serif; }'
			);
		});
	});
});
