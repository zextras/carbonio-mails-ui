/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { $generateHtmlFromNodes } from '@lexical/html';
import { type LexicalEditor } from 'lexical';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { LineType } from 'commons/utils';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';

function getEditor(element: HTMLElement): LexicalEditor {
	return (element as unknown as { __lexicalEditor: LexicalEditor }).__lexicalEditor;
}

async function mountWith(richText: string, waitForText: string): Promise<LexicalEditor> {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'body', richText };
	editor.isDirty = false;
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	const editorElement = screen.getByTestId(EDITOR_TESTID);
	await within(editorElement).findByText(waitForText);
	return getEditor(editorElement);
}

function exportedHtml(editor: LexicalEditor): string {
	let html = '';
	editor.read(() => {
		html = $generateHtmlFromNodes(editor, null);
	});
	return html;
}

describe('QuotedSeparatorNode', () => {
	it(`keeps the <hr id="${LineType.HTML_SEP_ID}"> separator through an editor round-trip`, async () => {
		const editor = await mountWith(
			`<p>Reply body</p><hr id="${LineType.HTML_SEP_ID}"><div><p>Quoted text</p></div>`,
			'Quoted text'
		);

		const html = exportedHtml(editor);
		const doc = new DOMParser().parseFromString(html, 'text/html');

		// The separator survives, so the quoted-text boundary can still be found.
		expect(doc.getElementById(LineType.HTML_SEP_ID)).not.toBeNull();
		expect(html).toContain(`id="${LineType.HTML_SEP_ID}"`);
	});

	it('preserves both the signature wrapper and the quoted separator together (reply case)', async () => {
		const editor = await mountWith(
			`<p>Reply body</p><div class="signature-div"><p>My Signature</p></div><hr id="${LineType.HTML_SEP_ID}"><div><p>Quoted text</p></div>`,
			'My Signature'
		);

		const html = exportedHtml(editor);
		const doc = new DOMParser().parseFromString(html, 'text/html');

		const separator = doc.getElementById(LineType.HTML_SEP_ID);
		const signature = doc.getElementsByClassName('signature-div').item(0);

		expect(separator).not.toBeNull();
		expect(signature).not.toBeNull();
		// The signature sits before the quoted-text separator, so a signature
		// change can be placed just above the quote.
		expect(html.indexOf('signature-div')).toBeLessThan(
			html.indexOf(`id="${LineType.HTML_SEP_ID}"`)
		);
	});
});
