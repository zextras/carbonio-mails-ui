/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, waitFor } from '@testing-library/react';
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$setSelection,
	type LexicalEditor
} from 'lexical';

import {
	BACKGROUND_COLOR_LABEL,
	EDITOR_TESTID,
	installRangeRectPolyfill,
	richTextOf,
	setupWithSelectedContent,
	TEXT_COLOR_LABEL
} from './rich-toolbar-plugin-test-utils';
import { screen } from '@test-setup';

beforeAll(() => {
	installRangeRectPolyfill();
});

describe('RichToolbarPlugin - colors', () => {
	it('applies the selected text color', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: TEXT_COLOR_LABEL }));
		await user.click(await screen.findByTestId('color-swatch-red'));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('color: rgb(239, 83, 80)');
		});
	});

	it('applies the selected background color', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: BACKGROUND_COLOR_LABEL }));
		await user.click(await screen.findByTestId('color-swatch-blue'));

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('background-color: rgb(43, 115, 210)');
		});
	});

	it('still applies the color after the editor selection is lost, as happens while typing a hex value', async () => {
		const { editorId, user } = await setupWithSelectedContent();

		await user.click(screen.getByRole('button', { name: TEXT_COLOR_LABEL }));
		const hexInput = await screen.findByTestId('color-swatch-picker-hex-input');

		// Simulate the live selection being lost while the picker is open (the
		// same failure mode the native color-picker dialog used to trigger),
		// then confirm committing a color through the hex field still lands on
		// the text that was selected before the selection was lost.
		const editorElement = screen.getByTestId(EDITOR_TESTID) as HTMLElement & {
			__lexicalEditor: LexicalEditor;
		};
		act(() => {
			editorElement.__lexicalEditor.update(() => {
				$setSelection(null);
			});
		});

		await user.clear(hexInput);
		await user.paste('ff0000');

		await waitFor(() => {
			expect(richTextOf(editorId)).toContain('color: rgb(255, 0, 0)');
		});
	});

	it('sets the pending format for the next typed characters when picking a color with the caret collapsed (no selection)', async () => {
		// This is the bug report's exact scenario: "write something, pick a
		// different color, start writing again" — the new color must apply to
		// characters typed *after* the caret, not just to already-selected
		// text. For a collapsed selection Lexical tracks that as a pending
		// `style` on the live `RangeSelection` (see `$patchStyleText`'s
		// collapsed-selection branch), so this asserts that field directly
		// rather than simulating the rest of the keystrokes: jsdom's zeroed
		// layout geometry makes it resolve any further real click back into
		// the editor to an imprecise caret position, which would reset the
		// pending format the same way it would for an actual (non-buggy)
		// click to a different spot in a real browser — an environment
		// limitation, not something this fix controls.
		const { user } = await setupWithSelectedContent();

		const editorElement = screen.getByTestId(EDITOR_TESTID) as HTMLElement & {
			__lexicalEditor: LexicalEditor;
		};
		act(() => {
			editorElement.__lexicalEditor.update(() => {
				$getRoot().getLastDescendant()?.selectEnd();
			});
		});

		await user.click(screen.getByRole('button', { name: TEXT_COLOR_LABEL }));
		await user.click(await screen.findByTestId('color-swatch-red'));

		let pendingStyle = '';
		editorElement.__lexicalEditor.getEditorState().read(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				pendingStyle = selection.style;
			}
		});
		expect(pendingStyle).toContain('color: #ef5350');
	});

	it('closes the picker and hands focus back to the editor after picking a preset swatch', async () => {
		const { user } = await setupWithSelectedContent();
		const editorElement = screen.getByTestId(EDITOR_TESTID);

		await user.click(screen.getByRole('button', { name: TEXT_COLOR_LABEL }));
		expect(screen.getByTestId('color-swatch-picker')).toBeVisible();

		await user.click(await screen.findByTestId('color-swatch-red'));

		expect(screen.queryByTestId('color-swatch-picker')).not.toBeInTheDocument();
		expect(editorElement).toHaveFocus();
	});
});
