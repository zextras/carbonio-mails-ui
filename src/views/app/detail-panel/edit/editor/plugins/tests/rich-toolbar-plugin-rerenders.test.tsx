/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, waitFor } from '@testing-library/react';
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	type ElementFormatType,
	type LexicalEditor
} from 'lexical';

import { areActiveFormattingEqual, DEFAULT_ACTIVE_FORMATTING } from '../rich-toolbar-plugin-model';
import { setupTest, screen } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

const renders = vi.hoisted(() => ({ toolbarButtons: 0 }));

vi.mock('../toolbar-icon-button', async (importOriginal) => {
	const original = await importOriginal<typeof import('../toolbar-icon-button')>();
	const Original = original.ToolbarIconButton;
	return {
		...original,
		ToolbarIconButton: (props: React.ComponentProps<typeof Original>): React.JSX.Element => {
			renders.toolbarButtons += 1;
			return <Original {...props} />;
		}
	};
});

async function openEditor(): Promise<LexicalEditor> {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: 'hello', richText: '<p>hello</p>' };
	setupEditorStore({ editors: [editor] });
	setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	const lexicalEditor = (
		screen.getByTestId('edit-view-editor') as unknown as { __lexicalEditor: LexicalEditor }
	).__lexicalEditor;
	await waitFor(() => {
		expect(lexicalEditor.getEditorState().read(() => $getRoot().getTextContent())).toBe('hello');
	});
	act(() => {
		lexicalEditor.update(
			() => {
				$getRoot().getAllTextNodes()[0].select(5, 5);
			},
			{ discrete: true }
		);
	});
	return lexicalEditor;
}

function typeCharacter(editor: LexicalEditor): void {
	act(() => {
		editor.update(
			() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					selection.insertText('a');
				}
			},
			{ discrete: true }
		);
	});
}

describe('Rich toolbar re-renders', () => {
	it('does not render its buttons again when typing does not change what they show', async () => {
		const editor = await openEditor();
		typeCharacter(editor);
		renders.toolbarButtons = 0;

		typeCharacter(editor);
		typeCharacter(editor);
		typeCharacter(editor);

		expect(renders.toolbarButtons).toBe(0);
	});

	it('renders its buttons again when the formatting at the caret changes', async () => {
		const editor = await openEditor();
		renders.toolbarButtons = 0;

		act(() => {
			editor.update(
				() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						selection.formatText('bold');
					}
				},
				{ discrete: true }
			);
		});

		expect(renders.toolbarButtons).toBeGreaterThan(0);
	});
});

describe('areActiveFormattingEqual', () => {
	const copy = (): typeof DEFAULT_ACTIVE_FORMATTING => ({
		...DEFAULT_ACTIVE_FORMATTING,
		formats: { ...DEFAULT_ACTIVE_FORMATTING.formats }
	});

	it('is true for the same values in different objects', () => {
		expect(areActiveFormattingEqual(DEFAULT_ACTIVE_FORMATTING, copy())).toBe(true);
	});

	it.each([
		['bold', { ...copy(), formats: { ...copy().formats, bold: true } }],
		['italic', { ...copy(), formats: { ...copy().formats, italic: true } }],
		['underline', { ...copy(), formats: { ...copy().formats, underline: true } }],
		['strikethrough', { ...copy(), formats: { ...copy().formats, strikethrough: true } }],
		['alignment', { ...copy(), align: 'center' as ElementFormatType }],
		['direction', { ...copy(), direction: 'rtl' as const }],
		['list', { ...copy(), list: 'bullet' as const }]
	])('is false when the %s differs', (_, changed) => {
		expect(areActiveFormattingEqual(DEFAULT_ACTIVE_FORMATTING, changed)).toBe(false);
	});
});
