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
	});
});

