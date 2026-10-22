/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable testing-library/prefer-user-event -- the Tab keydown must hit the editor root with a Lexical selection placed programmatically */
import React from 'react';

import { act, fireEvent, waitFor } from '@testing-library/react';
import { $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from 'lexical';

import { installRangeRectPolyfill } from './rich-toolbar-plugin-test-utils';
import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const EDITOR_TESTID = 'edit-view-editor';
const NESTED_LISTITEM_CLASS = 'mails-lexical-nested-listitem';

function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

async function setupEditor(
	richText: string,
	waitForText: string
): Promise<{ editorId: string; editor: LexicalEditor; editorElement: HTMLElement }> {
	const mailEditor = generateNewMessageEditor();
	mailEditor.text = { plainText: '', richText };
	setupEditorStore({ editors: [mailEditor] });
	setupTest(<RichTextEditorContainer editorId={mailEditor.id} onDragOver={vi.fn()} />);
	const editorElement = screen.getByTestId(EDITOR_TESTID);
	await within(editorElement).findByText(waitForText);
	const editor = (editorElement as HTMLElement & { __lexicalEditor: LexicalEditor })
		.__lexicalEditor;
	return { editorId: mailEditor.id, editor, editorElement };
}

/** Places the caret at the start of the block returned by `$find`. */
function placeCaretIn(editor: LexicalEditor, $find: () => LexicalNode | null): void {
	act(() => {
		editor.update(
			() => {
				const node = $find();
				if ($isElementNode(node)) {
					node.selectStart();
				}
			},
			{ discrete: true }
		);
	});
}

/** Returns false when the editor prevented the browser default (focus move). */
function pressTab(editorElement: HTMLElement, shiftKey = false): boolean {
	return fireEvent.keyDown(editorElement, { key: 'Tab', shiftKey });
}

/** The second item of the first list (a ListItemNode). */
function $secondListItem(): LexicalNode | null {
	const list = $getRoot().getFirstChild();
	return $isElementNode(list) ? list.getChildAtIndex(1) : null;
}

describe('ListTabIndentationPlugin', () => {
	beforeAll(() => {
		installRangeRectPolyfill();
	});

	it('nests the current list item on Tab', async () => {
		const { editorId, editor, editorElement } = await setupEditor(
			'<ul><li>first</li><li>second</li></ul>',
			'second'
		);
		placeCaretIn(editor, $secondListItem);

		expect(pressTab(editorElement)).toBe(false);

		await waitFor(() => {
			expect(richTextOf(editorId)).toMatch(/<li[^>]*>.*first.*<ul[^>]*>\s*<li[^>]*>.*second/);
		});
	});

	it('un-nests the current list item on Shift+Tab', async () => {
		const { editorId, editor, editorElement } = await setupEditor(
			'<ul><li>first</li><li>second</li></ul>',
			'second'
		);
		placeCaretIn(editor, $secondListItem);
		pressTab(editorElement);
		await waitFor(() => {
			expect(richTextOf(editorId).match(/<ul/g)).toHaveLength(2);
		});

		// The nested item now lives in the inner list.
		placeCaretIn(editor, () => {
			const list = $getRoot().getFirstChild();
			const wrapper = $isElementNode(list) ? list.getLastChild() : null;
			const innerList = $isElementNode(wrapper) ? wrapper.getFirstChild() : null;
			return $isElementNode(innerList) ? innerList.getFirstChild() : null;
		});

		expect(pressTab(editorElement, true)).toBe(false);

		await waitFor(() => {
			expect(richTextOf(editorId).match(/<ul/g)).toHaveLength(1);
		});
	});

	it('leaves Tab to the browser outside a list so focus can move on', async () => {
		const { editorId, editor, editorElement } = await setupEditor(
			'<p>plain text</p>',
			'plain text'
		);
		placeCaretIn(editor, () => $getRoot().getFirstChild());
		const before = richTextOf(editorId);

		expect(pressTab(editorElement)).toBe(true);
		expect(pressTab(editorElement, true)).toBe(true);
		expect(richTextOf(editorId)).toBe(before);
	});

	it('hides the bullet of the wrapper item Lexical adds around a nested list', async () => {
		const { editorElement } = await setupEditor(
			'<ul><li>first</li><li><ul><li>nested</li></ul></li></ul>',
			'nested'
		);

		const items = within(editorElement).getAllByRole('listitem');
		const wrappers = items.filter((item) => item.classList.contains(NESTED_LISTITEM_CLASS));
		expect(wrappers).toHaveLength(1);
		expect(within(wrappers[0]).getByText('nested')).toBeInTheDocument();
		// Only the wrapper is marked: the regular items keep their bullet.
		expect(within(wrappers[0]).queryByText('first')).not.toBeInTheDocument();
	});
});
