/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { setupTest, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';
import { RichTextEditorContainer } from 'views/app/detail-panel/edit/editor/parts/rich-text-editor-container';

export const SELECTED_TEXT = 'hello world';
export const DEFAULT_HTML = `<p>${SELECTED_TEXT}</p>`;
export const EDITOR_TESTID = 'edit-view-editor';
export const PARAGRAPH_LABEL = 'lexical-label.paragraph';
export const BOLD_LABEL = 'lexical-label.bold';
export const LINK_LABEL = 'lexical-label.link';
export const LTR_LABEL = 'lexical-label.ltr';
export const RTL_LABEL = 'lexical-label.rtl';
export const ALIGN_LEFT_LABEL = 'lexical-label.align_left';
export const ALIGN_CENTER_LABEL = 'lexical-label.align_center';
export const TEXT_COLOR_LABEL = 'lexical-label.text_color';
export const BACKGROUND_COLOR_LABEL = 'lexical-label.background_color';
export const SELECT_INDEX = { font: 0, size: 1, paragraph: 2 };

export type TestUser = ReturnType<typeof setupTest>['user'];

export function installRangeRectPolyfill(): void {
	if (typeof Range.prototype.getBoundingClientRect !== 'function') {
		Range.prototype.getBoundingClientRect = (): DOMRect =>
			({
				bottom: 0,
				height: 0,
				left: 0,
				right: 0,
				top: 0,
				width: 0,
				x: 0,
				y: 0,
				toJSON: () => ({})
			}) as DOMRect;
	}
}

export function richTextOf(editorId: string): string {
	return useEditorsStore.getState().editors[editorId]?.text.richText ?? '';
}

export function setupEditor(richText = DEFAULT_HTML): { editorId: string; user: TestUser } {
	const editor = generateNewMessageEditor();
	editor.text = { plainText: SELECTED_TEXT, richText };
	setupEditorStore({ editors: [editor] });
	const { user } = setupTest(<RichTextEditorContainer editorId={editor.id} onDragOver={vi.fn()} />);
	return { editorId: editor.id, user };
}

/** Renders the editor, waits for the initial content and selects all of it. */
export async function setupWithSelectedContent(richText = DEFAULT_HTML): Promise<{
	editorId: string;
	user: TestUser;
	editorElement: HTMLElement;
}> {
	const { editorId, user } = setupEditor(richText);
	const editorElement = screen.getByTestId(EDITOR_TESTID);
	await within(editorElement).findByText(SELECTED_TEXT);
	await user.click(editorElement);
	await user.keyboard('{Control>}a{/Control}');
	return { editorId, user, editorElement };
}

/**
 * Opens the font / size / paragraph `Select` at the given position. The selects
 * render no label and the chevron icon has `pointer-events: none`, so the
 * dropdown is opened by clicking the focusable trigger box around the chevron.
 */
export async function openSelect(user: TestUser, index: number): Promise<void> {
	const chevron = screen.getAllByTestId('icon: ArrowDown')[index];
	const trigger = chevron.closest('[tabindex="0"]');
	if (trigger === null) {
		throw new Error('select trigger not found');
	}
	await user.click(trigger);
}
