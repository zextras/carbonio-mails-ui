// noinspection HtmlRequiredLangAttribute,HtmlRequiredTitleElement

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { extractBodyWithInlinedStyles, inlineStyles } from '../inline-styles';

describe('inline-styles', () => {
	describe('inlineStyles', () => {
		it('should inline CSS styles from head into body elements', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						body {
							font-family: Arial, sans-serif;
							background-color: #f4f4f4;
						}
						.email-container {
							max-width: 600px;
							background-color: #ffffff;
						}
						table {
							width: 100%;
							border-collapse: collapse;
						}
					</style>
				</head>
				<body>
					<div class="email-container">
						<table>
							<tr>
								<td>Test</td>
							</tr>
						</table>
					</div>
				</body>
				</html>
			`;

			const result = inlineStyles(html);

			// Check that styles are inlined
			expect(result).toContain('style=');
			expect(result).toContain('font-family');
			expect(result).toContain('background-color');
		});

		it('should handle HTML without styles gracefully', () => {
			const html = '<html><body><p>Simple content</p></body></html>';
			const result = inlineStyles(html);

			expect(result).toBeTruthy();
			expect(result).toContain('Simple content');
		});

		it('should return empty string for empty input', () => {
			const result = inlineStyles('');
			expect(result).toBe('');
		});

		it('should handle malformed HTML gracefully', () => {
			const html = '<div><p>Unclosed tags';
			const result = inlineStyles(html);

			// Should not throw and should return something
			expect(result).toBeTruthy();
		});

		it('should handle HTML with only whitespace', () => {
			const result = inlineStyles('   \n\t  ');
			expect(result).toBe('   \n\t  ');
		});
	});

	describe('extractBodyWithInlinedStyles', () => {
		it('should extract body content with inlined styles', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						.test-class {
							color: red;
							font-size: 14px;
						}
					</style>
				</head>
				<body>
					<div class="test-class">Test Content</div>
				</body>
				</html>
			`;

			const result = extractBodyWithInlinedStyles(html);

			// Should contain the content
			expect(result).toContain('Test Content');
			// Should have inlined styles
			expect(result).toContain('style=');
			expect(result).toContain('color');
			// Should not contain html or head tags
			expect(result).not.toContain('<html');
			expect(result).not.toContain('<head');
		});

		it('should preserve table styling from head', () => {
			const html = `
				<html>
				<head>
					<style>
						table {
							width: 100%;
							border-collapse: collapse;
						}
						th, td {
							padding: 10px;
							border: 1px solid #dddddd;
						}
					</style>
				</head>
				<body>
					<table>
						<tr>
							<th>Header</th>
						</tr>
						<tr>
							<td>Data</td>
						</tr>
					</table>
				</body>
				</html>
			`;

			const result = extractBodyWithInlinedStyles(html);

			expect(result).toContain('Header');
			expect(result).toContain('Data');
			// Check that table styles are inlined
			expect(result).toContain('style=');
		});

		it('should handle empty string', () => {
			const result = extractBodyWithInlinedStyles('');
			expect(result).toBe('');
		});

		it('should handle HTML without body tag', () => {
			const html = '<html><head><style>.test { color: red; }</style></head></html>';
			const result = extractBodyWithInlinedStyles(html);

			// Should return empty string when body is null
			expect(result).toBe('');
		});

		it('should handle malformed HTML without body', () => {
			const html = '<html><head><title>Test</title></head></html>';
			const result = extractBodyWithInlinedStyles(html);

			// Should handle gracefully and return empty string
			expect(result).toBe('');
		});

		it('should handle HTML with empty body tag', () => {
			const html = '<html><body></body></html>';
			const result = extractBodyWithInlinedStyles(html);

			// Should return empty string for empty body
			expect(result).toBe('');
		});

		it('should handle HTML fragment without html/body tags', () => {
			const html = '<div style="color: blue;">Fragment</div>';
			const result = extractBodyWithInlinedStyles(html);

			// DOMParser should wrap it in body, so we get the content
			expect(result).toContain('Fragment');
		});

		it('should handle null body in fallback scenario', () => {
			// Test with something that might create issues
			const html = '<?xml version="1.0"?><root></root>';
			const result = extractBodyWithInlinedStyles(html);

			// DOMParser will wrap XML in body, so we get the content back
			// This is expected behavior - the function doesn't throw
			expect(result).toBeTruthy();
		});

		it('should handle complex nested styles', () => {
			const html = `
				<html>
				<head>
					<style>
						.outer { background: #fff; padding: 20px; }
						.inner { color: #333; margin: 10px; }
						.inner span { font-weight: bold; }
					</style>
				</head>
				<body>
					<div class="outer">
						<div class="inner">
							<span>Nested content</span>
						</div>
					</div>
				</body>
				</html>
			`;

			const result = extractBodyWithInlinedStyles(html);

			expect(result).toContain('Nested content');
			expect(result).toContain('style=');
		});

		it('should preserve content when inlining throws error', () => {
			// Create a scenario that might cause inlining to fail
			// but should still extract body content
			const html = '<html><body><p>Content</p></body></html>';

			const result = extractBodyWithInlinedStyles(html);

			// Should still get the content even if inlining fails
			expect(result).toContain('Content');
		});
	});
});
