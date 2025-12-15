/* eslint-disable sonarjs/no-duplicate-string */
// noinspection HtmlRequiredLangAttribute,HtmlRequiredTitleElement

/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	applyUserPreferenceStyles,
	generateUserPreferenceStyles,
	type UserPreferenceStyle
} from '../user-preference-styles';

describe('user-preference-styles', () => {
	describe('generateUserPreferenceStyles', () => {
		it('should return only paragraph reset when no preferences are provided', () => {
			const style: UserPreferenceStyle = {
				font: undefined,
				fontSize: undefined,
				color: undefined
			};

			const result = generateUserPreferenceStyles(style);

			expect(result).toBe('p { margin: 0; }');
		});

		it('should generate CSS with color preference only', () => {
			const style: UserPreferenceStyle = {
				font: undefined,
				fontSize: undefined,
				color: '#ff0000'
			};

			const result = generateUserPreferenceStyles(style);

			expect(result).toContain('color: #ff0000;');
			expect(result).not.toContain('font-size:');
			expect(result).not.toContain('font-family:');
		});

		it('should generate CSS with font-size preference only', () => {
			const style: UserPreferenceStyle = {
				font: undefined,
				fontSize: '14pt',
				color: undefined
			};

			const result = generateUserPreferenceStyles(style);

			expect(result).toContain('font-size: 14pt;');
			expect(result).not.toContain('color:');
			expect(result).not.toContain('font-family:');
		});

		it('should generate CSS with font-family preference only', () => {
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: undefined,
				color: undefined
			};

			const result = generateUserPreferenceStyles(style);

			expect(result).toContain('font-family: Arial, sans-serif;');
			expect(result).not.toContain('color:');
			expect(result).not.toContain('font-size:');
		});

		it('should generate CSS with all preferences', () => {
			const style: UserPreferenceStyle = {
				font: 'Georgia, serif',
				fontSize: '16pt',
				color: '#333333'
			};

			const result = generateUserPreferenceStyles(style);

			expect(result).toContain('color: #333333;');
			expect(result).toContain('font-size: 16pt;');
			expect(result).toContain('font-family: Georgia, serif;');
		});

		it('should exclude signature div from selector', () => {
			const style: UserPreferenceStyle = {
				font: 'Arial',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = generateUserPreferenceStyles(style);

			expect(result).toContain(':not(.signature-div)');
		});

		it('should exclude all heading tags from selector', () => {
			const style: UserPreferenceStyle = {
				font: 'Arial',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = generateUserPreferenceStyles(style);

			expect(result).toContain(':not(h1)');
			expect(result).toContain(':not(h2)');
			expect(result).toContain(':not(h3)');
			expect(result).toContain(':not(h4)');
			expect(result).toContain(':not(h5)');
			expect(result).toContain(':not(h6)');
		});

		it('should exclude anchor tags with href from selector', () => {
			const style: UserPreferenceStyle = {
				font: 'Arial',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = generateUserPreferenceStyles(style);

			expect(result).toContain(':not(a[href])');
		});

		it('should exclude special formatting elements from selector', () => {
			const style: UserPreferenceStyle = {
				font: 'Arial',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = generateUserPreferenceStyles(style);

			expect(result).toContain(':not(button)');
			expect(result).toContain(':not(code)');
			expect(result).toContain(':not(pre)');
			expect(result).toContain(':not(mark)');
			expect(result).toContain(':not(blockquote)');
			expect(result).toContain(':not(caption)');
		});
	});

	describe('applyUserPreferenceStyles', () => {
		it('should apply user preferences to paragraph content', () => {
			const content = '<p>Hello World</p>';
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '14pt',
				color: '#ff0000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('Hello World');
			expect(result).toContain('color');
			expect(result).toContain('font');
		});

		it('should not apply user preferences to signature content', () => {
			const content = `
				<p>Email body</p>
				<div class="signature-div" style="color: blue; font-family: Times;">
					<p>My Signature</p>
				</div>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '14pt',
				color: '#ff0000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('signature-div');
			expect(result).toContain('My Signature');
			// Signature should keep its own styling
			expect(result).toContain('Times');
		});

		it('should not apply user preferences to headings', () => {
			const content = `
				<h1>Main Heading</h1>
				<p>Body text</p>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('Main Heading');
			expect(result).toContain('Body text');
		});

		it('should not apply user preferences to links', () => {
			const content = `
				<p>Check out <a href="https://example.com">this link</a></p>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '12pt',
				color: '#ff0000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('this link');
			expect(result).toContain('href');
		});

		it('should not apply user preferences to code blocks', () => {
			const content = `
				<p>Here is some code: <code>console.log('hello')</code></p>
				<pre><code>function test() { return true; }</code></pre>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('console.log');
			expect(result).toContain('function test');
		});

		it('should not apply user preferences to blockquotes', () => {
			const content = `
				<p>Regular text</p>
				<blockquote>Quoted text</blockquote>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('Regular text');
			expect(result).toContain('Quoted text');
		});

		it('should include base content styles when provided', () => {
			const content = '<p>Hello World</p>';
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '14pt',
				color: '#000000'
			};
			const baseStyles = 'body { margin: 0; } h1 { font-size: 24px; }';

			const result = applyUserPreferenceStyles(content, style, baseStyles);

			expect(result).toContain('Hello World');
		});

		it('should work with empty content', () => {
			const content = '';
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '14pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toBe('');
		});

		it('should handle complex nested HTML', () => {
			const content = `
				<div>
					<p>Paragraph 1</p>
					<div class="signature-div">
						<p>Signature line 1</p>
						<p>Signature line 2</p>
					</div>
					<table>
						<caption>Table Title</caption>
						<tr>
							<th>Header</th>
							<td>Cell</td>
						</tr>
					</table>
				</div>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('Paragraph 1');
			expect(result).toContain('Signature line 1');
			expect(result).toContain('Table Title');
			expect(result).toContain('Header');
		});

		it('should preserve existing inline styles on elements', () => {
			const content = '<p style="font-weight: bold; background: yellow;">Styled text</p>';
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '14pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('Styled text');
			expect(result).toContain('bold');
		});

		it('should handle RTL content with blockquotes', () => {
			const content = `
				<p>Regular text</p>
				<blockquote dir="rtl">نص عربي</blockquote>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('نص عربي');
			expect(result).toContain('rtl');
		});

		it('should not apply preferences to buttons', () => {
			const content = `
				<p>Click here:</p>
				<button style="background: blue; color: white;">Action Button</button>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '12pt',
				color: '#ff0000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('Action Button');
			expect(result).toContain('button');
		});

		it('should not apply preferences to mark/highlight elements', () => {
			const content = '<p>This is <mark>highlighted text</mark> in a paragraph.</p>';
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('highlighted text');
			expect(result).toContain('mark');
		});

		it('should handle multiple signatures in content', () => {
			const content = `
				<p>Email body</p>
				<div class="signature-div">Signature 1</div>
				<p>More text</p>
				<div class="signature-div">Signature 2</div>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '14pt',
				color: '#ff0000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('Signature 1');
			expect(result).toContain('Signature 2');
			expect(result).toContain('Email body');
			expect(result).toContain('More text');
		});

		it('should apply preferences to divs and spans but not special elements', () => {
			const content = `
				<div>Regular div</div>
				<span>Regular span</span>
				<code>Code span</code>
				<blockquote>Quote</blockquote>
			`;
			const style: UserPreferenceStyle = {
				font: 'Arial, sans-serif',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('Regular div');
			expect(result).toContain('Regular span');
			expect(result).toContain('Code span');
			expect(result).toContain('Quote');
		});
	});

	describe('edge cases', () => {
		it('should handle malformed HTML gracefully', () => {
			const content = '<p>Unclosed paragraph<div>Nested div</p></div>';
			const style: UserPreferenceStyle = {
				font: 'Arial',
				fontSize: '12pt',
				color: '#000000'
			};

			expect(() => applyUserPreferenceStyles(content, style)).not.toThrow();
		});

		it('should handle HTML with special characters', () => {
			const content = '<p>Text with &lt;special&gt; &amp; characters &quot;quoted&quot;</p>';
			const style: UserPreferenceStyle = {
				font: 'Arial',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('special');
			expect(result).toContain('characters');
		});

		it('should handle very long font family strings', () => {
			const content = '<p>Test</p>';
			const style: UserPreferenceStyle = {
				font: 'CustomFont, Arial, Helvetica, "Times New Roman", Times, serif, sans-serif',
				fontSize: '12pt',
				color: '#000000'
			};

			const result = applyUserPreferenceStyles(content, style);

			expect(result).toContain('Test');
		});

		it('should handle null/undefined in style object gracefully', () => {
			const content = '<p>Test</p>';
			const style: UserPreferenceStyle = {
				font: undefined,
				fontSize: undefined,
				color: undefined
			};

			expect(() => applyUserPreferenceStyles(content, style)).not.toThrow();
		});
	});
});
