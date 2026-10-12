/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/*
 * These tests assert on the exported HTML, which is a detached document parsed from a string
 * (not rendered UI), so Testing Library queries and jest-dom matchers do not apply to it.
 */
/* eslint-disable testing-library/no-node-access, jest-dom/prefer-to-have-style, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-text-content */
import React from 'react';

import { $generateHtmlFromNodes } from '@lexical/html';
import { $createTableNodeWithDimensions } from '@lexical/table';
import { cleanup, waitFor } from '@testing-library/react';
import { $getRoot, type LexicalEditor } from 'lexical';

import { setupTest, screen } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';

function getEditor(element: HTMLElement): LexicalEditor {
	return (element as unknown as { __lexicalEditor: LexicalEditor }).__lexicalEditor;
}

function exportedHtml(editor: LexicalEditor): string {
	let html = '';
	editor.read(() => {
		html = $generateHtmlFromNodes(editor, null);
	});
	return html;
}

async function mountWith(richText: string): Promise<LexicalEditor> {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'body', richText };
	editor.isDirty = false;
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	const lexicalEditor = getEditor(screen.getByTestId(EDITOR_TESTID));
	// The content is loaded in an effect: wait until something has been imported.
	await waitFor(() => expect(exportedHtml(lexicalEditor)).not.toBe(''));
	return lexicalEditor;
}

const parse = (html: string): Document => new DOMParser().parseFromString(html, 'text/html');

describe('structure preservation of imported HTML', () => {
	describe('paragraphs', () => {
		const STYLE =
			"margin:0;padding:0;margin-bottom:16px;margin-top:0;font-size:12pt;font-family:'tahoma' , 'arial' , 'helvetica' , sans-serif";

		it('keeps the inline style of a <p>', async () => {
			const editor = await mountWith(
				`<p dir="ltr" style="${STYLE}"><span style="white-space:pre-wrap">Hi all,</span></p>`
			);

			const paragraph = parse(exportedHtml(editor)).body.querySelector('p');

			expect(paragraph).not.toBeNull();
			expect(paragraph?.style.marginBottom).toBe('16px');
			expect(paragraph?.style.fontSize).toBe('12pt');
			expect(paragraph?.style.fontFamily).toContain('tahoma');
			expect(paragraph?.getAttribute('dir')).toBe('ltr');
			expect(paragraph?.textContent).toBe('Hi all,');
		});

		it('keeps the class and id of a <p>', async () => {
			const editor = await mountWith('<p class="MsoNormal" id="intro">Hello</p>');

			const paragraph = parse(exportedHtml(editor)).body.querySelector('p');

			expect(paragraph?.className).toBe('MsoNormal');
			expect(paragraph?.id).toBe('intro');
		});

		it('does not add attributes to a plain <p>', async () => {
			const editor = await mountWith('<p>Hello</p>');

			const paragraph = parse(exportedHtml(editor)).body.querySelector('p');

			expect(paragraph?.hasAttribute('style')).toBe(false);
			expect(paragraph?.hasAttribute('class')).toBe(false);
		});

		it('keeps the alignment together with the other styles', async () => {
			const editor = await mountWith('<p style="text-align: center; color: red">Hello</p>');

			const paragraph = parse(exportedHtml(editor)).body.querySelector('p');

			expect(paragraph?.style.textAlign).toBe('center');
			expect(paragraph?.style.color).toBe('red');
		});
	});

	describe('divs', () => {
		it('keeps a <div> holding inline content as a <div> with its style', async () => {
			const editor = await mountWith(
				'<div style="font-size: 12pt; font-family: tahoma"><b>From:</b> someone</div>'
			);

			const { body } = parse(exportedHtml(editor));
			const div = body.querySelector('div');

			expect(body.querySelector('p')).toBeNull();
			expect(div?.style.fontSize).toBe('12pt');
			expect(div?.textContent).toBe('From: someone');
		});

		it('keeps a hidden <div> hidden instead of turning it into visible text', async () => {
			const editor = await mountWith(
				'<div style="display: none; max-height: 0">preheader text</div><p>Visible</p>'
			);

			const { body } = parse(exportedHtml(editor));
			const hidden = body.querySelector('div');

			expect(hidden?.style.display).toBe('none');
			expect(hidden?.textContent).toBe('preheader text');
			expect(body.querySelector('p')?.textContent).toBe('Visible');
		});

		it('keeps nested containers and their attributes', async () => {
			const editor = await mountWith(
				'<div class="outer" style="background-color: #eee"><div class="inner" style="padding: 8px"><p>Inside</p></div></div>'
			);

			const { body } = parse(exportedHtml(editor));
			const outer = body.querySelector('div.outer') as HTMLElement | null;
			const inner = outer?.querySelector('div.inner') as HTMLElement | null;

			expect(outer?.style.backgroundColor).toBe('rgb(238, 238, 238)');
			expect(inner?.style.padding).toBe('8px');
			expect(inner?.querySelector('p')?.textContent).toBe('Inside');
		});

		it('wraps inline content mixed with blocks in a container without losing it', async () => {
			const editor = await mountWith(
				'<div style="color: green">Heading text<br><p>Paragraph</p>tail</div>'
			);

			const div = parse(exportedHtml(editor)).body.querySelector('div') as HTMLElement;

			expect(div.style.color).toBe('green');
			expect(div.textContent).toContain('Heading text');
			expect(div.textContent).toContain('Paragraph');
			expect(div.textContent).toContain('tail');
		});

		it('keeps the <center> wrapper', async () => {
			const editor = await mountWith('<center style="color: blue"><p>Centered</p></center>');

			const center = parse(exportedHtml(editor)).body.querySelector('center');

			expect(center?.style.color).toBe('blue');
			expect(center?.textContent).toBe('Centered');
		});

		it('keeps the signature wrapper owned by SignatureNode', async () => {
			const editor = await mountWith(
				'<p>body</p><div class="signature-div"><p>My Signature</p></div>'
			);

			const signatures = parse(exportedHtml(editor)).getElementsByClassName('signature-div');

			expect(signatures).toHaveLength(1);
			expect(signatures.item(0)?.textContent).toBe('My Signature');
		});
	});

	describe('tables', () => {
		const TABLE =
			'<table align="center" width="600" cellpadding="8" cellspacing="0" border="0" style="border-collapse: collapse; width: 600px"><tbody><tr bgcolor="#eeeeee"><td align="center" valign="middle" style="text-align: center; padding: 10px">A</td><td style="text-align: right; vertical-align: bottom">B</td><td>C</td></tr></tbody></table>';

		it('keeps the attributes of the table, rows and cells', async () => {
			const editor = await mountWith(TABLE);

			const { body } = parse(exportedHtml(editor));
			const table = body.querySelector('table') as HTMLTableElement;
			const [first, second] = Array.from(body.querySelectorAll('td'));

			expect(table.getAttribute('align')).toBe('center');
			expect(table.getAttribute('width')).toBe('600');
			expect(table.getAttribute('cellpadding')).toBe('8');
			expect(table.getAttribute('cellspacing')).toBe('0');
			expect(table.getAttribute('border')).toBe('0');
			expect(table.style.borderCollapse).toBe('collapse');
			expect(body.querySelector('tr')?.getAttribute('bgcolor')).toBe('#eeeeee');
			expect(first.getAttribute('align')).toBe('center');
			expect(first.getAttribute('valign')).toBe('middle');
			expect(first.style.textAlign).toBe('center');
			expect(first.style.padding).toBe('10px');
			expect(second.style.textAlign).toBe('right');
			expect(second.style.verticalAlign).toBe('bottom');
		});

		it('does not force a border, a left alignment, a width or a vertical alignment on imported cells', async () => {
			const editor = await mountWith(TABLE);

			const cell = parse(exportedHtml(editor)).body.querySelectorAll('td')[2];

			expect(cell.style.border).toBe('');
			expect(cell.style.textAlign).toBe('');
			expect(cell.style.width).toBe('');
			expect(cell.style.verticalAlign).toBe('');
		});

		it('keeps the stock look for tables created in the editor', async () => {
			const editor = await mountWith('<p>text</p>');

			editor.update(
				() => {
					$getRoot().append($createTableNodeWithDimensions(1, 1, false));
				},
				{ discrete: true }
			);
			const cell = parse(exportedHtml(editor)).body.querySelector('td') as HTMLElement;

			expect(cell.style.border).toContain('1px solid');
		});

		it('is stable across repeated import/export cycles', async () => {
			const first = exportedHtml(await mountWith(TABLE));
			cleanup();
			const second = exportedHtml(await mountWith(first));

			expect(second).toBe(first);
		});
	});

	describe('stylesheets', () => {
		it('keeps the effect of a <style> block by inlining it on the elements', async () => {
			const editor = await mountWith(
				'<style>.note { color: red; margin: 4px }</style><div class="note"><p>Styled by sheet</p></div>'
			);

			const note = parse(exportedHtml(editor)).body.querySelector('div.note') as HTMLElement;

			expect(note.style.color).toBe('red');
		});
	});

	describe('attributes safety', () => {
		it('never preserves event handlers', async () => {
			const editor = await mountWith('<div onclick="alert(1)" style="color: red"><p>x</p></div>');

			const div = parse(exportedHtml(editor)).body.querySelector('div') as HTMLElement;

			expect(div.hasAttribute('onclick')).toBe(false);
			expect(div.style.color).toBe('red');
		});

		it('does not apply positioning styles to the live editor element, but keeps them on export', async () => {
			const editor = await mountWith(
				'<div style="position: fixed; top: 0; color: red"><p>overlay</p></div>'
			);

			const live = screen.getByTestId(EDITOR_TESTID).querySelector('div') as HTMLElement;
			const exported = parse(exportedHtml(editor)).body.querySelector('div') as HTMLElement;

			expect(live.style.position).toBe('');
			expect(live.style.color).toBe('red');
			expect(exported.style.position).toBe('fixed');
		});

		it('does not apply the id of an external message to the live editor element', async () => {
			await mountWith('<div id="root-container"><p>Hello</p></div>');
			const editorElement = screen.getByTestId(EDITOR_TESTID);

			expect(editorElement.querySelector('#root-container')).toBeNull();
		});
	});

	describe('round trip', () => {
		it('is stable across repeated import/export cycles', async () => {
			const original =
				'<div class="outer" style="color: red"><div style="display:none">hidden</div><p style="margin:0;font-size:12pt">One</p><div style="font-size:9pt">Two</div></div>';
			const first = exportedHtml(await mountWith(original));
			cleanup();
			const second = exportedHtml(await mountWith(first));

			expect(second).toBe(first);
		});
	});
});
