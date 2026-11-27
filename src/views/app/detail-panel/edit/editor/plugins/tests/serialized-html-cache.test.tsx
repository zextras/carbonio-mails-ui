/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { $generateHtmlFromNodes } from '@lexical/html';
import { $dfs } from '@lexical/utils';
import { act, waitFor } from '@testing-library/react';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isElementNode,
	$isTextNode,
	type LexicalEditor
} from 'lexical';

import { createSerializedHtmlCache, type SerializedContent } from '../serialized-html-cache';
import { setupTest, screen } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { TINYMCE_BASE_CONTENT_STYLES } from 'constants/tinymce-content-styles';
import {
	applyUserPreferenceStyles,
	type UserPreferenceStyle
} from 'helpers/user-preference-styles';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { editorUtils } from 'views/app/detail-panel/edit/editor/parts/editor-utils';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';

const NO_STYLE: UserPreferenceStyle = { font: undefined, fontSize: undefined, color: undefined };
const CUSTOM_STYLE: UserPreferenceStyle = { font: 'verdana', fontSize: '14pt', color: '#ff0000' };

const REPLY_TO_A_THREAD = [
	'<p>my reply</p>',
	'<div class="signature-div"><p>Regards</p></div>',
	'<hr id="zwchr">',
	'<div style="font-size: 12pt"><p>On Monday, Alice wrote:</p>',
	'<blockquote style="border-left: 1px solid #ccc"><p>first quote</p>',
	'<table style="border-collapse: collapse"><tbody><tr>',
	'<td style="border: 1px solid #ccc">cell A</td><td>cell B</td>',
	'</tr></tbody></table>',
	'<blockquote><p>nested quote</p></blockquote></blockquote></div>'
].join('');

const EDITED_QUOTE = 'nested quote EDITED';

const PARAGRAPHS = '<p>one</p><p>two</p><p>three</p>';

const WITH_INLINE_IMAGE =
	'<p>picture</p><p><img src="http://service/part/2" data-pnsrc="cid:img1@zextras" alt="a"></p><p>after</p>';

function getEditor(element: HTMLElement): LexicalEditor {
	return (element as unknown as { __lexicalEditor: LexicalEditor }).__lexicalEditor;
}

/** Renders the real composer, so the nodes and the export are the ones used in production. */
async function openEditor(html: string): Promise<LexicalEditor> {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'initial', richText: html };
	editor.isDirty = false;
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	const lexicalEditor = getEditor(screen.getByTestId(EDITOR_TESTID));
	// The initial content is loaded in an effect.
	await waitFor(() => {
		expect(lexicalEditor.getEditorState().read(() => $getRoot().getTextContent())).not.toBe('');
	});
	return lexicalEditor;
}

/** What the plugin did before the cache: the whole document, in one go. */
function serializeWholeDocument(
	editor: LexicalEditor,
	style: UserPreferenceStyle
): SerializedContent {
	return editor.getEditorState().read(
		() => {
			const richText = applyUserPreferenceStyles(
				$generateHtmlFromNodes(editor, null),
				style,
				TINYMCE_BASE_CONTENT_STYLES
			);
			return {
				richText,
				plainText: $getRoot().getTextContent(),
				usedCids: editorUtils.retrieveCIdsFromContent({ htmlContent: richText }).usedCids,
				reexportedNodes: 0
			};
		},
		{ editor }
	);
}

function serializeWithCache(
	cache: ReturnType<typeof createSerializedHtmlCache>,
	editor: LexicalEditor,
	style: UserPreferenceStyle = NO_STYLE
): SerializedContent {
	return cache.serialize(editor, editor.getEditorState(), style);
}

function expectSameAsWholeDocument(
	editor: LexicalEditor,
	actual: SerializedContent,
	style: UserPreferenceStyle = NO_STYLE
): void {
	const expected = serializeWholeDocument(editor, style);
	expect(actual.richText).toBe(expected.richText);
	expect(actual.plainText).toBe(expected.plainText);
	expect(actual.usedCids).toEqual(expected.usedCids);
}

function topLevelNodeCount(editor: LexicalEditor): number {
	return editor.getEditorState().read(() => $getRoot().getChildrenSize());
}

function update(editor: LexicalEditor, fn: () => void): void {
	act(() => {
		editor.update(fn, { discrete: true });
	});
}

function appendToFirstText(editor: LexicalEditor, suffix: string): void {
	update(editor, () => {
		const firstText = $getRoot().getAllTextNodes()[0];
		firstText.setTextContent(`${firstText.getTextContent()}${suffix}`);
	});
}

function replaceText(editor: LexicalEditor, current: string, replacement: string): void {
	update(editor, () => {
		const target = $dfs()
			.map(({ node }) => node)
			.find((node) => $isTextNode(node) && node.getTextContent() === current);
		if ($isTextNode(target)) {
			target.setTextContent(replacement);
		}
	});
}

describe('createSerializedHtmlCache', () => {
	describe('output', () => {
		it.each([
			['a reply to a thread', REPLY_TO_A_THREAD, 'my reply'],
			['plain paragraphs', PARAGRAPHS, 'one'],
			['an inline image', WITH_INLINE_IMAGE, 'picture']
		])('is the same the whole document produces for %s', async (_, html, firstText) => {
			const editor = await openEditor(html);
			expect(editor.getEditorState().read(() => $getRoot().getTextContent())).toContain(firstText);

			const result = serializeWithCache(createSerializedHtmlCache(), editor);

			expectSameAsWholeDocument(editor, result);
			expect(result.richText).not.toBe('');
		});

		it('reports the cids of the inline images', async () => {
			const editor = await openEditor(WITH_INLINE_IMAGE);

			const result = serializeWithCache(createSerializedHtmlCache(), editor);

			expect(result.usedCids).toEqual(['cid:img1@zextras']);
		});

		it('is the same the whole document produces for an empty document', async () => {
			const editor = await openEditor('<p>x</p>');
			update(editor, () => $getRoot().clear());

			const result = serializeWithCache(createSerializedHtmlCache(), editor);

			expectSameAsWholeDocument(editor, result);
			expect(result.richText).toBe('');
		});
	});

	describe('what is exported again', () => {
		it('exports every top-level node the first time', async () => {
			const editor = await openEditor(REPLY_TO_A_THREAD);

			const result = serializeWithCache(createSerializedHtmlCache(), editor);

			expect(result.reexportedNodes).toBe(topLevelNodeCount(editor));
		});

		it('exports nothing when nothing changed', async () => {
			const editor = await openEditor(REPLY_TO_A_THREAD);
			const cache = createSerializedHtmlCache();
			serializeWithCache(cache, editor);

			const result = serializeWithCache(cache, editor);

			expect(result.reexportedNodes).toBe(0);
			expectSameAsWholeDocument(editor, result);
		});

		it('exports only the compose area when typing in it, not the quoted thread', async () => {
			const editor = await openEditor(REPLY_TO_A_THREAD);
			const cache = createSerializedHtmlCache();
			serializeWithCache(cache, editor);

			appendToFirstText(editor, ' typed');
			const result = serializeWithCache(cache, editor);

			expect(result.reexportedNodes).toBe(1);
			expect(result.richText).toContain('my reply typed');
			expectSameAsWholeDocument(editor, result);
		});

		it('exports again the node of an edit made deep inside it', async () => {
			const editor = await openEditor(REPLY_TO_A_THREAD);
			const cache = createSerializedHtmlCache();
			serializeWithCache(cache, editor);

			// The top-level node that holds the text is not cloned by Lexical: only
			// the text node is, and the ancestors are marked as dirty.
			replaceText(editor, 'nested quote', EDITED_QUOTE);
			const result = serializeWithCache(cache, editor);

			expect(result.reexportedNodes).toBe(1);
			expect(result.richText).toContain(EDITED_QUOTE);
			expectSameAsWholeDocument(editor, result);
		});

		it('exports again the content of a cell edited in a table', async () => {
			const editor = await openEditor(REPLY_TO_A_THREAD);
			const cache = createSerializedHtmlCache();
			serializeWithCache(cache, editor);

			replaceText(editor, 'cell B', 'cell B EDITED');
			const result = serializeWithCache(cache, editor);

			expect(result.richText).toContain('cell B EDITED');
			expectSameAsWholeDocument(editor, result);
		});
	});

	describe('history and structure changes', () => {
		it('follows an undo, which brings back older nodes', async () => {
			const editor = await openEditor(REPLY_TO_A_THREAD);
			const beforeTheEdit = editor.getEditorState();
			replaceText(editor, 'nested quote', EDITED_QUOTE);
			// The cache learns the edited content and has to notice that it is gone.
			const cache = createSerializedHtmlCache();
			expect(serializeWithCache(cache, editor).richText).toContain('EDITED');

			act(() => {
				editor.setEditorState(beforeTheEdit);
			});
			const result = serializeWithCache(cache, editor);

			expect(result.richText).not.toContain('EDITED');
			expectSameAsWholeDocument(editor, result);
		});

		it('styles the paragraph that stops being the last one like any other', async () => {
			// The base styles reset the bottom margin of the last paragraph (`p:last-child`).
			const editor = await openEditor(PARAGRAPHS);
			const cache = createSerializedHtmlCache();
			serializeWithCache(cache, editor);

			update(editor, () => {
				const paragraph = $createParagraphNode();
				paragraph.append($createTextNode('four'));
				$getRoot().append(paragraph);
			});
			const result = serializeWithCache(cache, editor);

			expect(result.reexportedNodes).toBe(2);
			expectSameAsWholeDocument(editor, result);
		});

		it('styles the paragraph that becomes the last one like the last one', async () => {
			const editor = await openEditor(PARAGRAPHS);
			const cache = createSerializedHtmlCache();
			serializeWithCache(cache, editor);

			update(editor, () => {
				$getRoot().getLastChild()?.remove();
			});
			const result = serializeWithCache(cache, editor);

			expect(result.richText).not.toContain('three');
			expectSameAsWholeDocument(editor, result);
		});

		it('keeps the order when a top-level node is moved', async () => {
			const editor = await openEditor(PARAGRAPHS);
			const cache = createSerializedHtmlCache();
			serializeWithCache(cache, editor);

			update(editor, () => {
				const first = $getRoot().getFirstChild();
				if ($isElementNode(first)) {
					$getRoot().append(first);
				}
			});
			const result = serializeWithCache(cache, editor);

			expect(result.plainText.replace(/\s+/g, ' ')).toBe('two three one');
			expectSameAsWholeDocument(editor, result);
		});
	});

	describe('style preferences', () => {
		it('processes the whole content again when the preferences change', async () => {
			const editor = await openEditor(REPLY_TO_A_THREAD);
			const cache = createSerializedHtmlCache();
			const withoutPreferences = serializeWithCache(cache, editor, NO_STYLE);

			const result = serializeWithCache(cache, editor, CUSTOM_STYLE);

			expect(result.reexportedNodes).toBe(topLevelNodeCount(editor));
			expect(result.richText).not.toBe(withoutPreferences.richText);
			expectSameAsWholeDocument(editor, result, CUSTOM_STYLE);
		});

		it('keeps what it processed while the preferences stay the same', async () => {
			const editor = await openEditor(REPLY_TO_A_THREAD);
			const cache = createSerializedHtmlCache();
			serializeWithCache(cache, editor, CUSTOM_STYLE);

			const result = serializeWithCache(cache, editor, { ...CUSTOM_STYLE });

			expect(result.reexportedNodes).toBe(0);
		});
	});
});
